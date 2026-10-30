---
Title: Redis Context Gateway Control Plane API reference
linkTitle: Control Plane API reference
layout: apireference
type: page
weight: 80
params:
  sourcefile: ./openapi-control-plane.json
  sortOperationsAlphabetically: false
  schemaDefinitionsTagName: Data models
  showPageContent: true
aliases:
- /operate/iris/context-gateway/self-managed/control-plane-api-reference/
---

Use the self-managed Control Plane API to create Gateways, register and update Upstreams, refresh tool catalogs, and list each Upstream's tools.

[Download the OpenAPI contract]({{< relref "/operate/iris/self-managed/context-gateway/control-plane-api-reference/" >}}openapi-control-plane.json), follow the [administration examples](/content/operate/iris/self-managed/context-gateway/api-examples.md), or review [authentication and authorization](/content/operate/iris/self-managed/context-gateway/authentication.md).

Agent-key management belongs to the Identity Service. Agents call tools through each Gateway's Model Context Protocol (MCP) endpoint, described in the [MCP API reference](/content/develop/ai/context-engine/context-gateway/api-reference.md).
