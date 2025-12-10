---
Title: user_defined_module object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object for user-defined module configuration during bootstrap
hideListLinks: true
linkTitle: user_defined_module
weight: $weight
---

A user-defined module configuration object for bootstrap operations.

| Name | Type/Value | Description |
|------|------------|-------------|
| name | string | Module name for presentation and logging purposes (required) |
| location | object | Information on where to download the module from (required)<br />{{<code>}}{
  "location_type": "http | https",
  "url": "string",
  "credentials": {
    "username": "string",
    "password": "string"
  }
}{{</code>}}<br />**location_type**: The type of location, either `http` or `https` (required)<br />**url**: The URL to download the module zip file from (required)<br />**credentials**: Optional credentials for downloads that require basic authentication |

## Module package requirements

The module must be packaged as a `.zip` file containing:

- **module.json**: A metadata file with module information including:
  - `module_name`: The actual module name
  - `version`: Numeric version
  - `semantic_version`: Semantic version string (for example, "1.0.0")
  - `min_redis_version`: Minimum compatible Redis version
  - `commands`: List of commands the module provides
  - `capabilities`: List of module capabilities

- **Module binary**: The compiled `.so` file for the target platform
