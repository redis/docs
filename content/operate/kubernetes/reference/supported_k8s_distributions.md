---
title: Supported Kubernetes distributions
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Support matrix for the current Redis Enterprise for Kubernetes operator
linkTitle: Supported distributions
weight: 10
---

## Kubernetes version support

Redis Enterprise for Kubernetes is compatible with [CNCF-conformant](https://www.cncf.io/training/certification/software-conformance/) Kubernetes platforms. The operator follows standard Kubernetes APIs and practices and is designed to run consistently across certified Kubernetes environments.

CNCF-conformant distributions include:

- Amazon Elastic Kubernetes Service (EKS)
- Azure Kubernetes Service (AKS)
- Google Kubernetes Engine (GKE)
- Rancher Kubernetes Engine (RKE)
- VMware Tanzu Kubernetes Grid Integrated Edition (TKGI)
- VMware vSphere Kubernetes Grid (VKG)
- Red Hat OpenShift

This list is not exhaustive. Any CNCF-conformant distribution running a supported Kubernetes version is supported.

The tables below use the following status icons:

<span title="Check mark icon">&#x2705;</span> Supported – This Kubernetes version is supported for this operator version.

<span title="Deprecation warning">&#x26a0;&#xfe0f;</span> Deprecated – Support for this Kubernetes version will be removed in a future release.

<span title="X icon">&#x274c;</span> End of life – No longer supported.

### Latest release

Operator releases **8.0.18-11** through **8.0.20-21** support the following Kubernetes and OpenShift versions.

| OpenShift | Kubernetes | Support status |
|---|---|---|
| 4.22 | 1.35 | <span title="Supported">&#x2705;</span> Supported |
| 4.21 | 1.34 | <span title="Supported">&#x2705;</span> Supported |
| 4.20 | 1.33 | <span title="Supported">&#x2705;</span> Supported |
| 4.19 | 1.32 | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> Deprecated |
| 4.18 | 1.31 | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> Deprecated |

### Version history

The following table lists the Kubernetes versions supported by every operator version. Operator versions run from newest (left) to oldest (right).

{{<table-scrollable>}}|  | Redis operator | **<nobr>8.0.20-21</nobr>** | **<nobr>8.0.18-11</nobr>** | **<nobr>8.0.10-15</nobr>** | **<nobr>8.0.6-6</nobr>** | **<nobr>8.0.2-2</nobr>** | **<nobr>7.22.2-21</nobr>** | **<nobr>7.22.0-15</nobr>** | **<nobr>7.22.0-7</nobr>** | **<nobr>7.8.6-1</nobr>** | **<nobr>7.8.4-9</nobr>** | **<nobr>7.8.4-8</nobr>** | **<nobr>7.8.2-6</nobr>** | **<nobr>7.4.6-2</nobr>** | **<nobr>7.4.2-12</nobr>** | **<nobr>7.4.2-2</nobr>** | **<nobr>7.2.4-12</nobr>** | **<nobr>7.2.4-7</nobr>** | **<nobr>7.2.4-2</nobr>** | **<nobr>6.4.2-8</nobr>** | **<nobr>6.4.2-6</nobr>** | **<nobr>6.4.2-5</nobr>** | **<nobr>6.4.2-4</nobr>** | **<nobr>6.2.18-41</nobr>** | **<nobr>6.2.18-3</nobr>** | **<nobr>6.2.12-1</nobr>** | **<nobr>6.2.10-45</nobr>** | **<nobr>6.2.10-34</nobr>** | **<nobr>6.2.10-4</nobr>** | **<nobr>6.2.8-15</nobr>** | **<nobr>6.2.8-11</nobr>** | **<nobr>6.2.8-2</nobr>** | **<nobr>6.2.4-1</nobr>** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|  |  | May 2026 | March 2026 | Jan 2026 | Dec 2025 | Oct 2025 | Oct 2025 | July 2025 | April 2025 | March 2025 | March 2025 | Feb 2025 | Nov 2024 | July 2024 | May 2024 | March 2024 | Dec 2023 | Oct 2023 | Aug 2023 | July 2023 | June 2023 | April 2023 | March 2023 | Jan 2023 | Nov 2022 | Sept 2022 | July 2022 | May 2022 | March 2022 | Jan 2022 | Jan 2022 | Nov 2021 | Sept 2021 |
| OpenShift | Kubernetes |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 4.22 | 1.35 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 4.21 | 1.34 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 4.20 | 1.33 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 4.19 | 1.32 | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 4.18 | 1.31 | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 4.17 | 1.30 |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 4.16 | 1.29 |  |  |  |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 4.15 | 1.28 |  |  |  |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 4.14 | 1.27 |  |  |  |  |  |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="X icon">&#x274c;</span> | <span title="X icon">&#x274c;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |  |  |  |  |  |  |  |
| 4.13 | 1.26 |  |  |  |  |  |  |  |  |  |  |  |  | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |  |  |  |  |  |
| 4.12 | 1.25 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |  |  |  |
| 4.11 | 1.24 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |  |
| 4.10 | 1.23 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |  |  |  |
| 4.09 | 1.22 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |  |  |
| 4.08 | 1.21 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| 4.07 | 1.20 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| 4.06 | 1.19 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| 4.05 | 1.18 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| 4.04 | 1.17 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> |
| 4.03 | 1.16 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | <span title="X icon">&#x274c;</span> | <span title="Deprecation warning">&#x26a0;&#xfe0f;</span> |

{{</table-scrollable>}}
