---
title: Serve features in Python
description: Read Featureform feature views from Python after the online store and serving metadata are ready.
linkTitle: Serve in Python
weight: 10
---

Use this page after a feature view already exists and the online store is ready. In the quickstart flow, that means `demo_customer_feature_view` has already been applied successfully.

## Verify the feature view exists

```bash
ff graph feature-view get demo_customer_feature_view --workspace demo-workspace
```

## Minimal Python workflow

```python
import featureform as ff

client = ff.Client(host="127.0.0.1:9090", insecure=True, workspace="demo-workspace")
features = client.serve("demo_customer_feature_view", entity="C1001")
print(features)
```

## Operational checks

- if the feature view is not ready, serving fails
- if the online provider is unavailable or unsupported, serving fails
- serving-metadata permissions and serving-read permissions are separate RBAC checks
