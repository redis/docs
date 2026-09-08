---
title: RedisEnterpriseRole API Reference
alwaysopen: false
categories:
- docs
- operate
- kubernetes
linkTitle: REROLE API
weight: 30
---

apiVersion:


- [app.redislabs.com/v1alpha1](#appredislabscomv1alpha1)




# app.redislabs.com/v1alpha1




RedisEnterpriseRole is a scoped role definition. It grants users access to selected databases within a Redis Enterprise Cluster.

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
      <td>RedisEnterpriseRole</td>
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
          RedisEnterpriseRoleSpec defines the desired state of a RedisEnterpriseRole.<br/>
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

RedisEnterpriseRoleSpec defines the desired state of a RedisEnterpriseRole.

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
        <td><a href="#specscopes">scopes</a></td>
        <td>[]object</td>
        <td>
          Scopes define the databases to which this role applies.
Each scope references a RedisEnterpriseDatabase by name or selector (kind
RedisEnterpriseDatabase or empty), or an internal Redis Enterprise database
by name (kind 'bdb', name only).
For 'bdb' scopes the role grants management access only; its ACL is not bound
to that database's permissions.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specacl">acl</a></td>
        <td>object</td>
        <td>
          ACL defines the data access permissions granted by this scoped role.
References a RedisEnterpriseACL (kind RedisEnterpriseACL or empty) or an
internal Redis Enterprise ACL by name (kind 'redis_acl').<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>managementRole</td>
        <td>enum</td>
        <td>
          ManagementRole is the named set of Redis Enterprise management permissions assigned to this scoped role. RedisEnterpriseRole supports only database-scoped management roles. If omitted, the role uses the None management role.<br/>
          <br/>
            <i>Enum</i>: DBMember, DBViewer, None<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.scopes[]
<sup><sup>[↩ Parent](#spec)</sup></sup>

A reference to another object(s), either directly by name, or via a label selector.

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
        <td>kind</td>
        <td>enum</td>
        <td>
          Kind of the referent.<br/>
          <br/>
            <i>Enum</i>: , RedisEnterpriseDatabase, bdb<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          Name of the referent.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specscopesselector">selector</a></td>
        <td>object</td>
        <td>
          Selector based on label attached to the object.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.scopes[].selector
<sup><sup>[↩ Parent](#specscopes)</sup></sup>

Selector based on label attached to the object.

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
        <td><a href="#specscopesselectormatchexpressions">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          matchExpressions is a list of label selector requirements. The requirements are ANDed.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.scopes[].selector.matchExpressions[]
<sup><sup>[↩ Parent](#specscopesselector)</sup></sup>

A label selector requirement is a selector that contains values, a key, and an operator that relates the key and values.

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
        <td>key</td>
        <td>string</td>
        <td>
          key is the label key that the selector applies to.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          operator represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists and DoesNotExist.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          values is an array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.acl
<sup><sup>[↩ Parent](#spec)</sup></sup>

ACL defines the data access permissions granted by this scoped role.
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
