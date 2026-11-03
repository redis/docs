---
Title: Agent Playbooks control-plane API reference
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

Use the self-managed control-plane API to list configured models, manage playbooks, clear content, and configure extraction bindings. Authenticate with the admin token or an operator's OpenID Connect (OIDC) access token.

[Download the OpenAPI contract]({{< relref "/operate/iris/agent-playbook/self-managed/control-plane-api-reference/" >}}openapi-control-plane.json), follow the [administration examples](/content/operate/iris/agent-playbook/self-managed/api-examples.md), or review [authentication and authorization](/content/operate/iris/agent-playbook/self-managed/authentication.md).

The published contract also includes Redis Cloud operations, marked `x-deployment: cloud`: the database list, network information, and model credentials. Self-managed deployments don't serve them. The `databaseId` and `llm` request fields also apply to Redis Cloud only.

Agent-key management belongs to the Identity Service. Content authoring, proposals, and retrieval use the [data-plane API](/content/develop/ai/context-engine/agent-playbooks/api-reference.md).
