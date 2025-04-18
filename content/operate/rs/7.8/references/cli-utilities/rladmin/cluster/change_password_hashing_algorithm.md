---
Title: rladmin cluster change_password_hashing_algorithm
alwaysopen: false
categories:
- docs
- operate
- rs
description: Changes the password hashing algorithm.
headerRange: '[1-2]'
linkTitle: change_password_hashing_algorithm
tags:
- configured
toc: 'true'
weight: $weight
url: '/operate/rs/7.8/references/cli-utilities/rladmin/cluster/change_password_hashing_algorithm/'
---

Changes the password hashing algorithm for the entire cluster. When you change the hashing algorithm, it rehashes the administrator password and passwords for all users, including default users.

```sh
rladmin cluster change_password_hashing_algorithm <algorithm>
```

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| algorithm | SHA-256<br />PBKDF2 | Change to the specified hashing algorithm. The default hashing algorithm is `SHA-256`. |

### Returns

Reports whether the algorithm change succeeded or an error occurred.

### Example

```sh
$ rladmin cluster change_password_hashing_algorithm PBKDF2
Please confirm changing the password hashing algorithm
Please confirm [Y/N]: y
Algorithm changed
```
