---
Title: Single sign-on requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Single sign-on (SSO) configuration requests
headerRange: '[1-2]'
linkTitle: sso
toc: 'true'
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-cluster-sso) | `/v1/cluster/sso` | Get SSO configuration |
| [PUT](#put-cluster-sso) | `/v1/cluster/sso` | Set or update SSO configuration |
| [DELETE](#delete-cluster-sso) | `/v1/cluster/sso` | Clear SSO configuration |
| [GET](#get-cluster-sso-saml-metadata) | `/v1/cluster/sso/saml/metadata` | Get SAML service provider metadata |
| [POST](#post-cluster-sso-saml-metadata) | `/v1/cluster/sso/saml/metadata` | Upload SAML identity provider metadata |

## Get SSO configuration {#get-cluster-sso}

	GET /v1/cluster/sso

Get the single sign-on configuration as JSON.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [view_sso]({{< relref "/operate/rs/references/rest-api/permissions#view_sso" >}}) | admin<br />user_manager |

### Request {#get-request}

#### Example HTTP request

	GET /v1/cluster/sso

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response}

Returns an [SSO object]({{< relref "/operate/rs/references/rest-api/objects/sso" >}}).

#### Example JSON body

```json
{
   "control_plane": true,
   "protocol": "saml2",
   "enforce_control_plane": false,
   "issuer": {
         "id": "urn:sso:example:idp",
         "login_url": "https://idp.example.com/sso/saml",
         "logout_url": "https://idp.example.com/sso/slo"
   },
   "service": {
         "saml2": {
             "entity_id": "https://cnm.cluster.fqdn/sp",
             "acs_url": "https://cnm.cluster.fqdn/v1/cluster/sso/saml/acs",
             "slo_url": "https://cnm.cluster.fqdn/v1/cluster/sso/saml/slo"
         }
   }
}
```

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success |

## Update SSO configuration {#put-cluster-sso}

	PUT /v1/cluster/sso

Set or update the cluster single sign-on configuration.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [config_sso]({{< relref "/operate/rs/references/rest-api/permissions#config_sso" >}}) | admin<br />user_manager |

### Request {#put-request}

#### Example HTTP request

	PUT /v1/cluster/sso

#### Example JSON body

```json
{
   "control_plane": false,
   "protocol": "saml2",
   "enforce_control_plane": false,
   "issuer": {
         "id": "urn:sso:example:idp",
         "login_url": "https://idp.example.com/sso/saml",
         "logout_url": "https://idp.example.com/sso/slo"
   },
   "service": {
         "saml2": {
             "entity_id": "https://cnm.cluster.fqdn/sp",
             "acs_url": "https://cnm.cluster.fqdn/v1/cluster/sso/saml/acs",
             "slo_url": "https://cnm.cluster.fqdn/v1/cluster/sso/saml/slo"
         }
   }
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Request body

Include an [SSO object]({{< relref "/operate/rs/references/rest-api/objects/sso" >}}) with updated fields in the request body.

### Response {#put-response}

Returns a status code. If an error occurs, the response body can include an error code and message with more details.

### Error codes {#put-error-codes}

Possible `error_code` values:

| Code | Description |
|------|-------------|
| missing_param | A required parameter is missing while SSO is being enabled |
| missing_certificate | SSO certificate is not found while SSO is being enabled |

### Status codes {#put-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success, SSO config has been set |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Bad or missing configuration parameters |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | Missing required certificate |

## Delete SSO configuration {#delete-cluster-sso}

	DELETE /v1/cluster/sso

Clear the single sign-on configuration.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [config_sso]({{< relref "/operate/rs/references/rest-api/permissions#config_sso" >}}) | admin<br />user_manager |

### Request {#delete-request}

#### Example HTTP request

	DELETE /v1/cluster/sso

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#delete-response}

Returns a status code.

### Error codes {#delete-error-codes}

Possible `error_code` values:

| Code | Description |
|------|-------------|
| delete_certificate_error | An error occurred during SSO certificate deletion |

### Status codes {#delete-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success |
| [500 Internal Server Error](https://www.rfc-editor.org/rfc/rfc9110.html#name-500-internal-server-error) | Error during deletion |

## Get SAML service provider metadata {#get-cluster-sso-saml-metadata}

	GET /v1/cluster/sso/saml/metadata

Generates and returns the SAML2 service provider metadata XML.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [view_sso]({{< relref "/operate/rs/references/rest-api/permissions#view_sso" >}}) | admin<br />user_manager |

### Request {#get-metadata-request}

#### Example HTTP request

	GET /v1/cluster/sso/saml/metadata

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/samlmetadata+xml | Accepted media type |

### Response {#get-metadata-response}

Returns SAML2 service provider metadata as XML.

#### Example response body

```xml
<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor
xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata">
    ...
</md:EntityDescriptor>
```

### Error codes {#get-metadata-error-codes}

Possible `error_code` values:

| Code | Description |
|------|-------------|
| missing_certificate | Service certificate is missing |
| saml_metadata_generation_error | An error occurred while generating the XML metadata |

### Status codes {#get-metadata-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | Missing required service certificate |
| [500 Internal Server Error](https://www.rfc-editor.org/rfc/rfc9110.html#name-500-internal-server-error) | Unexpected error when generating metadata |

## Upload SAML identity provider metadata {#post-cluster-sso-saml-metadata}

	POST /v1/cluster/sso/saml/metadata

Uploads and validates the SAML2 identity provider metadata XML.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [config_sso]({{< relref "/operate/rs/references/rest-api/permissions#config_sso" >}}) | admin<br />user_manager |

### Request {#post-metadata-request}

#### Example HTTP request

	POST /v1/cluster/sso/saml/metadata

#### Example JSON body

```json
{
   "idp_metadata": "YWp3cjkwcHR1eWF3MHJ0eTkwYXc0eXQwOW4..."
}
```

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Request body

| Name | Type/Value | Description |
|------|------------|-------------|
| idp_metadata | string | Base64-encoded SAML2 identity provider metadata XML |

### Response {#post-metadata-response}

Returns an [SSO object]({{< relref "/operate/rs/references/rest-api/objects/sso" >}}) with the updated configuration.

#### Example JSON body

```json
{
   "control_plane": true,
   "protocol": "saml2",
   "enforce_control_plane": false,
   "issuer": {
         "id": "urn:sso:example:idp",
         "login_url": "https://idp.example.com/sso/saml",
         "logout_url": "https://idp.example.com/sso/slo"
   },
   "service": {
         "saml2": {
             "entity_id": "https://cnm.cluster.fqdn/sp",
             "acs_url": "https://cnm.cluster.fqdn/v1/cluster/sso/saml/acs",
             "slo_url": "https://cnm.cluster.fqdn/v1/cluster/sso/saml/slo"
         }
   }
}
```

### Error codes {#post-metadata-error-codes}

Possible `error_code` values:

| Code | Description |
|------|-------------|
| saml_metadata_validation_error | IdP metadata failed configuration validation checks |
| saml_metadata_parsing_error | IdP metadata is not a valid base64-encoded XML |
| missing_certificate | SSO certificate is not found while SSO is being enabled |

### Status codes {#post-metadata-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | Bad or missing parameters |
| [406 Not Acceptable](https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable) | Missing required service certificate |
