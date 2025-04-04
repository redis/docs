---
title: RedisEnterpriseRemoteCluster API Reference
alwaysopen: false
categories:
- docs
- operate
- kubernetes
linkTitle: RERC API
weight: 30
url: '/operate/kubernetes/7.8.4/reference/redis_enterprise_remote_cluster_api/'
---

apiVersion:


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
      <td>apiVersion</td>
      <td>string</td>
      <td>app.redislabs.com/v1alpha1</td>
      <td>true</td>
      </tr>
      <tr>
      <td>kind</td>
      <td>string</td>
      <td>RedisEnterpriseRemoteCluster</td>
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
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#status">status</a></td>
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
        <td>apiFqdnUrl</td>
        <td>string</td>
        <td>
          The URL of the cluster, will be used for the active-active database URL.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>recName</td>
        <td>string</td>
        <td>
          The name of the REC that the RERC is pointing at<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>recNamespace</td>
        <td>string</td>
        <td>
          The namespace of the REC that the RERC is pointing at<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiPort</td>
        <td>integer</td>
        <td>
          The port number of the cluster's URL used for connectivity/sync<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>dbFqdnSuffix</td>
        <td>string</td>
        <td>
          The database URL suffix, will be used for the active-active database replication endpoint and replication endpoint SNI.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>secretName</td>
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
        <td>internalObservedSecretResourceVersion</td>
        <td>string</td>
        <td>
          The observed secret resource version. Used for internal purposes only.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>local</td>
        <td>boolean</td>
        <td>
          Indicates whether this object represents a local or a remote cluster.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>observedGeneration</td>
        <td>integer</td>
        <td>
          The most recent generation observed for this RERC. It corresponds to the RERC's generation, which is updated by the API Server.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>specStatus</td>
        <td>string</td>
        <td>
          Whether the desired specification is valid.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>status</td>
        <td>string</td>
        <td>
          The status of the remote cluster.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>
