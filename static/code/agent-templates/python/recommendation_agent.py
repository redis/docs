'''
Redis Recommendation Engine

To run this code:
    Install dependencies:
        pip install pandas redisvl[all] redis openai

    Set environment variables:
        export LLM_API_KEY=your_${formData.llmModel.toLowerCase()}_api_key
        export LLM_API_BASE_URL=your_${formData.llmModel.toLowerCase()}_api_base_url
            (optional - default: ${CONFIG.models[formData.llmModel].baseUrl})
        export LLM_MODEL=your_${formData.llmModel.toLowerCase()}_model 
            (optional - default: ${CONFIG.models[formData.llmModel].defaultModel})
        export REDIS_HOST=your_redis_host
        export REDIS_PORT=your_redis_port
        export REDIS_PASSWORD=your_redis_password

The datasets are downloadable from here:

- https://redis-ai-resources.s3.us-east-2.amazonaws.com/recommenders/datasets/collaborative-filtering/ratings_small.csv and
- https://redis-ai-resources.s3.us-east-2.amazonaws.com/recommenders/datasets/collaborative-filtering/movies_metadata.csv

Download those files and place them in the 'datasets/collaborative_filtering/' directory, local to your code.
'''
import os

import openai
import pandas as pd
import redis

from redisvl.schema import IndexSchema
from redisvl.index import SearchIndex
from redisvl.query import FilterQuery
from redisvl.query.filter import Num

