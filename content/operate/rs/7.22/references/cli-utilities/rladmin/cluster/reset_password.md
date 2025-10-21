---
Title: rladmin cluster reset_password
alwaysopen: false
categories:
- docs
- operate
- rs
description: Changes the password for a given email.
headerRange: '[1-2]'
linkTitle: reset_password
tags:
- configured
toc: 'true'
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/rladmin/cluster/reset_passwor/'
---

Changes the password for the user associated with the specified email address.

Enter a new password when prompted. Then enter the same password when prompted a second time to confirm the password change.

```sh
rladmin cluster reset_password <user email>
```

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| user email | email address | The email address of the user that needs a password reset |

### Returns

Reports whether the password change succeeded or an error occurred. 

### Example

```sh
$ rladmin cluster reset_password user@example.com
New password: 
New password (again): 
Password changed.
```