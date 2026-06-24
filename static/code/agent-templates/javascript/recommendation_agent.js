/*
 * Redis Recommendation Engine (Node.js)
 * Uses node-redis with Redis Search for movie recommendations
 *
 * To run this code:
 *   Install dependencies:
 *     npm install redis openai dotenv csv-parse
 *
 *   Set environment variables:
 *     LLM_API_KEY=your_${formData.llmModel.toLowerCase()}_api_key
 *     LLM_API_BASE_URL=your_base_url  (optional, default: ${CONFIG.models[formData.llmModel].baseUrl})
 *     LLM_MODEL=your_model_name       (optional, default: ${CONFIG.models[formData.llmModel].defaultModel})
 *     REDIS_URL=redis://localhost:6379
 *       (or use REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_USERNAME separately)
 *
 * Download datasets (all three are required):
 *   https://redis-ai-resources.s3.us-east-2.amazonaws.com/recommenders/datasets/collaborative-filtering/ratings_small.csv
 *   https://redis-ai-resources.s3.us-east-2.amazonaws.com/recommenders/datasets/collaborative-filtering/movies_metadata.csv
 *   https://redis-ai-resources.s3.us-east-2.amazonaws.com/recommenders/datasets/collaborative-filtering/links.csv
 * Place them in datasets/collaborative_filtering/ relative to this file.
 * links.csv bridges MovieLens movieIds (ratings) to TMDB ids (movies_metadata).
 */

require('dotenv').config();
const { createClient } = require('redis');
const OpenAI = require('openai');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

const INDEX_NAME   = 'movies_idx';
const MOVIE_PREFIX  = 'movie:';
const LOAD_SENTINEL = 'movies:load_complete';

