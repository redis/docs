---
Title: RediSearch 1.0 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Hamming distance scoring. Wildcard queries. Optional deletion of documents
  in FT.DEL. Optionally keep document hashes in FT.DROP. Delete geo-sets when dropping
  an index. Tag prefix completion support.
linkTitle: v1.0 (April 2018)
min-version-db: 4.0.0
min-version-rs: 5.0.0
weight: 100
---
## Requirements

RediSearch v1.0.10 requires:

- Minimum Redis compatibility version (database): 4.0.0
- Minimum Redis Enterprise Software version (cluster): 5.0.0

## RediSearch 1.0.10 (April 2018)

This is a bug-fix release with some stability fixes, a few processing bug fixes, and a few small additions:

### Fixes

- Fixed false positives in NOT iterator (5fe948e)

- Prevent crashing with uninitialized sorting vectors (96f2473)

- Fixed overflow bug in triemap, and limited tag length to 4KB (09e682f)

- Fixed false positives in intersects and negative intersects (4998772)

- Fixed bug in union of id lists (b8e74ef3)

### New features

- Added support for tag prefix completions (137b346)

## RediSearch 1.0.9 (March 2018)

This is a maintenance release from the 1.0 branch, that does not yet contain the aggregation engine that's already in master. It includes a few small fixes and API additions that were backported from master.

### Changes

#### 1. Hamming distance scoring

RediSearch can now sort the search result by the inverse Hamming Distance between document payloads and the query payloads (provided they are both the same length). This can be used as a nearest neighbor search ranking when a feature vector is encoded as a bitmap and the distance metric is Hamming distance.

#### 2. Wildcard queries

It's now possible to search for just `*`, scanning all the documents in the index. This is useful in conjunction with the Hamming Distance scorer.

#### 3. Optional deletion of documents in FT.DEL

Up until now, FT.DEL did not delete the Hash key containing the actual document. As of this version, you can call it with an optional DD (Delete Document) argument, and it will also delete the document.

For example: `FT.DEL myIndex myDoc DD`.

#### 4. Optionally keep document hashes in FT.DROP

Up until now, FT.DROP always deleted the document Hash keys. As of this version, you can specify the `KEEPDOCS` argument to FT.DROP and it will not touch them.

#### 5. Delete geo-sets when dropping an index

Until now we did not delete the geo-set keys where documents were geographically indexed. This version fixes this (#[295](https://github.com/RediSearch/RediSearch/issues/295))
