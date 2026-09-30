---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Enable PEM encryption to encrypt all private keys on disk.
linkTitle: Encrypt private keys
title: Encrypt private keys
toc: 'true'
weight: 50
---

Enable PEM encryption to automatically encrypt all private keys on disk. Public keys (`.cert` files) are not encrypted.

When certificates are rotated, the encrypted private keys are also rotated.

## Enable PEM encryption

To enable PEM encryption and encrypt private keys on the disk, use [`rladmin`](/content/operate/rs/references/cli-utilities/rladmin/_index.md) or the [REST API](/content/operate/rs/references/rest-api/_index.md).


- [`rladmin cluster config`](/content/operate/rs/references/cli-utilities/rladmin/cluster/config.md):

    ```sh
    rladmin cluster config encrypt_pkeys enabled
    ```

- [Update cluster settings](/content/operate/rs/references/rest-api/requests/cluster/_index.md#put-cluster) REST API request:

    ```sh
    PUT /v1/cluster
    { "encrypt_pkeys": true }
    ```

## Deactivate PEM encryption

To deactivate PEM encryption and decrypt private keys on the disk, use [`rladmin`](/content/operate/rs/references/cli-utilities/rladmin/_index.md) or the [REST API](/content/operate/rs/references/rest-api/_index.md).

- [`rladmin cluster config`](/content/operate/rs/references/cli-utilities/rladmin/cluster/config.md):

    ```sh
    rladmin cluster config encrypt_pkeys disabled
    ```

- [Update cluster settings](/content/operate/rs/references/rest-api/requests/cluster/_index.md#put-cluster) REST API request:

    ```sh
    PUT /v1/cluster
    { "encrypt_pkeys": false }
    ```
