---
Title: Get started with the REST API
alwaysopen: true
categories:
- docs
- operate
- rc
description: Describes how Redis Cloud REST API uses keys to authenticate and authorize
  access.
hideListLinks: true
linkTitle: Get started
weight: 10
---

To use the Redis Cloud REST API, you need to:

- Enable the API
- Create an account key
- Create a user key
- Collect endpoint details

To use the keys to authenticate and authorize your request, include the keys with the request headers:

| Key name         | HTTP&nbsp;header&nbsp;name   |Description                                            |
| -----------      | -------------------| ----------------------------------------------------- |
| Account&nbsp;key | `x-api-key`        | Account-level key assigned to all users of an account |
| User key       | <nobr>`x-api-secret-key`</nobr> | Personal key associated with a specific user and possibly limited to certain IP ranges                      |

## Enable the API

The API is disabled on all accounts by default. You must [enable the API]({{< relref "/operate/rc/api/get-started/enable-the-api" >}}) before you can use it.

## Account key

The account key identifies your specific account when you perform an API request.  This is the account responsible for your subscription.

{{< note >}}
An account key is an account-level secret. Do not share this key with anyone not authorized to use the account.
{{< /note >}}

You create the account key once when enabling API access.

If you need to change or delete your account key, please [contact support](https://redislabs.com/company/support/).

## User key

The user key is a personal key that belongs to a specific user having the **Owner**, **Viewer**, or **Logs viewer** role.  User keys are assigned to users when they're created.  Keys can belong to only one user; however, a user may have multiple keys.

You can view keys or copy their values _only_ during the [creation process]({{< relref "/operate/rc/api/get-started/manage-api-keys" >}}).

{{< note >}}
User keys are personal secrets. Do not share them.
{{< /note >}}

Individual owners can [generate multiple user keys]({{< relref "/operate/rc/api/get-started/manage-api-keys" >}})
for themselves, for separate apps, or for other owners, viewers, or log viewers within the same account.

Use key names to uniquely associate specific API requests to individual users or apps.

Doing so lets you [audit API requests]({{< relref "/operate/rc/api/examples/audit-system-logs" >}}) using the system log, which tracks the key used to authenticate each request.

## Authentication using API keys

Every API request must use the **account key** and a **user key** to authenticate.

The keys are provided as [HTTP request headers]({{< relref "/operate/rc/api/get-started/use-rest-api#use-the-curl-http-client" >}}), shown earlier.

## Authenticate a request

An API request successfully authenticates when:

1. The account and user keys are valid and properly defined in the HTTP request headers.
1. The user key is associated with the same account as the account key.
1. The request originates from a valid source IP address, as defined in a [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) allow list associated with the user key.

    This requirement applies when you've [defined a CIDR allow list]({{< relref "/operate/rc/api/get-started/manage-api-keys#manage-cidr-allow-list" >}}) for the secret key.

## More info

To learn more, see:

- [Manage API keys]({{< relref "/operate/rc/api/get-started/manage-api-keys" >}})
- [Use the API]({{< relref "/operate/rc/api/get-started/use-rest-api" >}})
- [Full API reference]({{< relref "/operate/rc/api/api-reference" >}})
