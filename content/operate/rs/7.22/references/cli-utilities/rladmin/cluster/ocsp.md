---
Title: rladmin cluster ocsp
alwaysopen: false
categories:
- docs
- operate
- rs
description: Manages OCSP.
headerRange: '[1-2]'
linkTitle: ocsp
tags:
- configured
toc: 'true'
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/rladmin/cluster/ocsp/'
---

Manages OCSP configuration and verifies the status of a server certificate maintained by a third-party [certificate authority (CA)](https://en.wikipedia.org/wiki/Certificate_authority).

## `ocsp certificate_compatible`

Checks if the proxy certificate contains an OCSP URI.

```sh
rladmin cluster ocsp certificate_compatible
```

### Parameters

None

### Returns

Returns the OCSP URI if it exists. Otherwise, it returns an error.

### Example

```sh
$ rladmin cluster ocsp certificate_compatible
Success. OCSP URI is http://responder.ocsp.url.com
```

## `ocsp config`

Displays or updates OCSP configuration. Run the command without the `set` option to display the current configuration of a parameter.

```sh
rladmin cluster ocsp config <OCSP parameter>
        [set <value>]
```

### Parameters

| Parameter | Type/Value | Description |
|-----------|---------------|-------------|
| ocsp_functionality | enabled<br></br>disabled | Enables or turns off OCSP for the cluster |
| query_frequency | integer <nobr>(range: 60-86400)</nobr> <nobr>(default: 3600)</nobr> | The time interval in seconds between OCSP queries to check the certificate's status |
| recovery_frequency | integer <nobr>(range: 60-86400)</nobr> <nobr>(default: 60)</nobr> | The time interval in seconds between retries after a failed query |
| recovery_max_tries | integer <nobr>(range: 1-100)</nobr> <nobr>(default: 5)</nobr> | The number of retries before the validation query fails and invalidates the certificate |
| responder_url | string | The OCSP server URL embedded in the proxy certificate (you cannot manually set this parameter) |
| response_timeout | integer <nobr>(range: 1-60)</nobr> <nobr>(default: 1)</nobr> | The time interval in seconds to wait for a response before timing out |

### Returns

If you run the `ocsp config` command without the `set` option, it displays the specified parameter's current configuration.

### Example

```sh
$ rladmin cluster ocsp config recovery_frequency
Recovery frequency of the OCSP server is 60 seconds
$ rladmin cluster ocsp config recovery_frequency set 30
$ rladmin cluster ocsp config recovery_frequency
Recovery frequency of the OCSP server is 30 seconds
```

## `ocsp status`

Returns the latest cached status of the certificate's OCSP response.

```sh
rladmin cluster ocsp status
```
### Parameters

None

### Returns

Returns the latest cached status of the certificate's OCSP response.

### Example

```sh
$ rladmin cluster ocsp status
OCSP certificate status is: REVOKED
produced_at: Wed, 22 Dec 2021 12:50:11 GMT
responder_url: http://responder.ocsp.url.com
revocation_time: Wed, 22 Dec 2021 12:50:04 GMT
this_update: Wed, 22 Dec 2021 12:50:11 GMT
```

## `ocsp test_certificate`

Queries the OCSP server for the certificate's latest status, then caches and displays the response.

```sh
rladmin cluster ocsp test_certificate
```

### Parameters

None

### Returns

Returns the latest status of the certificate's OCSP response.

### Example

```sh
$ rladmin cluster ocsp test_certificate
Initiating a query to OCSP server
...OCSP certificate status is: REVOKED
produced_at: Wed, 22 Dec 2021 12:50:11 GMT
responder_url: http://responder.ocsp.url.com
revocation_time: Wed, 22 Dec 2021 12:50:04 GMT
this_update: Wed, 22 Dec 2021 12:50:11 GMT
```
