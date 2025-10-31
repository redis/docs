---
acl_categories:
- '@read'
- '@string'
- '@slow'
arguments:
- display_text: key1
  key_spec_index: 0
  name: key1
  type: key
- display_text: key2
  key_spec_index: 0
  name: key2
  type: key
- display_text: len
  name: len
  optional: true
  token: LEN
  type: pure-token
- display_text: idx
  name: idx
  optional: true
  token: IDX
  type: pure-token
- display_text: min-match-len
  name: min-match-len
  optional: true
  token: MINMATCHLEN
  type: integer
- display_text: withmatchlen
  name: withmatchlen
  optional: true
  token: WITHMATCHLEN
  type: pure-token
arity: -3
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
command_flags:
- readonly
complexity: O(N*M) where N and M are the lengths of s1 and s2, respectively
description: Finds the longest common substring.
group: string
hidden: false
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 1
      limit: 0
    type: range
linkTitle: LCS
since: 7.0.0
summary: Finds the longest common substring.
syntax_fmt: "LCS key1 key2 [LEN] [IDX] [MINMATCHLEN\_min-match-len] [WITHMATCHLEN]"
syntax_str: "key2 [LEN] [IDX] [MINMATCHLEN\_min-match-len] [WITHMATCHLEN]"
title: LCS
---

The LCS command implements the longest common subsequence algorithm. Note that this is different than the longest common string algorithm, since matching characters in the string does not need to be contiguous.

For instance the LCS between "foo" and "fao" is "fo", since scanning the two strings from left to right, the longest common set of characters is composed of the first "f" and then the "o".

LCS is very useful in order to evaluate how similar two strings are. Strings can represent many things. For instance if two strings are DNA sequences, the LCS will provide a measure of similarity between the two DNA sequences. If the strings represent some text edited by some user, the LCS could represent how different the new text is compared to the old one, and so forth.

Note that this algorithm runs in `O(N*M)` time, where N is the length of the first string and M is the length of the second string. So either spin a different Redis instance in order to run this algorithm, or make sure to run it against very small strings.

```
> MSET key1 ohmytext key2 mynewtext
OK
> LCS key1 key2
"mytext"
```

Sometimes we need just the length of the match:

```
> LCS key1 key2 LEN
(integer) 6
```

However what is often very useful, is to know the match position in each strings:

```
> LCS key1 key2 IDX
1) "matches"
2) 1) 1) 1) (integer) 4
         2) (integer) 7
      2) 1) (integer) 5
         2) (integer) 8
   2) 1) 1) (integer) 2
         2) (integer) 3
      2) 1) (integer) 0
         2) (integer) 1
3) "len"
4) (integer) 6
```

Matches are produced from the last one to the first one, since this is how
the algorithm works, and it more efficient to emit things in the same order.
The above array means that the first match (second element of the array)
is between positions 2-3 of the first string and 0-1 of the second.
Then there is another match between 4-7 and 5-8.

To restrict the list of matches to the ones of a given minimal length:

```
> LCS key1 key2 IDX MINMATCHLEN 4
1) "matches"
2) 1) 1) 1) (integer) 4
         2) (integer) 7
      2) 1) (integer) 5
         2) (integer) 8
3) "len"
4) (integer) 6
```

Finally to also have the match len:

```
> LCS key1 key2 IDX MINMATCHLEN 4 WITHMATCHLEN
1) "matches"
2) 1) 1) 1) (integer) 4
         2) (integer) 7
      2) 1) (integer) 5
         2) (integer) 8
      3) (integer) 4
3) "len"
4) (integer) 6
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="lcs-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the longest common subsequence.
* [Integer reply](../../develop/reference/protocol-spec#integers): the length of the longest common subsequence when _LEN_ is given.
* [Array reply](../../develop/reference/protocol-spec#arrays): an array with the LCS length and all the ranges in both the strings when _IDX_ is given.

-tab-sep-

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the longest common subsequence.
* [Integer reply](../../develop/reference/protocol-spec#integers): the length of the longest common subsequence when _LEN_ is given.
* [Map reply](../../develop/reference/protocol-spec#maps): a map with the LCS length and all the ranges in both the strings when _IDX_ is given.

{{< /multitabs >}}
