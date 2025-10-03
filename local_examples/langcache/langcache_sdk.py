# EXAMPLE: langcache_sdk
# STEP_START imports_setup
from langcache import LangCache
import os

lang_cache = LangCache(
    server_url=f"https://{os.getenv('HOST', '')}",
    cache_id=os.getenv("CACHE_ID", ""),
    api_key=os.getenv("API_KEY", "")
)
# STEP_END

# STEP_START search_basic
res = lang_cache.search(
    prompt="User prompt text",
    similarity_threshold=0.9
)

print(res)
# STEP_END

# STEP_START search_attributes
res = lang_cache.search(
    prompt="User prompt text",
    attributes={"customAttributeName": "customAttributeValue"},
    similarity_threshold=0.9,
)

print(res)
# STEP_END

# STEP_START store_basic
res = lang_cache.set(
    prompt="User prompt text",
    response="LLM response text",
)

print(res)
# STEP_END

# STEP_START store_attributes
res = lang_cache.set(
    prompt="User prompt text",
    response="LLM response text",
    attributes={"customAttributeName": "customAttributeValue"},
)

print(res)
# STEP_END

# STEP_START delete_entry
res = lang_cache.delete_by_id(entry_id="<entryId>")

print(res)
# STEP_END

# STEP_START delete_query
res = lang_cache.delete_query(
    attributes={"customAttributeName": "customAttributeValue"},
)

print(res)
# STEP_END
