---
title: RedisEnterpriseRemoteCluster API Reference
alwaysopen: false
categories:
- docs
- operate
- kubernetes
linkTitle: RERC API
weight: 30
---

API groups:


- [app.redislabs.com/v1alpha1](#appredislabscomv1alpha1)




# app.redislabs.com/v1alpha1




RedisEntepriseRemoteCluster represents a remote participating cluster.

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
      <td><b>apiVersion</b></td>
      <td>string</td>
      <td>app.redislabs.com/v1alpha1</td>
      <td>true</td>
      </tr>
      <tr>
      <td><b>kind</b></td>
      <td>string</td>
      <td>RedisEnterpriseRemoteCluster</td>
      <td>true</td>
      </tr>
      <tr>
      <td><b><a href="https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.27/#objectmeta-v1-meta">metadata</a></b></td>
      <td>object</td>
      <td>Refer to the Kubernetes API documentation for the fields of the `metadata` field.</td>
      <td>true</td>
      </tr><tr>
        <td><b><a href="#spec">spec</a></b></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><b><a href="#status">status</a></b></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec
<sup><sup>[↩ Parent](#)</sup></sup>



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
        <td><b>apiFqdnUrl</b></td>
        <td>string</td>
        <td>
          The URL of the cluster, will be used for the active-active database URL.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><b>recName</b></td>
        <td>string</td>
        <td>
          The name of the REC that the RERC is pointing at<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><b>recNamespace</b></td>
        <td>string</td>
        <td>
          The namespace of the REC that the RERC is pointing at<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><b>dbFqdnSuffix</b></td>
        <td>string</td>
        <td>
          The database URL suffix, will be used for the active-active database replication endpoint and replication endpoint SNI.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><b>secretName</b></td>
        <td>string</td>
        <td>
          The name of the secret containing cluster credentials. Must be of the following format: "redis-enterprise-<RERC name>"<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status
<sup><sup>[↩ Parent](#)</sup></sup>



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
        <td><b>local</b></td>
        <td>boolean</td>
        <td>
          Indicates whether this object represents a local or a remote cluster.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><b>observedGeneration</b></td>
        <td>integer</td>
        <td>
          The most recent generation observed for this RERC. It corresponds to the RERC's generation, which is updated by the API Server.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><b>specStatus</b></td>
        <td>string</td>
        <td>
          Whether the desired specification is valid.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><b>status</b></td>
        <td>string</td>
        <td>
          The status of the remote cluster.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>
