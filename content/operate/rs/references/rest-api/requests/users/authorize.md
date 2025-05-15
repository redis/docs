---
Title: Authorize user requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Users authorization requests
headerRange: '[1-2]'
linkTitle: authorize
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [POST](#post-authorize) | `/v1/users/authorize` | Generate a token to authorize an authenticated user |

## Authorize user {#post-authorize}

    POST /v1/users/authorize

Generates a JSON Web Token (JWT) for a user to use as authorization to access the REST API. The request authentication header must include the relevant username and password.

### Request {#post-request}

#### Example HTTP request

    POST /v1/users/authorize

#### Example JSON body

The request body is optional unless you want to specify the token's time to live:

```json
{
  "ttl": <time_in_seconds>
}
```

#### Request headers
| Key    | Value            | Description         |
|--------|------------------|---------------------|
| Host   | cnm.cluster.fqdn | Domain name         |
| Accept | application/json | Accepted media type |

#### Request body

Optionally include a JSON object in the request body to specify the time to live (`ttl`), which determines the amount of time in seconds the token will be valid.

### Response {#post-response}

Returns a JSON object that contains the generated access token.

#### Example JSON body

```json
{
  "access_token": "eyJ5bGciOiKIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXViOjE0NjU0..."
}
```

### Error codes {#post-error-codes}

When errors are reported, the server may return a JSON object with
`error_code` and `message` fields that provide additional information.
The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| password_expired | The password has expired and must be changed. |

### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | The user is authorized. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | The request could not be understood by the server due to malformed syntax. |
| [401 Unauthorized](https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized) | The user is unauthorized. |