class RecommendationAgent:
    def __init__(self, session_name="movie_recommendations"):
        # Validate environment variables
        self.llm_api_key = os.getenv('LLM_API_KEY')
        if not self.llm_api_key:
            raise ValueError("LLM_API_KEY environment variable is required")

        self.llm_base_url = os.getenv('LLM_API_BASE_URL', '${CONFIG.models[formData.llmModel].baseUrl}')
        self.llm_model = os.getenv('LLM_MODEL', '${CONFIG.models[formData.llmModel].defaultModel}')

        # Connect to Redis with error handling
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                username=os.getenv('REDIS_USERNAME', 'default'),
                password=os.getenv('REDIS_PASSWORD', ''),
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test Redis connection
            self.redis_client.ping()
            print("Connected to Redis successfully")

        except redis.ConnectionError as e:
            print(f"Failed to connect to Redis: {e}")
            print("Please check your Redis connection settings and ensure Redis is running.")
            raise
        except Exception as e:
            print(f"Redis connection error: {e}")
            raise

        # Initialize LLM client with error handling
        try:
            self.client = openai.OpenAI(api_key=self.llm_api_key, base_url=self.llm_base_url)
            # Test LLM connection with a simple call
            test_response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            print("Connected to LLM successfully")

        except openai.AuthenticationError:
            print("LLM authentication failed. Please check your API key.")
            raise
        except Exception as e:
            print(f"LLM connection error: {e}")
            raise

        # Initialize the movie index
        self.index = None
        self.movies_df = None
        self._setup_movie_index()

    def _setup_movie_index(self):
        """Load movie data and create Redis index"""
        try:
            print("Loading movie datasets...")

            # Check if data files exist
            ratings_file = 'datasets/collaborative_filtering/ratings_small.csv'
            movies_file = 'datasets/collaborative_filtering/movies_metadata.csv'

            if not os.path.exists(ratings_file):
                raise FileNotFoundError(f"Ratings dataset not found: {ratings_file}")
            if not os.path.exists(movies_file):
                raise FileNotFoundError(f"Movies dataset not found: {movies_file}")

            # Load and prepare data
            ratings_df = pd.read_csv(ratings_file)[['userId', 'movieId', 'rating']]
            movies_df = pd.read_csv(movies_file)[['id', 'title', 'genres', 'revenue']].dropna()

            if ratings_df.empty or movies_df.empty:
                raise ValueError("One or more datasets are empty")

            print(f"Loaded {len(ratings_df)} ratings and {len(movies_df)} movies")

            # Calculate movie popularity metrics
            movie_stats = ratings_df.groupby('movieId').agg({
                'rating': ['count', 'mean']
            }).round(2)
            movie_stats.columns = ['rating_count', 'avg_rating']
            movie_stats['popularity_score'] = movie_stats['rating_count'] * movie_stats['avg_rating']
            movie_stats = movie_stats.reset_index()

            # Merge with movie metadata
            movies_df['movieId'] = movies_df['id'].astype(str)
            movie_stats['movieId'] = movie_stats['movieId'].astype(str)
            self.movies_df = movies_df.merge(movie_stats, on='movieId', how='inner')

            if self.movies_df.empty:
                raise ValueError("No movies found after merging ratings and metadata")

            print(f"Processed {len(self.movies_df)} movies with ratings")

            # Create RedisVL index for popularity-based search
            schema = IndexSchema.from_dict({
                'index': {'name': 'movies', 'prefix': 'movie', 'storage_type': 'json'},
                'fields': [
                    {'name': 'movieId', 'type': 'tag'},
                    {'name': 'title', 'type': 'text'},
                    {'name': 'genres', 'type': 'tag'},
                    {'name': 'revenue', 'type': 'numeric'},
                    {'name': 'rating_count', 'type': 'numeric'},
                    {'name': 'avg_rating', 'type': 'numeric'},
                    {'name': 'popularity_score', 'type': 'numeric'}
                ]
            })

            print("Creating Redis search index...")
            self.index = SearchIndex(schema, redis_client=self.redis_client)
            self.index.create(overwrite=True)
            self.index.load(self.movies_df.to_dict(orient='records'))

            print("Movie recommendation system initialized successfully!")

        except FileNotFoundError as e:
            print(f"Data files not found: {e}")
            print("Please ensure the movie datasets are available in the 'datasets/collaborative_filtering/' directory")
            print("Expected files:")
            print("  - datasets/collaborative_filtering/ratings_small.csv")
            print("  - datasets/collaborative_filtering/movies_metadata.csv")
            self.index = None
        except pd.errors.EmptyDataError as e:
            print(f"Data file is empty or corrupted: {e}")
            self.index = None
        except Exception as e:
            print(f"Error setting up movie index: {e}")
            self.index = None

    def get_popular_movies(self, filters=None, num_results=10, sort_by='popularity_score', sort_order='desc'):
        """Get popular movies based on filters and sorting criteria

        Args:
            filters: Filter expression for the query
            num_results: Number of results to return
            sort_by: Field to sort by ('popularity_score', 'avg_rating', 'rating_count', 'revenue')
            sort_order: Sort order ('asc' for ascending, 'desc' for descending)
        """
        if not self.index:
            return []

        # Create the query
        query = FilterQuery(
            filter_expression=filters,
            return_fields=['title', 'genres', 'rating_count', 'avg_rating', 'popularity_score'],
            num_results=num_results
        )

        # Add sorting with specified order
        asc_order = sort_order.lower() == 'asc'
        query.sort_by(sort_by, asc=asc_order)

        results = self.index.query(query)
        return [(r['title'], r['genres'], r['rating_count'], r['avg_rating'], r['popularity_score'])
                for r in results]

    def get_top_rated_movies(self, min_reviews=50, num_results=10, sort_order='desc'):
        """Get highest rated movies with minimum review count"""
        filters = Num('rating_count') >= min_reviews
        return self.get_popular_movies(filters=filters, num_results=num_results, sort_by='avg_rating', sort_order=sort_order)

    def get_blockbuster_movies(self, min_revenue=50_000_000, num_results=10, sort_order='desc'):
        """Get blockbuster movies with high revenue"""
        filters = Num('revenue') >= min_revenue
        return self.get_popular_movies(filters=filters, num_results=num_results, sort_by='revenue', sort_order=sort_order)

    def get_hidden_gems(self, max_reviews=200, min_rating=7.5, num_results=10, sort_order='desc'):
        """Get lesser-known but highly rated movies"""
        filters = (Num('rating_count') <= max_reviews) & (Num('avg_rating') >= min_rating)
        return self.get_popular_movies(filters=filters, num_results=num_results, sort_by='avg_rating', sort_order=sort_order)

    def get_movies_by_genre(self, genre, num_results=10, sort_by='popularity_score', sort_order='desc'):
        """Get movies filtered by genre (post-processing)"""
        all_movies = self.get_popular_movies(num_results=num_results*3, sort_by=sort_by, sort_order=sort_order)
        genre_movies = []

        for movie in all_movies:
            movie_genres = movie[1].lower() if movie[1] else ""
            if genre.lower() in movie_genres:
                genre_movies.append(movie)
                if len(genre_movies) >= num_results:
                    break

        return genre_movies

    def cleanup(self):
        """Clean up Redis index"""
        if self.index:
            self.index.clear()

    def _parse_user_query(self, user_query: str) -> dict:
        """Use LLM to parse user query and extract recommendation parameters"""
        try:
            system_prompt = """You are a movie recommendation assistant. Parse the user's query and extract relevant parameters for movie filtering.

Return a JSON object with these fields (use null if not specified):
- "genres": array of genre strings (e.g., ["Action", "Comedy"])
- "min_rating": minimum average rating (0-10)
- "min_reviews": minimum number of reviews
- "max_results": number of recommendations (default 5, max 10)
- "sort_by": "popularity_score", "avg_rating", "rating_count", or "revenue"
- "sort_order": "desc" for descending (highest first), "asc" for ascending (lowest first). Default "desc"
- "revenue_filter": "blockbuster" for high-revenue movies, null otherwise

Examples:
- "action movies" -> {"genres": ["Action"], "min_rating": null, "min_reviews": null, "max_results": 5, "sort_by": "popularity_score", "sort_order": "desc", "revenue_filter": null}
- "highly rated comedies with at least 100 reviews" -> {"genres": ["Comedy"], "min_rating": 7.0, "min_reviews": 100, "max_results": 5, "sort_by": "avg_rating", "sort_order": "desc", "revenue_filter": null}
- "lowest rated movies" -> {"genres": null, "min_rating": null, "min_reviews": null, "max_results": 5, "sort_by": "avg_rating", "sort_order": "asc", "revenue_filter": null}
- "popular blockbuster movies" -> {"genres": null, "min_rating": null, "min_reviews": 50, "max_results": 5, "sort_by": "popularity_score", "sort_order": "desc", "revenue_filter": "blockbuster"}"""

            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query}
                ],
                temperature=0.1
            )

            import json
            params = json.loads(response.choices[0].message.content)
            return params

        except Exception as e:
            print(f"Error parsing query: {e}")
            # Return default parameters
            return {"genres": None, "min_rating": None, "min_reviews": None, "max_results": 5, "sort_by": "popularity_score", "sort_order": "desc", "revenue_filter": None}

    def recommend_movies(self, user_query: str) -> str:
        """Process user query and return movie recommendations"""
        if not self.index:
            return "Sorry, the movie database is not available. Please check that the data files are present."

        try:
            # Parse user query
            params = self._parse_user_query(user_query)

            # Build filters based on parsed parameters
            filters = []

            if params.get("min_rating"):
                filters.append(Num('avg_rating') >= params["min_rating"])

            if params.get("min_reviews"):
                filters.append(Num('rating_count') >= params["min_reviews"])

            if params.get("revenue_filter") == "blockbuster":
                filters.append(Num('revenue') > 30_000_000)

            # Combine filters
            combined_filter = None
            if filters:
                combined_filter = filters[0]
                for f in filters[1:]:
                    combined_filter = combined_filter & f

            # Get recommendations
            num_results = min(params.get("max_results", 5), 10)
            sort_by = params.get("sort_by", "popularity_score")
            sort_order = params.get("sort_order", "desc")

            movies = self.get_popular_movies(
                filters=combined_filter,
                num_results=num_results,
                sort_by=sort_by,
                sort_order=sort_order
            )

            # Filter by genre if specified (post-processing since RedisVL genre filtering can be complex)
            if params.get("genres"):
                genre_keywords = [g.lower() for g in params["genres"]]
                filtered_movies = []
                for movie in movies:
                    movie_genres = movie[1].lower() if movie[1] else ""
                    if any(keyword in movie_genres for keyword in genre_keywords):
                        filtered_movies.append(movie)
                movies = filtered_movies[:num_results]

            if not movies:
                return "Sorry, no movies found matching your criteria. Try adjusting your preferences."

            # Format response
            response = f"Based on your request '{user_query}', here are my recommendations:\n\n"
            for i, (title, genres, rating_count, avg_rating, popularity_score) in enumerate(movies, 1):
                response += f"{i}. {title}\n"
                response += f"   Genres: {genres}\n"
                response += f"   Average Rating: {float(avg_rating):.1f}/10 ({int(rating_count)} reviews)\n"
                response += f"   Popularity Score: {float(popularity_score):.1f}\n\n"

            return response

        except Exception as e:
            return f"Sorry, there was an error processing your request: {e}"

