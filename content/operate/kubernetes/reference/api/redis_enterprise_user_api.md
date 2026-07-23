---
title: RedisEnterpriseUser API Reference
alwaysopen: false
categories:
- docs
- operate
- kubernetes
linkTitle: REUSER API
weight: 30
---

apiVersion:


- [app.redislabs.com/v1alpha1](#appredislabscomv1alpha1)




# app.redislabs.com/v1alpha1




RedisEnterpriseUser represents a user definition within a Redis Enterprise Cluster.

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
      <td>RedisEnterpriseUser</td>
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
          RedisEnterpriseUserSpec defines the desired state of a RedisEnterpriseUser.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#status">status</a></td>
        <td>object</td>
        <td>
          RedisEnterpriseUserStatus defines the observed state of a RedisEnterpriseUser.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec
<sup><sup>[↩ Parent](#)</sup></sup>

RedisEnterpriseUserSpec defines the desired state of a RedisEnterpriseUser.

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
        <td><a href="#specalerts">alerts</a></td>
        <td>object</td>
        <td>
          Email alerts settings for this user. User alerts settings are effective only when cluster alerts settings are configured.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>authMethod</td>
        <td>enum</td>
        <td>
          AuthMethod selects how the user authenticates to Redis Enterprise. 'Basic' (the default) authenticates with Basic Auth, using a password sourced from passwordSecrets. 'Certificate' authenticates with a client certificate whose subject matches certificateSubjectLine; such users carry no password (passwordSecrets must be empty). Certificate users additionally require certificate-based authentication to be configured at the cluster level.<br/>
          <br/>
            <i>Enum</i>: Basic, Certificate<br/>
            <i>Default</i>: Basic<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>certificateSubjectLine</td>
        <td>string</td>
        <td>
          CertificateSubjectLine is the certificate subject line (RFC2253) used to match the client certificate for certificate-auth users. Required when authMethod is 'Certificate'; must not be set otherwise.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>email</td>
        <td>string</td>
        <td>
          The email address for the user. Optional (Redis Enterprise accepts an empty email). For password users, changing the email after creation is permitted only while spec.passwordSecrets contains exactly one entry: to change the email of a user with two password secrets (Rotatable rotation in progress), first reduce passwordSecrets to a single entry, change the email, then add the second secret back. Certificate-auth users carry no password, so this restriction does not apply to them.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>passwordMode</td>
        <td>enum</td>
        <td>
          Defines how passwords are managed for this user. Single: Only a single password secret can be specified at a time. Passwords changes can be done by mutating the secret in-place, or by replacing the secret reference to point to another secret. Rotatable: Allows for one or two password secrets to be specified simultaneously. The secrets are required to be immutable, and the operator automatically sets their 'immutable: true' attribute (K8s secrets only) if not already set. Vault secrets are assumed to be used as immutable and are not made immutable automatically. Password changes are typically done by adding a new password secret, and later removing the old one when it's no longer needed. When empty, Single behavior is used. Must not be set for certificate-auth users (authMethod: Certificate), which carry no password.<br/>
          <br/>
            <i>Enum</i>: Single, Rotatable<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpasswordsecrets">passwordSecrets</a></td>
        <td>[]object</td>
        <td>
          List of one or more secrets holding the user's password. Each secret must have a key named 'password' with the user's desired password. If multiple secrets are specified, then the passwords from all of them can be used for authenticating as the user. When the user signin status is 'Locked', the user won't be able to authenticate with Redis Enterprise API or UI, and must be unlocked by another user with Admin-role access. To unlock the user, first set a new password via the 'passwordSecrets' field, and then follow the password reset instructions in the following link: https://redis.io/docs/latest/operate/rs/security/access-control/manage-users/login-lockout/#unlock-locked-user-accounts<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>username</td>
        <td>string</td>
        <td>
          The username associated with the user. The username must be unique within the Redis Enterprise cluster, and include only ASCII characters except &,<,>,". If not specified, a default username is assigned and can be discovered via the status section of the RedisEnterpriseUser.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alerts
<sup><sup>[↩ Parent](#spec)</sup></sup>

Email alerts settings for this user. User alerts settings are effective only when cluster alerts settings are configured.

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
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Master toggle for email alerts.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specalertsclusteralerts">clusterAlerts</a></td>
        <td>object</td>
        <td>
          UserClusterAlertSettings specifies cluster alerts settings for a user.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specalertsdatabasealerts">databaseAlerts</a></td>
        <td>object</td>
        <td>
          UserDatabaseAlertSettings specifies database alerts settings for a user.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alerts.clusterAlerts
<sup><sup>[↩ Parent](#specalerts)</sup></sup>

UserClusterAlertSettings specifies cluster alerts settings for a user.

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
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Determines whether cluster alerts are enabled for the user.<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.alerts.databaseAlerts
<sup><sup>[↩ Parent](#specalerts)</sup></sup>

UserDatabaseAlertSettings specifies database alerts settings for a user.

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
        <td><a href="#specalertsdatabasealertsdatabases">databases</a></td>
        <td>[]object</td>
        <td>
          The databases for which alerts are enabled for this user. If not specified, defaults to all databases.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.alerts.databaseAlerts.databases[]
<sup><sup>[↩ Parent](#specalertsdatabasealerts)</sup></sup>

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
        <td>kind</td>
        <td>string</td>
        <td>
          Kind of the referent.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          Name of the referent.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.passwordSecrets[]
<sup><sup>[↩ Parent](#spec)</sup></sup>

A reference to a Secret object.

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
          Name of the Secret.<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### status
<sup><sup>[↩ Parent](#)</sup></sup>

RedisEnterpriseUserStatus defines the observed state of a RedisEnterpriseUser.

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
        <td><a href="#statusconditions">conditions</a></td>
        <td>[]object</td>
        <td>
          Conditions represent the latest available observations of the user's state.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>observedGeneration</td>
        <td>integer</td>
        <td>
          The most recent generation of this resource that was observed and acted upon by the controller.<br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>passwordIssueDate</td>
        <td>string</td>
        <td>
          The date in which the password was set.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statuspasswordsecrets">passwordSecrets</a></td>
        <td>[]object</td>
        <td>
          List of secrets holding the user's password, with their versions.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statusroles">roles</a></td>
        <td>[]object</td>
        <td>
          List of roles assigned to the user.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>rolesDisplay</td>
        <td>string</td>
        <td>
          Formatted string representation of the roles assigned to the user.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>signinStatus</td>
        <td>string</td>
        <td>
          Sign-in status for the user. When set to 'Locked', the user won't be able to authenticate with Redis Enterprise API or UI, and must be unlocked by another user with Admin-role access. To unlock the user, set a new password via the 'passwordSecrets' field, and then follow the password reset instructions in the following link: https://redis.io/docs/latest/operate/rs/security/access-control/manage-users/login-lockout/#unlock-locked-user-accounts<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>uid</td>
        <td>string</td>
        <td>
          The internal UID of the User object defined in the Redis Enterprise Cluster.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>username</td>
        <td>string</td>
        <td>
          The effective username assigned for the user.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.conditions[]
<sup><sup>[↩ Parent](#status)</sup></sup>

Condition contains details for one aspect of the current state of this API Resource.

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
        <td>lastTransitionTime</td>
        <td>string</td>
        <td>
          lastTransitionTime is the last time the condition transitioned from one status to another.<br/>
          <br/>
            <i>Format</i>: date-time<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>status</td>
        <td>enum</td>
        <td>
          status of the condition, one of True, False, Unknown.<br/>
          <br/>
            <i>Enum</i>: True, False, Unknown<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>type</td>
        <td>string</td>
        <td>
          type of condition in CamelCase or in foo.example.com/CamelCase.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>message</td>
        <td>string</td>
        <td>
          message is a human readable message indicating details about the transition.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>observedGeneration</td>
        <td>integer</td>
        <td>
          observedGeneration represents the .metadata.generation that the condition was set based upon.<br/>
          <br/>
            <i>Format</i>: int64<br/>
            <i>Minimum</i>: 0<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>reason</td>
        <td>string</td>
        <td>
          reason contains a programmatic identifier indicating the reason for the condition's last transition.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.passwordSecrets[]
<sup><sup>[↩ Parent](#status)</sup></sup>

A versioned reference to a Secret object.

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
          Name of the Secret.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>version</td>
        <td>string</td>
        <td>
          Version of the Secret.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.roles[]
<sup><sup>[↩ Parent](#status)</sup></sup>

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
        <td>kind</td>
        <td>string</td>
        <td>
          Kind of the referent.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          Name of the referent.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>
