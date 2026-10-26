---
Title: Redis Intent Router control-plane API reference
linkTitle: Control-plane API reference
layout: apireference
type: page
weight: 80
params:
  sourcefile: ./openapi-control-plane.json
  sortOperationsAlphabetically: false
  schemaDefinitionsTagName: Data models
  showPageContent: true
---

Use the self-managed control-plane API to list embedding models, and to create, update, suspend, and delete Routers.

[Download the OpenAPI contract]({{< relref "/operate/iris/intent-router/self-managed/control-plane-api-reference/" >}}openapi-control-plane.json), follow the [administration examples](/content/operate/iris/intent-router/self-managed/api-examples.md), or review [authentication and authorization](/content/operate/iris/intent-router/self-managed/authentication.md).

Agent-key management belongs to the Identity Service. Applications author intents and match queries through each Router's data-plane API, described in the [data-plane API reference](/content/develop/ai/context-engine/intent-router/api-reference.md).
