---
Title: Redis Feature Form
alwaysopen: false
categories:
- docs
- develop
- ai
description: Build feature engineering workflows with Redis Feature Form.
linkTitle: Redis Feature Form
weight: 60
bannerText: Redis Feature Form is currently in preview and subject to change. Feature Form Docker images are available on Docker Hub; contact your Redis account team for a license key to deploy.
bannerChildren: true
---

Define, manage, and serve machine learning features on top of your existing data systems, without replacing them.

Redis Feature Form lets you register your data providers, define features as Python transformations, materialize them on a schedule, and serve them at low latency from Redis. Your existing databases stay in place; Feature Form coordinates the pipeline.

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< tile-card color="bg-redis-red-500" title="Quickstart" description="Register a provider, define a feature, materialize it, and serve it end to end" url="/develop/ai/featureform/quickstart" >}}
  {{< tile-card color="bg-blue-300" title="Overview" description="Learn the onboarding path: workspace, providers, definitions, apply, and serving" url="/develop/ai/featureform/overview" >}}
  {{< tile-card color="bg-teal-300" title="Deploy" description="Installation and authentication instructions for running Feature Form" url="/operate/featureform" >}}
</div>

## What is Redis Feature Form?

Redis Feature Form is a feature platform for machine learning teams that:

- **Works with your existing data**: Register your databases, data warehouses, and streams as providers; no migration required
- **Defines features as code**: Write transformations in Python and version them alongside your model code
- **Materializes on demand**: Push computed features to Redis for sub-millisecond online serving
- **Serves training and inference from the same definitions**: Training sets and online feature views share one source of truth
- **Supports streaming features**: Ingest real-time events and serve up-to-the-second feature values

## Why use Redis Feature Form?

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For ML teams</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Consistent features between training and serving: no training-serving skew</li>
      <li>Version and audit feature definitions alongside model code</li>
      <li>Reuse features across multiple models and teams</li>
      <li>Streaming support for time-sensitive predictions</li>
    </ul>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For developers</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Python SDK for defining features, labels, training sets, and providers</li>
      <li>Redis as the online store: sub-millisecond feature serving at scale</li>
      <li>No need to replace existing data systems: register them as providers</li>
    </ul>
  </div>
</div>

Redis Feature Form helps teams define, manage, materialize, and serve machine learning features while keeping existing data systems in place. In the documented workflow, Redis acts as the low-latency online store for feature serving.

This documentation describes platform setup, workspace access, provider and secret registration, definitions-file authoring, apply, and serving. Refer to [Deploy](/content/operate/featureform/_index.md) for installation and authentication instructions.


