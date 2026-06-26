// EXAMPLE: langcache_sdk
// STEP_START imports_setup
import { LangCache } from "@redis-ai/langcache";

const langCache = new LangCache({
    serverURL: "https://" + process.env.HOST,
    cacheId: process.env.CACHE_ID,
    apiKey: process.env.API_KEY,
  });
// STEP_END

// STEP_START search_basic
async function searchBasic() {
    const result = await langCache.search({
      prompt: "User prompt text",
      similarityThreshold: 0.9,
    });

    console.log(result);
}

searchBasic();
// STEP_END

// STEP_START search_attributes
async function searchAttributes() {
    const result = await langCache.search({
      prompt: "User prompt text",
      attributes: {
        "customAttributeName": "customAttributeValue",
      },
      similarityThreshold: 0.9,
    });

    console.log(result);
}

searchAttributes();
// STEP_END

// STEP_START search_strategies
import { SearchStrategy } from '@redis-ai/langcache/models/searchstrategy.js';

async function searchStrategies() {
    const result = await langCache.search({
      prompt: "User prompt text",
      searchStrategies: [SearchStrategy.Exact, SearchStrategy.Semantic],
      similarityThreshold: 0.9,
    });

    console.log(result);
}

searchStrategies();
// STEP_END

// STEP_START store_basic
async function storeBasic() {
    const result = await langCache.set({
      prompt: "User prompt text",
      response: "LLM response text",
    });

    console.log(result);
}

storeBasic();
// STEP_END

// STEP_START store_attributes
async function storeAttributes() {
    const result = await langCache.set({
      prompt: "User prompt text",
      response: "LLM response text",
      attributes: {
        "customAttributeName": "customAttributeValue",
      },
    });

    console.log(result);
}

storeAttributes();
// STEP_END

// STEP_START delete_entry
async function deleteEntry() {
    const result = await langCache.deleteById({
      entryId: "<entryId>",
    });

    console.log(result);
}

deleteEntry();
// STEP_END

// STEP_START delete_query
async function deleteQuery() {
    const result = await langCache.deleteQuery({
      attributes: {
        "customAttributeName": "customAttributeValue",
      },
    });

    console.log(result);
}

deleteQuery();
// STEP_END

// STEP_START flush
async function flush() {
    await langCache.flush();
}

flush();
// STEP_END
