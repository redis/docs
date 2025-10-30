---
Title: Redis Enterprise REST API requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the requests supported by the Redis Enterprise Software REST
  API calls.
hideListLinks: true
linkTitle: Requests
weight: 30
url: '/operate/rs/7.22/references/rest-api/requests/'
---

A REST API request requires the following components:
- [HTTP method](https://restfulapi.net/http-methods/) (`GET`, `PUT`, `PATCH`, `POST`, `DELETE`)
- Base URL
- Endpoint

Some requests may also require:
- URL parameters
- [Query parameters](https://en.wikipedia.org/wiki/Query_string)
- [JSON](http://www.json.org) request body
- [Permissions]({{< relref "/operate/rs/7.22/references/rest-api/permissions" >}})

{{< table-children columnNames="Request,Description" columnSources="LinkTitle,Description" enableLinks="LinkTitle" >}}
