---
Title: Change the password hashing algorithm
alwaysopen: false
categories:
- docs
- operate
- rs
description: Change the password hashing algorithm for user passwords in a Redis Enterprise Software cluster.
linkTitle: Password hashing algorithm
toc: 'true'
weight: 95
url: '/operate/rs/7.22/security/access-control/manage-passwords/password-hashing-algorithm/'
---

Redis Enterprise Software securely stores all user passwords using a cryptographic hash function. The default password hashing algorithm is `SHA-256`, but `PBKDF2` is also supported as of Redis Enterprise Software version 7.8.6-13.

You can change the password hashing algorithm using [`rladmin`]({{<relref "/operate/rs/7.22/references/cli-utilities/rladmin">}}) or the [REST API]({{<relref "/operate/rs/7.22/references/rest-api">}}). When you change the password hashing algorithm, the cluster rehashes the administrator password and passwords for all users, including default users.

## Command-line method

To change the password hashing algorithm from the command line, run [`rladmin cluster change_password_hashing_algorithm`]({{<relref "/operate/rs/7.22/references/cli-utilities/rladmin/cluster/change_password_hashing_algorithm">}}):

```sh
rladmin cluster change_password_hashing_algorithm PBKDF2
```

## REST API method

You can [change the password hashing algorithm]({{<relref "/operate/rs/7.22/references/rest-api/requests/cluster/change_password_hashing_algorithm#patch-change-password-hashing-algorithm">}}) using a REST API request:

```sh
PATCH /v1/cluster/change_password_hashing_algorithm
{ "algorithm": "PBKDF2" }
```
