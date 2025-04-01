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
url: '/operate/rs/7.8/references/rest-api/requests/users/password/'
---

| Method                     | Path                 | Description                 |
|----------------------------|----------------------|-----------------------------|
| [PUT](#update-password)    | `/v1/users/password` | Change an existing password |
| [POST](#add-password)      | `/v1/users/password` | Add a new password          |
| [DELETE](#delete-password) | `/v1/users/password` | Delete a password           |

## Update password {#update-password}
    
    PUT /v1/users/password
    
Reset the password list of an internal user to include a new password.

### Request {#put-request}

#### Example HTTP request

    PUT /v1/users/password

#### Example JSON body

  ```json
  {
      "username": "johnsmith",
      "old_password": "a password that exists in the current list",
      "new_password": "the new (single) password"
  }
  ```

#### Request headers
| Key    | Value            | Description         |
|--------|------------------|---------------------|
| Host   | cnm.cluster.fqdn | Domain name         |
| Accept | application/json | Accepted media type |

#### Request body

The request must contain a single JSON object with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| username     | string | Affected user (required) |
| old_password | string | A password that exists in the current list (required) |
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
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, password changed |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad or missing parameters. |
| [401 Unauthorized](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.2) | The user is unauthorized. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Attempting to reset password to a non-existing user. |

## Add password {#add-password}

    POST /v1/users/password

Add a new password to an internal user's passwords list.

### Request {#post-request}

#### Example HTTP request

    POST /v1/users/password

#### Example JSON body

  ```json
  {
      "username": "johnsmith",
      "old_password": "an existing password",
      "new_password": "a password to add"
  }
  ```

#### Request headers
| Key    | Value            | Description         |
|--------|------------------|---------------------|
| Host   | cnm.cluster.fqdn | Domain name         |
| Accept | application/json | Accepted media type |

#### Request body

The request must contain a single JSON object with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| username     | string | Affected user (required) |
| old_password | string | A password that exists in the current list (required) |
| new_password | string | The new (single) password (required) |

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
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, new password was added to the list of valid passwords. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad or missing parameters. |
| [401 Unauthorized](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.2) | The user is unauthorized. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Attempting to add a password to a non-existing user. |

## Delete password {#delete-password}
    DELETE /v1/users/password

Delete a password from an internal user's passwords list.

### Request {#delete-request}

#### Example HTTP request

    DELETE /v1/users/password

#### Example JSON body

  ```json
  {
      "username": "johnsmith",
      "old_password": "an existing password"
  }
  ```

#### Request headers
| Key    | Value            | Description         |
|--------|------------------|---------------------|
| Host   | cnm.cluster.fqdn | Domain name         |
| Accept | application/json | Accepted media type |

#### Request body

The request must contain a single JSON with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| username | string | Affected user (required) |
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
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | Success, new password was deleted from the list of valid passwords. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad or missing parameters. |
| [401 Unauthorized](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.2) | The user is unauthorized. |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Attempting to delete a password to a non-existing user. |
