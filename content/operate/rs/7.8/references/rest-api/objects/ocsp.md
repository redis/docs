---
Title: OCSP object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents the cluster's OCSP configuration
linkTitle: ocsp
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/ocsp/'
---

An API object that represents the cluster's OCSP configuration.

| Name | Type/Value | Description |
|------|------------|-------------|
| ocsp_functionality | boolean (default:&nbsp;false) | Enables or turns off OCSP for the cluster |
| query_frequency | integer <nobr>(range: 60-86400)</nobr> (default:&nbsp;3600) | The time interval in seconds between OCSP queries to check the certificate’s status |
| recovery_frequency | integer <nobr>(range: 60-86400)</nobr> (default:&nbsp;60) | The time interval in seconds between retries after the OCSP responder returns an invalid status for the certificate |
| recovery_max_tries | integer <nobr>(range: 1-100)</nobr> (default:&nbsp;5) | The number of retries before the validation query fails and invalidates the certificate |
| responder_url | string | The OCSP server URL embedded in the proxy certificate (if available) (read-only) |
| response_timeout | integer <nobr>(range: 1-60)</nobr> (default:&nbsp;1) | The time interval in seconds to wait for a response before timing out |
