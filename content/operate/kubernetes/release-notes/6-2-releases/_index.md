---
Title: 6.2.18 release notes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Release notes for the 6.2.x releases of Redis Enterprise Software for
  Kubernetes.
hideListLinks: true
linkTitle: 6.2 releases
weight: 58
---
## Before upgrading

Be aware the following changes included in this release affect the upgrade process. Please read carefully before upgrading.

### Supported upgrade paths

If you are using operator version 6.2.8-15 or earlier, you cannot upgrade directly to operator versions 6.2.12 through 6.4.2-5. You must upgrade to operator version 6.2.10-45 before you can upgrade to operator versions between 6.2.12 and 6.4.2-5. However, upgrades directly to operator version 6.4.2-6 are supported.
  
### OpenShift versions 6.2.12 or earlier

Due to a change in the SCC, on OpenShift clusters running version 6.2.12 or earlier upgrading to version 6.2.18 or later, where `node:1` is <b>not</b> the master node, the upgrade might get stuck.

For more info and steps to prevent this issue, see [upgrade a Redis Enterprise cluster (REC)]({{< relref "/operate/kubernetes/upgrade/upgrade-redis-cluster#before-upgrading" >}}).

Operator version 6.4.2-6 includes a fix for this issue.

### Large clusters

On clusters with more than 9 REC nodes, a Kubernetes upgrade can render the Redis cluster unresponsive in some cases. A fix is available in the 6.4.2-5 release. Upgrade your operator version to 6.4.2-5 or later before upgrading your Kubernetes cluster. 

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes" columnSources="LinkTitle,Description" enableLinks="LinkTitle">}}