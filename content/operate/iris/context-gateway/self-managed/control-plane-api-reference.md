---
Title: Context Gateway Control Plane API reference
linkTitle: Control Plane API reference
layout: apireference
type: page
weight: 80
params:
  sourcefile: ./openapi-control-plane.json
  sortOperationsAlphabetically: false
  schemaDefinitionsTagName: Data models
  showPageContent: true
---

Use the self-managed Control Plane API to create Gateways, register and update Upstreams, refresh tool catalogs, and list each Upstream's tools. This reference corresponds to the service contract for these guides.

[Download the OpenAPI contract]({{< relref "/operate/iris/context-gateway/self-managed/control-plane-api-reference/" >}}openapi-control-plane.json), follow the [administration examples](/content/operate/iris/context-gateway/self-managed/api-examples.md), or review [authentication and access](/content/operate/iris/context-gateway/self-managed/authentication.md).

Agent-key management belongs to the Identity Service. Agents call tools through each Gateway's [MCP endpoint](/content/develop/ai/context-engine/context-gateway/connect-agents.md).
