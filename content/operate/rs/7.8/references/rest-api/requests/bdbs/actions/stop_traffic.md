---
Title: Stop database traffic requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests to stop traffic for a database
headerRange: '[1-2]'
linkTitle: stop_traffic
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/bdbs/actions/stop_traffic/'
---

| Method | Path | Description |
|--------|------|-------------|
| [POST](#post-bdbs-actions-stop-traffic) | `/v1/bdbs/{uid}/actions/stop_traffic` | Stop database traffic |

## Stop database traffic {#post-bdbs-actions-stop-traffic}

```sh
POST /v1/bdbs/{int: uid}/actions/stop_traffic
```

Stop handling traffic for the database.

Use this action to stop read and write traffic on a database. To resume traffic afterward, use the [`resume_traffic`]({{<relref "/operate/rs/7.8/references/rest-api/requests/bdbs/actions/resume_traffic">}}) action.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [update_bdb_with_action]({{< relref "/operate/rs/7.8/references/rest-api/permissions#update_bdb_with_action" >}}) | admin<br />cluster_member<br />db_member |

### Request {#post-request}

#### Example HTTP request

```sh
POST /v1/bdbs/1/actions/stop_traffic
```

#### URL parameters

| Field | Type | Description |
|-------|------|-------------|
| uid | integer | The unique ID of the database. |

### Response {#post-response}

Returns a JSON object with an `action_uid`. You can track the action's progress with a [`GET /v1/actions/<action_uid>`]({{<relref "/operate/rs/7.8/references/rest-api/requests/actions#get-action">}}) request.

#### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | The request is accepted and is being processed. The database state will be `active-change-pending` until the request has been fully processed. |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | Attempting to perform an action on a nonexistent database. |
| [409 Conflict](https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict) | Attempting to change a database while it is busy with another configuration change. This is a temporary condition, and the request should be reattempted later. |
