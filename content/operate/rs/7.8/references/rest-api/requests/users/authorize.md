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
url: '/operate/rs/7.8/references/rest-api/requests/users/authorize/'
---

| Method | Path | Description |
|--------|------|-------------|
| [POST](#post-authorize) | `/v1/users/authorize` | Authorize a user |

## Authorize user {#post-authorize}

    POST /v1/users/authorize

Generate a JSON Web Token (JWT) for a user to use as authorization to access the REST API.

### Request {#post-request}

#### Example HTTP request

    POST /v1/users/authorize

#### Example JSON body

  ```json
  {
      "username": "user@redislabs.com",
      "password": "my_password"
  }
  ```

#### Request headers
| Key    | Value            | Description         |
|--------|------------------|---------------------|
| Host   | cnm.cluster.fqdn | Domain name         |
| Accept | application/json | Accepted media type |

#### Request body

Include a [JWT authorize object]({{< relref "/operate/rs/7.8/references/rest-api/objects/jwt_authorize" >}}) with a valid username and password in the request body.

### Response {#post-response}

Returns a JSON object that contains the generated access token.

#### Example JSON body

  ```json
  {
      "access_token": "eyJ5bGciOiKIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXViOjE0NjU0NzU0ODYsInVpZFI1IjEiLCJleHAiOjE0NjU0Nz30OTZ9.2xYXumd1rDoE0edFzcLElMOHsshaqQk2HUNgdsUKxMU"
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
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | The user is authorized. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | The request could not be understood by the server due to malformed syntax. |
| [401 Unauthorized](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.2) | The user is unauthorized. |
