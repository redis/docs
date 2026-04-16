---
title: Serving and feature views
description: Understand what a Featureform feature view carries and what serving requires.
linkTitle: Serving
weight: 40
---

A feature view is the serving interface for a set of features keyed by an entity. In the documented Redis-backed workflow, the feature view is what applications and model services read from at inference time.

## A feature view includes

- the feature-view name
- the logical entity and key columns
- the served feature schema
- the online provider
- serving version and key-prefix details

## Serving requires

- a registered online store such as Redis
- a committed graph version containing the feature view
- ready serving metadata for that workspace and view

## Main entry points

- gRPC: `ServingService.Serve`, `ServingService.GetServingMetadata`
- REST: `/api/v1/serve`
- Python client: `client.serve(...)`

Serving reads and serving-metadata reads are separate RBAC permissions.
