---
Title: Encrypt REST API requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: Encrypt requests
weight: 30
url: '/operate/rs/7.22/references/rest-api/encryption/'
---

## Require HTTPS for API endpoints

By default, the Redis Enterprise Software API supports communication over HTTP and HTTPS. However, you can turn off support for HTTP to ensure that API requests are encrypted.

Before you turn off HTTP support, be sure to migrate any scripts or proxy configurations that use HTTP to the encrypted API endpoint to prevent broken connections.

To turn off HTTP support for API endpoints, run:

```sh
rladmin cluster config http_support disabled
```
