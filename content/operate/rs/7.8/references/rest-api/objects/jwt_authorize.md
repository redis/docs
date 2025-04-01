---
Title: JWT authorize object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object for user authentication or a JW token refresh request
linkTitle: jwt_authorize
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/jwt_authorize/'
---

An API object for user authentication or a JW token refresh request.

| Name | Type/Value | Description |
|------|------------|-------------|
| password | string | The user’s password (required) |
| ttl | integer (range: 1-86400) (default: 300) | Time to live - The amount of time in seconds the token will be valid |
| username | string | The user’s username (required) |
