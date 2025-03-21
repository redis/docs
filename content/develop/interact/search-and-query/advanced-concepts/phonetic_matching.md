---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Details about phonetic matching capabilities
linkTitle: Phonetic
title: Phonetic matching
weight: 14
---

Phonetic matching, for example "Jon" vs. "John", allows searching for terms based on their pronunciation. This capability can be a useful tool when searching for names of people.

Phonetic matching is based on the use of a phonetic algorithm. A phonetic algorithm transforms the input term to an approximate representation of its pronunciation. This allows terms to be indexed and searched by their pronunciation.

As of v1.4, Redis Query Engine, which is included in Redis Community Edition, provides phonetic matching of text fields specified with the `PHONETIC` attribute. This causes the terms in such fields to be indexed both by their textual value as well as their phonetic approximation.

Performing a search on `PHONETIC` fields will, by default, also return results for phonetically similar terms. This behavior can be controlled with the [`$phonetic` query attribute]({{< relref "/develop/interact/search-and-query/query/#query-attributes" >}}).

## Phonetic algorithms support

Redis currently supports a single phonetic algorithm, the [Double Metaphone](https://en.wikipedia.org/wiki/Metaphone#Double_Metaphone) (DM). It uses the implementation at the [slacy/double-metaphone GitHub site](https://github.com/slacy/double-metaphone), which provides general support for Latin languages.
