---
Title: SSO object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object for single sign-on (SSO) configuration
linkTitle: sso
weight: $weight
---

An API object that represents single sign-on (SSO) configuration in the cluster.

| Name | Type/Value | Description |
|------|------------|-------------|
| control_plane | boolean (default: false) | If `true`, enables single sign-on (SSO) for the control plane. |
| enforce_control_plane | boolean (default: false) | If `true`, enforce SSO login for the control plane for non-admin users. If `false`, all users can still login using their local username and password if SSO is down. |
| protocol | "saml2" | SSO protocol to use. |
| issuer | complex object	 | Issuer related configuration.<br>Contains the following fields:<br>**id**: Unique ID of the issuer side (example: "urn:sso:example:idp")<br>**login_url**: SSO login URL (example: "https://idp.example.com/sso/saml")<br>**logout_url**: SSO logout URL (example: "https://idp.example.com/sso/slo") |
| service | complex object	 | Service related configuration.<br />For SAML2 service configuration:<br />{{<code>}}{
  "saml2": {
    "entity_id": "string",
    "acs_url": "string",
    "slo_url": "string"
  }
}{{</code>}}<br>**acs_url**: Assertion Consumer Service URL (read-only)<br>**slo_url**: Single Logout URL (read-only)<br>**entity_id**: Service entity ID (read-only) |
