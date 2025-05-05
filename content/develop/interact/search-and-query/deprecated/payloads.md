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
description: Payload support(deprecated)
linkTitle: Payload
title: Document payloads
weight: 12
---

{{% alert title="Warning" color="warning" %}}
The payload feature is deprecated in 2.0
{{% /alert %}}
    
Usually, Redis Open Source stores documents as hashes or JSON. But if you want to access some data for aggregation or scoring functions, Redis can store that data as an inline payload. This will allow us to evaluate the properties of a document for scoring purposes at a very low cost.

Since the scoring functions already have access to the DocumentMetaData, which contains document flags and score, Redis can add custom payloads that can be evaluated in run-time.

Payloads are NOT indexed and are not treated by the engine in any way. They are simply there for the purpose of evaluating them in query time, and optionally retrieving them. They can be JSON objects, strings, or preferably, if you are interested in fast evaluation, some sort of binary encoded data which is fast to decode.

## Evaluating payloads in query time

When implementing a scoring function, the signature of the function exposed is:

```c
double (*ScoringFunction)(DocumentMetadata *dmd, IndexResult *h);
```

{{% alert title="Note" color="info" %}}
Currently, scoring functions cannot be dynamically added, and forking the engine and replacing them is required.
{{% /alert %}}

DocumentMetaData includes a few fields, one of them being the payload. It wraps a simple byte array with arbitrary length:

```c
typedef struct  {
    char *data,
    uint32_t len;
} DocumentPayload;
```

If no payload was set to the document, it is simply NULL. If it is not, you can go ahead and decode it. It is recommended to encode some metadata about the payload inside it, like a leading version number, etc.

## Retrieving payloads from documents

When searching, it is possible to request the document payloads from the engine. 

This is done by adding the keyword `WITHPAYLOADS` to [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}). 

If `WITHPAYLOADS` is set, the payloads follow the document id in the returned result. 
If `WITHSCORES` is set as well, the payloads follow the scores.