const CONFIG = {
  maxResults:       10,
  defaultResults:   5,
  minRevenueFilter: 30_000_000,
  validSortFields:  new Set(['popularityScore', 'avgRating', 'ratingCount', 'revenue']),
  validSortOrders:  new Set(['DESC', 'ASC']),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse genres from movies_metadata.csv.
 * The field is stored as a Python-style list of dicts, e.g.:
 *   "[{'id': 28, 'name': 'Action'}, {'id': 12, 'name': 'Adventure'}]"
 * Returns a comma-separated string for use as a Redis TAG field.
 */
function parseGenres(raw) {
  if (!raw || raw === '[]') return '';
  try {
    const json = raw.replace(/'/g, '"').replace(/None/g, 'null').replace(/True/g, 'true').replace(/False/g, 'false');
    const parsed = JSON.parse(json);
    return parsed.map((g) => g?.name).filter(Boolean).join(',');
  } catch {
    console.warn('parseGenres: could not parse genres field, storing empty string. Raw value:', raw?.slice(0, 80));
    return '';
  }
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return isFinite(n) ? n : fallback;
}

/**
 * Validate and sanitize LLM-returned query params.
 * Rejects any field that doesn't match expected types or allowed values.
 */
function validateQueryParams(raw) {
  return {
    genres: Array.isArray(raw?.genres)
      ? raw.genres.filter((g) => typeof g === 'string' && g.trim())
      : null,
    minRating: typeof raw?.minRating === 'number' && raw.minRating >= 0 && raw.minRating <= 5
      ? raw.minRating
      : null,
    minReviews: typeof raw?.minReviews === 'number' && raw.minReviews > 0
      ? Math.floor(raw.minReviews)
      : null,
    maxResults: typeof raw?.maxResults === 'number'
      ? Math.min(Math.max(1, Math.floor(raw.maxResults)), CONFIG.maxResults)
      : CONFIG.defaultResults,
    sortBy: CONFIG.validSortFields.has(raw?.sortBy)
      ? raw.sortBy
      : 'popularityScore',
    sortOrder: CONFIG.validSortOrders.has(raw?.sortOrder?.toUpperCase?.())
      ? raw.sortOrder.toUpperCase()
      : 'DESC',
    revenueFilter: raw?.revenueFilter === true,
  };
}

// ---------------------------------------------------------------------------
// Agent class
// ---------------------------------------------------------------------------

class RecommendationAgent {
  constructor() {
    // For local providers (e.g. Ollama), any non-empty string works. For hosted providers, use your real key.
    this.llmApiKey = process.env.LLM_API_KEY || 'no-key-needed';

    this.llmBaseUrl = process.env.LLM_API_BASE_URL || '${CONFIG.models[formData.llmModel].baseUrl}';
    this.llmModel   = process.env.LLM_MODEL         || '${CONFIG.models[formData.llmModel].defaultModel}';

    this.openai = new OpenAI({ apiKey: this.llmApiKey, baseURL: this.llmBaseUrl });
    this.redisClient = null;
    this.indexReady = false;
  }

  async connect() {
    const clientOptions = process.env.REDIS_URL
      ? { url: process.env.REDIS_URL }
      : {
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
          },
          password: process.env.REDIS_PASSWORD || undefined,
          username: process.env.REDIS_USERNAME  || 'default',
        };

    this.redisClient = createClient(clientOptions);
    this.redisClient.on('error', (err) => console.error('Redis error:', err));
    await this.redisClient.connect();
    console.log('Connected to Redis successfully');
    console.log('LLM configured:', this.llmModel);

    await this._setupMovieIndex();
  }

  async _indexExists() {
    try {
      // Check the sentinel written only after a full successful load.
      // num_docs > 0 alone is not sufficient — a partial import looks non-empty
      // but leaves the index permanently incomplete on subsequent startups.
      return (await this.redisClient.exists(LOAD_SENTINEL)) === 1;
    } catch {
      return false;
    }
  }

  async _setupMovieIndex() {
    // Skip loading if the index already exists and has documents.
    if (await this._indexExists()) {
      console.log('Movie index already loaded, skipping dataset import.');
      this.indexReady = true;
      return;
    }

    const ratingsFile = path.join('datasets', 'collaborative_filtering', 'ratings_small.csv');
    const moviesFile  = path.join('datasets', 'collaborative_filtering', 'movies_metadata.csv');
    const linksFile   = path.join('datasets', 'collaborative_filtering', 'links.csv');

    for (const f of [ratingsFile, moviesFile, linksFile]) {
      if (!fs.existsSync(f)) {
        console.warn(`Movie dataset not found: ${f}. Skipping index setup.`);
        return;
      }
    }

    console.log('Loading movie datasets...');

    let ratings, movies, links;
    try {
      ratings = parse(fs.readFileSync(ratingsFile), { columns: true, cast: true });
      movies  = parse(fs.readFileSync(moviesFile),  { columns: true, cast: true });
      links   = parse(fs.readFileSync(linksFile),   { columns: true, cast: true });
    } catch (err) {
      console.error('Failed to parse dataset files:', err.message);
      return;
    }

    if (!ratings.length || !movies.length || !links.length) {
      console.error('One or more dataset files are empty.');
      return;
    }

    // Aggregate ratings per MovieLens movieId
    const stats = {};
    for (const r of ratings) {
      if (!r.movieId || !isFinite(r.rating)) continue;
      if (!stats[r.movieId]) stats[r.movieId] = { count: 0, total: 0 };
      stats[r.movieId].count++;
      stats[r.movieId].total += r.rating;
    }

    // Build MovieLens movieId → TMDB id bridge via links.csv.
    // ratings_small uses MovieLens ids; movies_metadata uses TMDB ids — they are
    // different id spaces and cannot be joined directly without this mapping.
    const movieLensToTmdb = new Map();
    for (const row of links) {
      if (row.movieId && row.tmdbId) {
        movieLensToTmdb.set(String(row.movieId), String(row.tmdbId));
      }
    }

    // Index movies_metadata by TMDB id for O(1) lookup
    const moviesByTmdb = new Map();
    for (const m of movies) {
      if (m.id) moviesByTmdb.set(String(m.id), m);
    }

    // Join ratings → links → metadata
    const merged = [];
    for (const [movieLensId, s] of Object.entries(stats)) {
      const tmdbId = movieLensToTmdb.get(movieLensId);
      if (!tmdbId) continue;
      const m = moviesByTmdb.get(tmdbId);
      if (!m || !m.title) continue;
      const avgRating = s.total / s.count;
      merged.push({
        movieId:         movieLensId,
        title:           String(m.title).trim(),
        genres:          parseGenres(m.genres),
        revenue:         safeNumber(m.revenue),
        ratingCount:     s.count,
        avgRating:       Math.round(avgRating * 100) / 100,
        popularityScore: Math.round(s.count * avgRating * 100) / 100,
      });
    }

    if (!merged.length) {
      console.error('No valid movies found after merging datasets.');
      return;
    }

    console.log(`Processed ${merged.length} movies`);

    // Drop existing index and its documents so stale movie keys don't survive the reload.
    const indexExists = await this.redisClient.ft.info(INDEX_NAME).then(() => true).catch(() => false);
    if (indexExists) await this.redisClient.ft.dropIndex(INDEX_NAME, { DD: true });

    await this.redisClient.ft.create(
      INDEX_NAME,
      {
        '$.movieId':         { type: 'TAG',     AS: 'movieId' },
        '$.title':           { type: 'TEXT',    AS: 'title' },
        '$.genres':          { type: 'TAG',     AS: 'genres', SEPARATOR: ',' },
        '$.revenue':         { type: 'NUMERIC', AS: 'revenue' },
        '$.ratingCount':     { type: 'NUMERIC', AS: 'ratingCount' },
        '$.avgRating':       { type: 'NUMERIC', AS: 'avgRating' },
        '$.popularityScore': { type: 'NUMERIC', AS: 'popularityScore' },
      },
      { ON: 'JSON', PREFIX: MOVIE_PREFIX }
    );

    // Load using a pipeline for efficiency
    const pipeline = this.redisClient.multi();
    for (const movie of merged) {
      pipeline.json.set(`${MOVIE_PREFIX}${movie.movieId}`, '$', movie);
    }
    await pipeline.exec();

    // Write the sentinel only after all documents are loaded. _indexExists checks
    // this key so a partial import (pipeline fails midway) never looks complete.
    await this.redisClient.set(LOAD_SENTINEL, '1');

    this.indexReady = true;
    console.log('Movie recommendation system initialized successfully!');
  }

  async _parseUserQuery(userQuery) {
    const systemPrompt = `You are a movie recommendation assistant. Parse the user's query and return a JSON object with:
- "genres": array of genre name strings or null
- "minRating": minimum average rating (0-5 star scale) or null
- "minReviews": minimum review count or null
- "maxResults": number of results (default 5, max 10)
- "sortBy": one of "popularityScore", "avgRating", "ratingCount", "revenue"
- "sortOrder": "DESC" or "ASC"
- "revenueFilter": true for blockbusters, null otherwise

Return only valid JSON with no explanation or markdown.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.llmModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.1,
      });

      const raw = JSON.parse(response.choices[0]?.message?.content || '{}');
      return validateQueryParams(raw); // always returns a safe, validated object
    } catch {
      return validateQueryParams({}); // safe defaults on any failure
    }
  }

  async recommendMovies(userQuery) {
    if (!this.indexReady) {
      return 'The movie database is not available. Please check that the dataset files are present.';
    }

    const params = await this._parseUserQuery(userQuery);

    // Build filter parts — genres now filtered in Redis via TAG, not in JavaScript
    const filterParts = [];
    if (params.minRating != null)  filterParts.push(`@avgRating:[${params.minRating} +inf]`);
    if (params.minReviews != null) filterParts.push(`@ratingCount:[${params.minReviews} +inf]`);
    if (params.revenueFilter) filterParts.push(`@revenue:[${CONFIG.minRevenueFilter} +inf]`);
    if (params.genres?.length) {
      // Redis TAG filter: match any of the requested genres.
      // Hyphens (e.g. "Film-Noir") and spaces (e.g. "Science Fiction") are stored intact
      // at ingest, so they must be preserved and backslash-escaped in the query rather
      // than stripped, otherwise hyphenated and multi-word genres never match.
      const tagList = params.genres
        .map((g) => g.replace(/[^a-zA-Z0-9 \-]/g, '').trim()
          .replace(/-/g, '\\-')
          .replace(/ +/g, '\\ '))
        .filter(Boolean)
        .join('|');
      if (tagList) filterParts.push(`@genres:{${tagList}}`);
    }

    const filterQuery = filterParts.length > 0 ? filterParts.join(' ') : '*';

    let results;
    try {
      results = await this.redisClient.ft.search(INDEX_NAME, filterQuery, {
        RETURN: ['title', 'genres', 'ratingCount', 'avgRating', 'popularityScore', 'revenue'],
        SORTBY: { BY: params.sortBy, DIRECTION: params.sortOrder },
        LIMIT: { from: 0, size: params.maxResults },
      });
    } catch (err) {
      console.error('Search error:', err.message);
      return 'Sorry, there was an error searching the movie database.';
    }

    const movies = results?.documents?.map((d) => d.value).filter(Boolean) ?? [];

    if (!movies.length) {
      return "Sorry, no movies found matching your criteria. Try adjusting your preferences.";
    }

    let response = `Based on your request '${userQuery}', here are my recommendations:\n\n`;
    movies.forEach((m, i) => {
      response += `${i + 1}. ${m.title}\n`;
      response += `   Genres: ${m.genres || 'N/A'}\n`;
      response += `   Average Rating: ${parseFloat(m.avgRating || 0).toFixed(1)}/5 (${m.ratingCount || 0} reviews)\n`;
      response += `   Popularity Score: ${parseFloat(m.popularityScore || 0).toFixed(1)}\n`;
      if (m.revenue && parseFloat(m.revenue) > 0) {
        response += `   Box Office: $${(parseFloat(m.revenue) / 1_000_000).toFixed(0)}M\n`;
      }
      response += '\n';
    });
    return response;
  }

  async disconnect() {
    if (this.redisClient) await this.redisClient.disconnect();
  }
}

async function main() {
  const agent = new RecommendationAgent();
  try {
    await agent.connect();
  } catch (err) {
    console.error('Failed to initialize agent:', err.message);
    await agent.disconnect();
    process.exit(1);
  }

  console.log('\nWelcome to the Redis Movie Recommendation Agent!');
  console.log("Ask for movie recommendations. Type 'quit' to exit.\n");
  console.log("Here's a quick demo:");
  console.log(await agent.recommendMovies('Show me some popular movies'));

  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const askQuestion = () => {
    rl.question('\nWhat kind of movies are you looking for? ', async (input) => {
      if (['quit', 'exit', 'bye'].includes(input.toLowerCase())) {
        console.log('Goodbye!');
        rl.close();
        await agent.disconnect();
        return;
      }
      if (input.trim()) {
        try {
          console.log('\n' + await agent.recommendMovies(input));
        } catch (err) {
          console.error('Error:', err.message);
        }
      }
      askQuestion();
    });
  };
  askQuestion();
}

main();
