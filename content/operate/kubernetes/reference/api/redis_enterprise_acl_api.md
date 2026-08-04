---
title: RedisEnterpriseACL API Reference
alwaysopen: false
categories:
- docs
- operate
- kubernetes
linkTitle: REACL API
weight: 30
---

apiVersion:


- [app.redislabs.com/v1alpha1](#appredislabscomv1alpha1)




# app.redislabs.com/v1alpha1




RedisEnterpriseACL represents an access control list definition for a Redis database.

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
      <td>RedisEnterpriseACL</td>
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
          RedisEnterpriseACLSpec defines the desired state of RedisEnterpriseACL<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#status">status</a></td>
        <td>object</td>
        <td>
          RedisEnterpriseACLStatus defines the observed state of RedisEnterpriseACL<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec
<sup><sup>[↩ Parent](#)</sup></sup>

RedisEnterpriseACLSpec defines the desired state of RedisEnterpriseACL

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
        <td>acl</td>
        <td>string</td>
        <td>
          Redis ACL rule<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status
<sup><sup>[↩ Parent](#)</sup></sup>

RedisEnterpriseACLStatus defines the observed state of RedisEnterpriseACL

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
          The internal UID of the Redis ACL object defined in the Redis Enterprise Cluster.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>
