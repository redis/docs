# Redis Hashes Doc Test Suite

Source page: [`content/develop/data-types/hashes.md`](content/develop/data-types/hashes.md)

## Audience

Developers who know Redis at a basic level and want to understand when and how to use Redis hashes in applications.

## Page Goal

After reading the page, a user should understand that Redis hashes store field-value pairs, know the common hash commands for setting, reading, incrementing, expiring, and inspecting fields, and understand basic performance and storage limits.

## Question Suite

| ID | Question | Expected Answer | Coverage | Required Evidence |
|---|---|---|---|---|
| H01 | What is a Redis hash? | A Redis hash is a record-like data type made of field-value pairs. | Core concept | Must define hashes as field-value collections. |
| H02 | What are two common use cases for hashes? | Representing basic objects and grouping related counters. | Use cases | Must mention objects and counters. |
| H03 | How would you store multiple fields on a hash key? | Use `HSET`, providing the key followed by field-value pairs. | Basic commands | Must include an `HSET` example or syntax description. |
| H04 | How do you retrieve one field from a hash? | Use `HGET key field`. | Basic commands | Must distinguish single-field retrieval from multi-field retrieval. |
| H05 | How do you retrieve multiple fields from a hash, and what happens if a field does not exist? | Use `HMGET`; it returns an array of values, with missing fields returned as nil/null. | Basic commands, edge case | Must include missing-field behavior. |
| H06 | How can a hash field be used as a counter? | Use `HINCRBY` to increment or decrement a numeric field. | Counters | Must show positive and/or negative increments. |
| H07 | What happens when `HINCRBY` is used on a missing field? | The field is created and initialized as if it started at 0 before incrementing. | Counters, edge case | Must mention creation/initialization behavior. |
| H08 | Are hashes limited to small object-like records? | No. They are useful for objects, but can contain many fields, limited in practice by memory. | Modeling, limits | Must avoid implying hashes are only for small records. |
| H09 | Why can small hashes be memory efficient? | Redis uses a special compact encoding for small hashes with small values. | Storage | Must mention special/compact memory encoding. |
| H10 | What is hash field expiration? | The ability to set an expiration time or TTL on individual hash fields rather than only on the whole key. | Field expiration | Must compare it to key expiration. |
| H11 | Which commands set field-level TTLs or exact expiration times? | `HEXPIRE`, `HPEXPIRE`, `HEXPIREAT`, and `HPEXPIREAT`. | Field expiration commands | Must distinguish seconds, milliseconds, and timestamp variants. |
| H12 | Which commands retrieve field expiration information? | `HEXPIRETIME`, `HPEXPIRETIME`, `HTTL`, and `HPTTL`. | Field expiration commands | Must distinguish expiration timestamp from remaining TTL. |
| H13 | How do you remove a hash field expiration? | Use `HPERSIST`. | Field expiration commands | Must identify the command's purpose. |
| H14 | What do `HGETEX` and `HSETEX` add? | They get or set one or more hash fields while optionally setting expiration time or TTL. | Redis 8.0 additions | Must mention optional expiration/TTL behavior. |
| H15 | What are good use cases for field expiration? | Event tracking, fraud detection with hourly counters, session management, and active session tracking. | Use cases | Must include at least two concrete patterns involving per-field expiry. |
| H16 | What should users know about client library support for hash field expiration? | Official client support may not yet be generally available; the page references beta Python and Java clients for testing. | Client support | Must not imply universal stable client support. |
| H17 | Which hash operations are usually O(1), and which are O(n)? | Most hash commands are O(1); commands like `HKEYS`, `HVALS`, `HGETALL`, and most expiration-related commands are O(n), where n is the number of field-value pairs. | Performance | Must include both O(1) default and O(n) exceptions. |
| H18 | What is the maximum number of field-value pairs in a Redis hash? | Up to 4,294,967,295, or 2^32 - 1, though practical limits are memory-based. | Limits | Must include both theoretical and practical limits. |

## Generation Rubric

A generated page should pass if it lets a reader confidently answer H01-H07, H10-H13, H17, and H18. Those are the core comprehension checks.

H08-H09, H14-H16, and H15 are quality/completeness checks. A shorter intro page could omit some of them, but a replacement for the current page should cover them.

## Potential Overfit Note

This suite is intentionally source-derived. It reflects what the current page teaches, including its emphasis on field expiration. For a second pass, add "ideal page" questions too, such as when to choose hashes versus JSON strings or RedisJSON, but those are not strongly covered by the current page.
