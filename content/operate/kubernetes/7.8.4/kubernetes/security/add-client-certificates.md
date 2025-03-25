---
categories:
- docs
- operate
- kubernetes
description: Add client certificates to your REDB custom resource.
linkTitle: Add client certificates
title: Add client certificates
weight: 95
url: '/operate/kubernetes/7.8.4/kubernetes/security/add-client-certificates/'
---

For each client certificate you want to use with your database, you need to create a Kubernetes secret to hold it. You can then reference that secret in your Redis Enterprise database (REDB) custom resource spec.

## Create a secret to hold the new certificate

1. [Create the secret config file](https://kubernetes.io/docs/tasks/configmap-secret/managing-secret-using-config-file/) with the required fields shown below.

    ```yaml
    apiVersion: v1
    kind: Secret
    type: Opaque
    metadata:
      name: <client-cert-secret>
      namespace: <your-rec-namespace>
    data:
      cert: <client-certificate>
    ```
  
1. Apply the file to create the secret resource.

    ```bash
    kubectl apply -f <client-cert-secret>.yaml
    ```

## Edit the REDB resource

1. Add the secret name to the REDB custom resource (`redb.yaml`) with the `clientAuthenticationCertificates` property in the `spec` section.

  ```yaml
   spec:
      clientAuthenticationCertificates:
      - <client-cert-secret>
  ```
