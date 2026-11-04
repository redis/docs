---
Title: Serve more than one tenant with Agent Memory
alwaysopen: false
categories:
- docs
- operate
- iris
description: Preview. Let one Identity Service and Agent Memory installation serve several tenants, each with its own stores and keys.
linkTitle: Multiple tenants (preview)
weight: 95
hideListLinks: true
---

> [!NOTE]
> This mode is a preview, and isn't part of the supported `redis-iris` installation. A `redis-iris` release always has one tenant, so this mode needs the standalone `iris-identity-service` and `redis-agent-memory` charts. Run the [isolation check](#check-the-isolation) after each change.

In this mode, one installation of the Identity Service and Agent Memory serves several teams or customers. Each tenant has its own stores and keys, and a tenant can't see or use the stores and keys of another tenant.

## How it works

- An operator's tenant comes from a claim in the operator's identity provider (IdP) access token. The Identity Service and the Agent Memory control plane read the same claim.
- The Agent Memory control plane puts the operator's tenant on each new store.
- The Identity Service keeps each new agent key in the operator's tenant. Before it stores the key, the Agent Memory control plane confirms that the store belongs to that tenant.
- The Agent Memory data plane gets each agent key's tenant from the Identity Service, and compares it with the store's tenant, character for character.

With more than one tenant, the Identity Service gives a new grant its tenant like this:

| Caller | `tenant` in the grant | Result |
| --- | --- | --- |
| Control token | A tenant | Accepted, in that tenant. |
| Control token | Not set | `400`. |
| Operator | Not set | The operator's tenant. |
| Operator | The operator's tenant | Accepted. |
| Operator | Another tenant | `400`. |

When an operator reads or changes a key of another tenant, the Identity Service returns `404`, not `403`, so the operator can't learn which keys exist in other tenants.

## Before you start

Your IdP must put the tenant ID in each operator's access token, in a string claim at the top level of the token. Iris can't read a claim inside another claim, a list, or a number.

| IdP | Claim to use for the tenant |
| --- | --- |
| Auth0 | `org_id`. The application selects the organization at sign-in, with `organization=` on `/authorize`. |
| Zitadel | `urn:zitadel:iam:user:resourceowner:id` |
| Okta, with a custom authorization server | A custom claim from the user profile, for example `tenant_id`. |
| Keycloak | A user attribute mapper, for example `tenant_id`. The built-in Organizations claim is a map, which Iris can't read. |
| Amazon Cognito | A claim that a pre token generation trigger, V2 or V3, adds to the access token. |
| Microsoft Entra ID | A custom claim. Don't use `tid`: it's the Entra directory, not your tenant. |
| PingFederate, PingOne, AD FS | An attribute that you map to the access token. |

The IdP decides each operator's tenant, so a wrong mapping in the IdP moves an operator to another tenant. Let only a small group change the mappings.

## Set up several tenants

1. Configure the Identity Service release for more than one tenant. Leave `singleTenantID` empty, read the tenant from the claim, and make the tenant administrators `product_admin` for Agent Memory. Also set the Agent Memory runtime credential and grant validator, as in [Deploy Agent Memory](/content/operate/iris/agent-memory/self-managed/deploy.md#2-create-secrets):

   ```yaml
   runtime:
     apiKeyTenant:
       singleTenantID: ""
   controlAuth:
     oidc:
       enabled: true
       issuer: https://<idp-host>/<issuer-path>
       jwks_uri: https://<idp-host>/<jwks-path>
       audience: [api://redis-iris]
       tenant_id_claim: tenant_id
     roleBindings:
       - {claim_value: memory-admins, scope: product, product: memory, role: product_admin}
   ```

1. Configure the Agent Memory release. Leave `tenantId` empty, and give the control plane the same IdP settings and claim:

   ```yaml
   tenantId: ""
   controlplane:
     configData:
       auth:
         oidc:
           enabled: true
           issuer: https://<idp-host>/<issuer-path>
           jwks_uri: https://<idp-host>/<jwks-path>
           audience: [api://redis-iris]
           tenant_id_claim: tenant_id
           role_claims: [groups]
           role_mappings:
             memory-admins: product_admin
   ```

   Keep the data plane on agent keys. A `suite_admin` from the IdP stays in its own tenant on the Agent Memory control plane, as in the Identity Service. Only the Agent Memory admin token can see and change the stores of every tenant.

1. A tenant administrator signs in with the IdP, and creates the tenant's stores through the Agent Memory control plane with the access token.
1. The tenant administrator creates the agent keys at the Identity Service, `POST /v1/api-keys`, with the same token. Don't put `tenant` in the grants: the Identity Service uses the token's tenant.
1. The agents use the keys on the Agent Memory data plane, as in [Give an agent access with an agent key](/content/operate/iris/identity-service/self-managed/operations.md#give-an-agent-access-with-an-agent-key).

## Check the isolation

Use two tenants, A and B, and create a store and a key in each. Then confirm these results:

- Tenant A's key gets `403` on tenant B's store.
- A tenant administrator of A doesn't see B's stores in the store list.
- A tenant administrator of A can't create a key for a store of B. The Identity Service returns `400`.

## Provider operators

- The Identity Service control token can act in every tenant. It must name the tenant in each grant.
- A `deployment_admin` can list, read, and revoke keys in every tenant, but can't create, update, or rotate keys.
- The Agent Memory admin token can see and change the stores of every tenant. Don't create stores with it: it puts them in one tenant, `"1"`.

## Limits

- Every tenant shares every database in the Agent Memory `databases` setting. The stores are separate, but a tenant can create stores in each database, so one tenant can slow down the others.
- Agent Playbooks, Lens, Context Gateway, and Intent Router serve one tenant for each release.
- To move an installation from one tenant to several, use the old tenant ID as the claim value of the first tenant. Its stores and keys keep that ID. Run the [isolation check](#check-the-isolation) after the change.
