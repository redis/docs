---
Title: LDAP object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that contains the cluster's LDAP configuration
linkTitle: ldap
weight: $weight
---

An API object that represents the cluster's [LDAP]({{< relref "/operate/rs/security/access-control/ldap" >}}) configuration.

| Name | Type/Value | Description |
|------|------------|-------------|
| bind_dn | string | DN used when binding with the LDAP server to run queries |
| bind_pass | string | Password used when binding with the LDAP server to run queries |
| ca_cert | string | PEM-encoded CA certificate(s) used to validate TLS connections to the LDAP server |
| cache_ttl | integer (default: 300) | Maximum TTL (in seconds) of cached entries |
| control_plane | boolean (default: false) | Use LDAP for user authentication/authorization in the control plane |
| data_plane | boolean (default: false) | Use LDAP for user authentication/authorization in the data plane |
| directory_timeout_s | integer (range: 5-60) (default: 5) | The connection timeout to the LDAP server when authenticating a user, in seconds |
| dn_group_attr | string | The name of an attribute of the LDAP user entity that contains a list of the groups that user belongs to. `dn_group_attr` is mutually exclusive with `dn_group_query`. |
| dn_group_query | complex object | An LDAP search query used to find a user’s groups, which determine the user’s level of access to the cluster and database as defined by Redis ACLs when [mapped to roles]({{<relref "/operate/rs/references/rest-api/requests/ldap_mappings">}}). `dn_group_query` is mutually exclusive with `dn_group_attr`.<br><br>Contains the following fields:<br>**base**: Defines the starting point DN (unique identifier Distinguished Name) in the directory information tree for the search. Example value: `"DC=example,DC=com"`<br>**filter**: An [RFC-4515](https://www.rfc-editor.org/info/rfc4515) string representation of the search filter to apply. Defines the conditions required for an entry to appear in the search results. Example value: `"member=%D"` where `%D` is replaced with the user's DN.<br>**scope**: Defines the scope of the LDAP search according to the following values:<br>**"base"**: Search the base entry.<br>**"one"**: Search the base entry's immediate children.<br>**"subtree"**: Search the base entry and all its descendants. |
| starttls | boolean (default: false) | Use StartTLS negotiation for the LDAP connection |
| uris | array of strings | URIs of LDAP servers that only contain the schema, host, and port |
| user_dn_query | complex object | An LDAP search query used to find and authenticate LDAP users. `user_dn_query` is mutually exclusive with `user_dn_template`.<br><br>Contains the following fields:<br>**base**: Defines the starting point DN (unique identifier Distinguished Name) in the directory information tree for the search. Example value: `"DC=example,DC=com"`<br>**filter**: An [RFC-4515](https://www.rfc-editor.org/info/rfc4515) string representation of the search filter to apply. Defines the conditions required for an entry to appear in the search results. Example value: `"(&(objectClass=Person)(cn=%u))"` where `%u` is replaced with the username.<br>**scope**: Defines the scope of the LDAP search according to the following values:<br>**"base"**: Search the base entry.<br>**"one"**: Search the base entry's immediate children.<br>**"subtree"**: Search the base entry and all its descendants. |
| user_dn_template | string | A string template that maps between the username, provided to the cluster for authentication, and the LDAP DN. The substring "%u" will be replaced with the username. `user_dn_template` is mutually exclusive with `user_dn_query`. |
