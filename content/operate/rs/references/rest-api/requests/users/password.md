---
Title: User password requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: User password requests
headerRange: '[1-2]'
linkTitle: password
weight: $weight
---

| Method                     | Path                 | Description                 |
|----------------------------|----------------------|-----------------------------|
| [PUT](#update-password)    | `/v1/users/password` | Replace the password of the authenticated user |
| [POST](#add-password)      | `/v1/users/password` | Add a new password for the authenticated user |
| [DELETE](#delete-password) | `/v1/users/password` | Delete a password for the authenticated user |

## Update password {#update-password}
    
    PUT /v1/users/password
    
Replaces the password list of the user making this request with a single new password. The request authentication header must include the relevant username and password.

### Request {#put-request}

#### Example HTTP request

    PUT /v1/users/password

#### Example JSON body

  ```json
  {
      "new_password": "the new (single) password"
  }
  ```

#### Request headers
| Key    | Value            | Description         |
|--------|------------------|---------------------|
| Host   | cnm.cluster.fqdn | Domain name         |
| Accept | application/json | Accepted media type |

#### Request body

The request must contain a JSON object with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| new_password | string | The new password (required) |

### Response {#put-response}

Returns a status code to indicate password update success or failure.

### Error codes {#put-error-codes}

When errors are reported, the server may return a JSON object with
`error_code` and `message` fields that provide additional information.
The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| password_not_complex | The given password is not complex enough (Only work when the password_complexity feature is enabled). |
| new_password_same_as_current | The given new password is identical to one of the already existing passwords. |

### Status codes {#put-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success, password changed. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Bad or missing parameters. |
| [401 Unauthorized](https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized) | The user is unauthorized. |

## Add password {#add-password}

    POST /v1/users/password

Adds a new password to the password list of the user making this request. The request authentication header must include the relevant username and password.

### Request {#post-request}

#### Example HTTP request

    POST /v1/users/password

#### Example JSON body

  ```json
  {
      "new_password": "a password to add"
  }
  ```

#### Request headers
| Key    | Value            | Description         |
|--------|------------------|---------------------|
| Host   | cnm.cluster.fqdn | Domain name         |
| Accept | application/json | Accepted media type |

#### Request body

The request must contain a JSON object with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| new_password | string | New password to add (required) |

### Response {#post-response}

Returns a status code to indicate password creation success or failure. If an error occurs, the response body may include a more specific error code and message.

### Error codes {#post-error-codes}

When errors are reported, the server may return a JSON object with
`error_code` and `message` fields that provide additional information.
The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| password_not_complex | The given password is not complex enough (Only work when the password_complexity feature is enabled). |
| new_password_same_as_current | The given new password is identical to one of the already existing passwords. |

### Status codes {#post-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success, new password was added to the list of valid passwords. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Bad or missing parameters. |
| [401 Unauthorized](https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized) | The user is unauthorized. |

## Delete password {#delete-password}

    DELETE /v1/users/password

Deletes a password from the password list of the user making this request. The request authentication header must include the relevant username and password.

### Request {#delete-request}

#### Example HTTP request

    DELETE /v1/users/password

#### Example JSON body

  ```json
  {
      "old_password": "an existing password"
  }
  ```

#### Request headers
| Key    | Value            | Description         |
|--------|------------------|---------------------|
| Host   | cnm.cluster.fqdn | Domain name         |
| Accept | application/json | Accepted media type |

#### Request body

The request must contain a JSON object with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| old_password | string | Existing password to be deleted (required) |

### Response {#delete-response}

### Error codes {#delete-error-codes}

When errors are reported, the server may return a JSON object with
`error_code` and `message` fields that provide additional information.
The following are possible `error_code` values:

| Code | Description |
|------|-------------|
| cannot_delete_last_password | Cannot delete the last password of a user |

### Status codes {#delete-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success, new password was deleted from the list of valid passwords. |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Bad or missing parameters. |
| [401 Unauthorized](https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized) | The user is unauthorized. |
