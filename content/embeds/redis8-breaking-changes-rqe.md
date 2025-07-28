The following changes affect behavior and validation in the Redis Query Engine:
- Enforces validation for `LIMIT` arguments (offset must be 0 if limit is 0).
- Enforces parsing rules for `FT.CURSOR READ` and `FT.ALIASADD`.
- Parentheses are now required for exponentiation precedence in `APPLY` expressions.
- Invalid input now returns errors instead of empty results.
- Default values revisited for reducers like `AVG`, `COUNT`, `SUM`, `STDDEV`, `QUANTILE`, and others.
- Updates to scoring (`BM25` is now the default instead of `TF-IDF`).
- Improved handling of expired records, memory constraints, and malformed fields.

For a full list of the Redis Query Engine-related changes, see the [release notes](https://github.com/redis/redis/releases).