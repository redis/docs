---
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Releases with support for Redis Enterprise Software 8.0.2
hideListLinks: true
linkTitle: 8.0.2 releases
title: Redis Enterprise for Kubernetes 8.0.2 release notes
weight: 
---


Redis Enterprise for Kubernetes 8.0.2-2 includes bug fixes, enhancements, and support for [Redis Enterprise Software version 8.0.2]({{<relref "">}}).


## Detailed release notes


{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes" columnSources="LinkTitle,Description" enableLinks="LinkTitle">}}


## Breaking changes


## Known limitations

- **PVC expansion is not supported when using Redis on Flash (Auto Tiering)** - Do not enable enablePersistentVolumeResize if your REC uses redisOnFlashSpec as this will result in conflicts (RED-165770)
- **Specifying databasePort causes issues with REAADB synchronization** (RED-149374)
- **Only upgrades from 7.4.2-2 and later are supported** - If you are using an earlier version install 7.4.2-2 before upgrading to 7.8.2-6 or later
- **When changing the REDB field spec.modulesList version might be upgraded to latest even if a different version is specified** - To prevent the upgrade to latest, set spec.upgradeSpec.setModuleToLatest to false before upgrading to 7.8.2-6
- **Missing endpoint for admission endpoint (rare)** - Restart the operator pod (RED-119469)
- **The REDB redisVersion field can't be used for memcached databases** (RED-119152)
- **When modifying the database suffix for an Active-Active database, while the service-rigger is in a terminating state, the services-rigger will delete and create the ingress or route resources in a loop** - Wait until the services rigger pod has finished to terminate it (RED-107687)
- **REAADB changes might fail with "gateway timeout" errors, mostly on OpenShift** - Retry the operation (RED-103048)
- **Installing operator bundle produces warning: "Warning: would violate PodSecurity "restricted:v1.24""** - Ignore the warning (RED-97381)
- **RERC resources must have a unique name** - The string rec-name/rec-namespace must be different from all other participating clusters in the Active-Active database (RED-96302)
- **Admission is not blocking REAADB with shardCount which exceeds license quota** - Fix the problems with the REAADB and reapply (RED-96301)
- **Active-Active controller only supports global database options. Configuration specific to location is not supported** (RED-86490)
- **autoUpgrade set to true can cause unexpected bdb upgrades when redisUpgradePolicy is set to true** - Contact support if your deployment is impacted (RED-72351)
- **Following the previous quick start guide version causes issues with creating an REDB due to unrecognized memory field name** - Use the newer (current) revision of Deploy Redis Enterprise Software for Kubernetes (RED-69515)
- **PVC size issues when using decimal value in spec** - Make sure you use integer values for the PVC size (RED-62132)
- **REC might report error states on initial startup** - There is no workaround at this time except to ignore the errors (RED-61707)
- **Hashicorp Vault integration - no support for Gesher** - There is no workaround for this issue. Gesher support has been deprecated (RED-55080)
- **REC clusters fail to start on Kubernetes clusters with unsynchronized clocks** - When REC clusters are deployed on Kubernetes clusters without synchronized clocks the REC cluster does not start correctly. The fix is to use NTP to synchronize the underlying K8s nodes (RED-47254)
- **Deleting an OpenShift project with an REC deployed may hang** - When an REC cluster is deployed in a project (namespace) and has REDB resources the REDB resources must be deleted first before the REC can be deleted. The fix is to delete the REDB resources first and the REC second (RED-47192)
- **In OLM-deployed operators, the deployment of the cluster will fail if the name is not "rec"** - When the operator is deployed via the OLM, the security context constraints (scc) are bound to a specific service name (i.e., "rec"). Naming the cluster "rec" should resolve the issue (RED-39825)
- **STS Readiness prob doesn't mark a node as "not ready when" rladmin status nodes fails** (RED-39300)
- **DNS conflicts are possible between the cluster mdns_server and the K8s DNS** - Only impacts DNS resolution from within cluster nodes (RED-37462)
- **K8S-based 5.4.10 clusters seem to negatively affect existing 5.4.6 clusters** (RED-37233)
- **In Kubernetes, the node CPU usage we report is the usage of the K8S worker node hosting the REC pod** (RED-36884)
- **When a cluster is in an unreachable state, the cluster is still running instead of being reported as an error** (RED-32805)
- **A cluster name longer than 20 characters will result in a rejected route configuration, as the host part of the domain name exceeds 63 characters** - Limit cluster name to 20 characters or less (RED-25871)
- **A cluster CR specification error is not reported if two or more invalid CR resources are updated in sequence** (RED-25542)
- **Creating two databases with the same name directly on Redis Enterprise software will cause the service to be deleted and the database will not be available** - Avoid duplicating database names. Database creation via K8s has validation in place to prevent this (RED-99997)
- **Active-Active setup removal might keep services or routes undeleted** - Delete services or routes manually if you encounter this problem (RED-77752)
