---
Title: REST API
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the REST API available to Redis Enterprise Software deployments.
hideListLinks: true
weight: $weight
url: '/operate/rs/7.22/references/rest-api/'
---
Redis Enterprise Software provides a REST API to help you automate common tasks.

Here, you'll find the details of the API and how to use it.  

For more info, see:

- Supported [request endpoints]({{< relref "/operate/rs/7.22/references/rest-api/requests" >}}), organized by path
- Supported [objects]({{< relref "/operate/rs/7.22/references/rest-api/objects" >}}), both request and response
- Built-in roles and associated [permissions]({{< relref "/operate/rs/7.22/references/rest-api/permissions" >}})
- [Redis Enterprise Software REST API quick start]({{< relref "/operate/rs/7.22/references/rest-api/quick-start" >}}) with examples

## Authentication

Authentication to the Redis Enterprise Software API occurs via [Basic Auth](https://en.wikipedia.org/wiki/Basic_access_authentication). Provide your username and password as the basic auth credentials.

If the username and password is incorrect or missing, the request will fail with a [`401 Unauthorized`](https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized) status code.

Example request using [cURL](https://curl.se/):

``` bash
curl -u "demo@redislabs.com:password" \
    https://localhost:9443/v1/bdbs
```

For more examples, see the [Redis Enterprise Software REST API quick start]({{< relref "/operate/rs/7.22/references/rest-api/quick-start" >}}).

### Permissions

By default, the admin user is authorized for access to all endpoints. Use [role-based access controls]({{< relref "/operate/rs/7.22/security/access-control" >}}) and [role permissions]({{< relref "/operate/rs/7.22/references/rest-api/permissions" >}}) to manage access.

If a user attempts to access an endpoint that is not allowed in their role, the request will fail with a [`403 Forbidden`](https://www.rfc-editor.org/rfc/rfc9110.html#name-403-forbidden) status code. For more details on which user roles can access certain endpoints, see [Permissions]({{< relref "/operate/rs/7.22/references/rest-api/permissions" >}}).

### Certificates

The Redis Enterprise Software REST API uses [Self-signed certificates]({{< relref "/operate/rs/7.22/security/certificates" >}}) to ensure the product is secure. When you use the default self-signed certificates, the HTTPS requests will fail with `SSL certificate problem: self signed certificate` unless you turn off SSL certificate verification.

## Ports

All calls must be made over SSL to port 9443. For the API to work, port 9443 must be exposed to incoming traffic or mapped to a different port.

If you are using a [Redis Enterprise Software Docker image]({{< relref "/operate/rs/7.22/installing-upgrading/quickstarts/docker-quickstart" >}}), run the following command to start the Docker image with port 9443 exposed:

```sh
docker run -p 9443:9443 redislabs/redis
```

## Versions

All API requests are versioned in order to minimize the impact of backwards-incompatible API changes and to coordinate between different versions operating in parallel.

Specify the version in the request [URI](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier), as shown in the following table:

| Request path | Description |
|--------------|-------------|
| POST `/v1/bdbs` | A version 1 request for the `/bdbs` endpoint. |
| POST `/v2/bdbs` | A version 2 request for the `/bdbs` endpoint. |

When an endpoint supports multiple versions, each version is documented on the corresponding endpoint.  For example, the [bdbs request]({{< relref "/operate/rs/7.22/references/rest-api/requests/bdbs/" >}}) page documents POST requests for [version 1]({{< relref "/operate/rs/7.22/references/rest-api/requests/bdbs/#post-bdbs-v1" >}}) and [version 2]({{< relref "/operate/rs/7.22/references/rest-api/requests/bdbs/#post-bdbs-v2" >}}).

## Headers

### Requests

Redis Enterprise REST API requests support the following HTTP headers:

| Header | Supported/Required Values |
|--------|---------------------------|
| Accept | `application/json` |
| Content-Length | Length (in bytes) of request message |
| Content-Type | `application/json` (required for PUT or POST requests) |

If the client specifies an invalid header, the request will fail with a [`400 Bad Request`](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) status code.

### Responses

Redis Enterprise REST API responses support the following HTTP headers:

| Header | Supported/Required Values |
|--------|---------------------------|
| Content-Type | `application/json` |
| Content-Length | Length (in bytes) of response message |

## JSON requests and responses

The Redis Enterprise Software REST API uses [JavaScript Object Notation (JSON)](http://www.json.org) for requests and responses. See the [RFC 4627 technical specifications](http://www.ietf.org/rfc/rfc4627.txt) for additional information about JSON.

Some responses may have an empty body but indicate the response with standard [HTTP codes](https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html).

Both requests and responses may include zero or more objects.

If the request is for a single entity, the response returns a single JSON object or none. If the request is for a list of entities, the response returns a JSON array with zero or more elements.

If you omit certain JSON object fields from a request, they may be assigned default values, which often indicate that these fields are not in use.

## Response types and error codes

[HTTP status codes](https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes) indicate the result of an API request. This can be `200 OK` if the server accepted the request, or it can be one of many error codes.

The most common responses for a Redis Enterprise API request are:

| Response | Condition/Required handling |
|----------|-----------------------------|
| [200 OK](https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok) | Success |
| [400 Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) | The request failed, generally due to a typo or other mistake. |
| [401 Unauthorized](https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized) | The request failed because the authentication information was missing or incorrect. |
| [403 Forbidden](https://www.rfc-editor.org/rfc/rfc9110.html#name-403-forbidden) | The user cannot access the specified [URI](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier). |
| [404 Not Found](https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found) | The [URI](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier) does not exist. |
| [503 Service Unavailable](https://www.rfc-editor.org/rfc/rfc9110.html#name-503-service-unavailable) | The node is not responding or is not a member of the cluster. |
| [505&nbsp;HTTP&nbsp;Version&nbsp;Not&nbsp;Supported](https://www.rfc-editor.org/rfc/rfc9110.html#name-505-http-version-not-suppor) | An unsupported `x-api-version` was used. See [versions](#versions). |

Some endpoints return different response codes. The request references for these endpoints document these special cases.
