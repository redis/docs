---
Title: Remove failed participating cluster
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: 
linkTitle: Remove RERC
weight: 98
---

## Prerequisites

## Identify failed RERC

1. 

```sh
kubectl get rerc
```

2. 

```sh
kubectl get reaadb <REAADB_NAME> -o yaml
```

## Remove failed RERC

3. 

```sh
crdb-cli crdb remove-instance --crdb-guid <REAADB_GUID> --instance-id <INSTANCE_ID> --force
```

4.

5. 

```sh
kubectl edit reaadb <REAADB_NAME>
```

6. 

```sh
kubectl get reaadb example-aadb-1
NAME              STATUS   SPEC STATUS   LINKED REDBS   REPLICATION STATUS
example-aadb-1    active   Valid                        up
```