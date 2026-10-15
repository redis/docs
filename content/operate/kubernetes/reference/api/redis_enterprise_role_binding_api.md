---
title: RedisEnterpriseRoleBinding API Reference
alwaysopen: false
categories:
- docs
- operate
- kubernetes
linkTitle: REROLEBINDING API
weight: 30
---

apiVersion:


- [app.redislabs.com/v1alpha1](#appredislabscomv1alpha1)




# app.redislabs.com/v1alpha1




RedisEnterpriseRoleBinding binds users to a RedisEnterpriseRole. It grants the users the scoped access defined by that role.

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
      <td>RedisEnterpriseRoleBinding</td>
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
          RedisEnterpriseRoleBindingSpec defines the desired state of a RedisEnterpriseClusterRoleBinding or RedisEnterpriseRoleBinding.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>status</td>
        <td>object</td>
        <td>
          RedisEnterpriseRoleBindingStatus defines the observed state of a RedisEnterpriseClusterRoleBinding or RedisEnterpriseRoleBinding.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec
<sup><sup>[↩ Parent](#)</sup></sup>

RedisEnterpriseRoleBindingSpec defines the desired state of a RedisEnterpriseClusterRoleBinding or RedisEnterpriseRoleBinding.

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
        <td><a href="#specroleref">roleRef</a></td>
        <td>object</td>
        <td>
          RoleRef holds a reference to the role object being bound. For RedisEnterpriseClusterRoleBinding, this references a RedisEnterpriseClusterRole in the same namespace (kind RedisEnterpriseClusterRole or empty) or an internal Redis Enterprise role by name (kind 'role'). For RedisEnterpriseRoleBinding, this references a RedisEnterpriseRole in the same namespace (kind RedisEnterpriseRole or empty) or an internal Redis Enterprise role by name (kind 'role').<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specsubjects">subjects</a></td>
        <td>[]object</td>
        <td>
          Subjects holds references to the objects the role applies to. Each subject is a reference to a RedisEnterpriseUser object within the same namespace. The 'kind' field can be left empty, or set to RedisEnterpriseUser. A maximum of 100 subjects may be specified; to bind more, create additional bindings referencing the same role.<br/>
          <br/>
            <i>Validations</i>:<li>self.all(s1, self.exists_one(s2,
  (has(s1.kind) && s1.kind != '' ? s1.kind : 'RedisEnterpriseUser') ==
  (has(s2.kind) && s2.kind != '' ? s2.kind : 'RedisEnterpriseUser') &&
  s1.name == s2.name))
: subjects must be unique by kind and name</li>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.roleRef
<sup><sup>[↩ Parent](#spec)</sup></sup>

RoleRef holds a reference to the role object being bound. For RedisEnterpriseClusterRoleBinding, this references a RedisEnterpriseClusterRole in the same namespace (kind RedisEnterpriseClusterRole or empty) or an internal Redis Enterprise role by name (kind 'role'). For RedisEnterpriseRoleBinding, this references a RedisEnterpriseRole in the same namespace (kind RedisEnterpriseRole or empty) or an internal Redis Enterprise role by name (kind 'role').

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
            <i>Enum</i>: , RedisEnterpriseRole, role<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.subjects[]
<sup><sup>[↩ Parent](#spec)</sup></sup>

A reference to another object.

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
            <i>Enum</i>: , RedisEnterpriseUser<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>
