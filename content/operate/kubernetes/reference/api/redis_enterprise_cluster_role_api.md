---
title: RedisEnterpriseClusterRole API Reference
alwaysopen: false
categories:
- docs
- operate
- kubernetes
linkTitle: RECROLE API
weight: 30
---

apiVersion:


- [app.redislabs.com/v1alpha1](#appredislabscomv1alpha1)




# app.redislabs.com/v1alpha1




RedisEnterpriseClusterRole is a cluster role definition. It grants users cluster-scoped access across the Redis Enterprise Cluster.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
      <td>apiVersion</td>
      <td>string</td>
      <td>app.redislabs.com/v1alpha1</td>
      <td>true</td>
      </tr>
      <tr>
      <td>kind</td>
      <td>string</td>
      <td>RedisEnterpriseClusterRole</td>
      <td>true</td>
      </tr>
      <tr>
      <td><a href="https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.27/#objectmeta-v1-meta">metadata</a></td>
      <td>object</td>
      <td>Refer to the Kubernetes API documentation for the fields of the `metadata` field.</td>
      <td>true</td>
      </tr><tr>
        <td><a href="#spec">spec</a></td>
        <td>object</td>
        <td>
          RedisEnterpriseClusterRoleSpec defines the desired state of a RedisEnterpriseClusterRole.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#status">status</a></td>
        <td>object</td>
        <td>
          RedisEnterpriseRoleStatus defines the observed state of a Redis Enterprise role object. This status type is used by both RedisEnterpriseClusterRole and RedisEnterpriseRole which share the same status structure.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec
<sup><sup>[↩ Parent](#)</sup></sup>

RedisEnterpriseClusterRoleSpec defines the desired state of a RedisEnterpriseClusterRole.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specacl">acl</a></td>
        <td>object</td>
        <td>
          ACL defines the data access permissions granted by this cluster role.
Users with this role can access any database in the Redis Enterprise Cluster,
subject to the permissions granted by the referenced ACL.
References a RedisEnterpriseACL (kind RedisEnterpriseACL or empty) or an
internal Redis Enterprise ACL by name (kind 'redis_acl').<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>managementRole</td>
        <td>enum</td>
        <td>
          ManagementRole is the named set of Redis Enterprise management permissions assigned to this cluster role. If omitted, the role uses the None management role.<br/>
          <br/>
            <i>Enum</i>: Admin, ClusterMember, ClusterViewer, DBMember, DBViewer, UserManager, None<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.acl
<sup><sup>[↩ Parent](#spec)</sup></sup>

ACL defines the data access permissions granted by this cluster role.
Users with this role can access any database in the Redis Enterprise Cluster,
subject to the permissions granted by the referenced ACL.
References a RedisEnterpriseACL (kind RedisEnterpriseACL or empty) or an
internal Redis Enterprise ACL by name (kind 'redis_acl').

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          Name of the referent.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>kind</td>
        <td>enum</td>
        <td>
          Kind of the referent.<br/>
          <br/>
            <i>Enum</i>: , RedisEnterpriseACL, redis_acl<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status
<sup><sup>[↩ Parent](#)</sup></sup>

RedisEnterpriseRoleStatus defines the observed state of a Redis Enterprise role object. This status type is used by both RedisEnterpriseClusterRole and RedisEnterpriseRole which share the same status structure.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>observedGeneration</td>
        <td>integer</td>
        <td>
          The most recent generation of this resource that was observed and acted upon by the controller.<br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>uid</td>
        <td>string</td>
        <td>
          The internal UID of the Role object defined in the Redis Enterprise Cluster.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>
