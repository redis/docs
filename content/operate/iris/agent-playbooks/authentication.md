---
title: Create a playbook and keys
description: Create a playbook and issue separate keys for publishing knowledge and agent retrieval.
linkTitle: Create a playbook and keys
alwaysopen: false
categories:
- docs
- operate
- iris
weight: 20
hideListLinks: true
---

Create a playbook, then issue an author key and a reader key. The author publishes knowledge; the agent retrieves it with the reader key.

## Set administrator credentials

Complete [Deploy with Helm]({{< relref "/operate/iris/agent-playbooks" >}}). Keep its port-forwards and endpoint variables available. Set the two administrative tokens to the values you put in the corresponding Secrets:

```sh
export PLAYBOOK_ADMIN_TOKEN='<token-from-playbook-controlplane-admin>'
export PLAYBOOK_IDENTITY_CONTROL_TOKEN='<token-from-playbook-identity-control>'
```

These tokens administer the services. They are separate from the application programming interface (API) keys you create for an application.

## Create a playbook

1. Save this as `create-playbook.json`. It matches the illustrative model in the Helm configuration; change it if you configured another model:

   ```json
   {
     "name": "Support knowledge",
     "embedding": {
       "provider": "openai",
       "model": "text-embedding-3-small",
       "dimensions": 1536
     }
   }
   ```

1. Create the resource:

   ```sh
   curl --fail-with-body --silent --show-error \
     --header "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" \
     --header 'Content-Type: application/json' \
     --data-binary @create-playbook.json \
     "$PLAYBOOK_CONTROL_URL/v1/playbooks"
   ```

1. Record the returned `playbookId` and `tenantId`, then set the playbook ID:

   ```sh
   export PLAYBOOK_ID='<returned-playbook-id>'
   ```

1. Read its state:

   ```sh
   curl --fail-with-body --silent --show-error \
     --header "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" \
     "$PLAYBOOK_CONTROL_URL/v1/playbooks/$PLAYBOOK_ID"
   ```

Continue when `state` is `ready`. Investigate `failed` rather than repeatedly creating resources. The embedding identity is fixed at creation; use a new playbook to change it.

## Issue an author key

1. Save `author-key.json` with the returned tenant and playbook IDs:

   ```json
   {
     "name": "support-author",
     "grants": [{
       "tenant": "<returned-tenant-id>",
       "product": "playbook",
       "resourceType": "playbook",
       "resourceId": "<returned-playbook-id>",
       "actions": ["write", "publish"]
     }]
   }
   ```

1. Create the key:

   ```sh
   curl --fail-with-body --silent --show-error \
     --header "Authorization: Bearer $PLAYBOOK_IDENTITY_CONTROL_TOKEN" \
     --header 'Content-Type: application/json' \
     --data-binary @author-key.json \
     "$PLAYBOOK_IDENTITY_URL/v1/api-keys"
   ```

1. Store the returned `token` securely and record its `keyId` for key management. Set the token for the publishing example:

   ```sh
   export PLAYBOOK_API_KEY='<returned-author-token>'
   ```

The example key has no expiry. To set one, include `expiresAt` as Unix seconds in the creation request. Keep keys out of source control, application logs, and model prompts.

## Issue a reader key

1. Copy `author-key.json` to `reader-key.json`. Set `name` to `support-agent-reader` and `actions` to `["read"]`. Keep the same tenant and playbook IDs.
1. Create the reader key:

   ```sh
   curl --fail-with-body --silent --show-error \
     --header "Authorization: Bearer $PLAYBOOK_IDENTITY_CONTROL_TOKEN" \
     --header 'Content-Type: application/json' \
     --data-binary @reader-key.json \
     "$PLAYBOOK_IDENTITY_URL/v1/api-keys"
   ```

1. Set its returned token:

   ```sh
   export PLAYBOOK_READ_API_KEY='<returned-reader-token>'
   ```

## Choose permissions

| Action | Capability |
|:-------|:-----------|
| `read` | Retrieve published knowledge and read proposals. |
| `write` | Create, append, delete, inspect drafts, and review proposals; includes `read`. |
| `publish` | Publish or withdraw entries and inspect their versions; includes `read`. |
| `propose` | Submit proposals and evidence; includes `read`. |

`write` does not include `publish` or `propose`. You can separate authoring and publication into different keys. Grants apply to the playbook, so use separate playbooks for workloads that must not share visibility.

Model Context Protocol (MCP) tools serve only current publications, even with a management key. A reader key cannot publish or create entries.

Continue with [Publish your first skill]({{< relref "/develop/ai/context-engine/agent-playbooks/quickstart" >}}). Give other developers the data-plane endpoint, playbook ID, scoped key, and compatible client version.