if __name__ == "__main__":
    try:
        print("Initializing Redis Movie Recommendation Agent...")
        agent = RecommendationAgent()

        if not agent.index:
            print("Failed to initialize the recommendation system.")
            print("Please check your data files and Redis connection, then try again.")
            exit(1)

        print("\nWelcome to the Redis Movie Recommendation Agent!")
        print("Ask me for movie recommendations and I'll help you find something great to watch.")
        print("Type 'quit' or 'exit' to stop.\n")

        # Demo some initial recommendations
        print("Here's a quick demo of what I can do:")
        print(agent.recommend_movies("Show me some popular movies"))

        # Interactive loop
        while True:
            try:
                user_input = input("\nWhat kind of movies are you looking for? ")

                if user_input.lower() in ['quit', 'exit', 'bye']:
                    print("Thanks for using the movie recommendation agent! Goodbye!")
                    break

                if user_input.strip():
                    response = agent.recommend_movies(user_input)
                    print(f"\n{response}")
                else:
                    print("Please enter a movie preference or type 'quit' to exit.")

            except KeyboardInterrupt:
                print("\n\nGoodbye!")
                break
            except Exception as e:
                print(f"An error occurred: {e}")
                print("Please try again or type 'quit' to exit.")

        # Cleanup
        agent.cleanup()

    except ValueError as e:
        print(f"Configuration error: {e}")
        print("Please check your environment variables and try again.")
        exit(1)
    except Exception as e:
        print(f"Failed to initialize the recommendation agent: {e}")
        exit(1)
