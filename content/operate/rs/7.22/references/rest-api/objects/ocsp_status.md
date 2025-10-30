---
Title: OCSP status object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents the cluster's OCSP status
linkTitle: ocsp_status
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/ocsp_status/'
---

An API object that represents the cluster's OCSP status.

| Name | Type/Value | Description |
|------|------------|-------------|
| cert_status | string | Indicates the proxy certificate's status: GOOD/REVOKED/UNKNOWN (read-only) |
| responder_url | string | The OCSP responder URL this status came from (read-only) |
| next_update | string | The expected date and time of the next certificate status update (read-only) |
| produced_at | string | The date and time when the OCSP responder signed this response (read-only) |
| revocation_time | string | The date and time when the certificate was revoked or placed on hold (read-only) |
| this_update | string | The most recent time that the responder confirmed the current status (read-only) |
