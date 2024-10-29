 [Versions 6.4.2 and later]({{< relref "/operate/kubernetes/release-notes/6-4-2-releases/" >}}) uses a new `ValidatingWebhookConfiguration` resource to replace `redb-admission`. To use newer releases, delete the old webhook resource and apply the new file.

1. Delete the existing `ValidatingWebhookConfiguration` on the Kubernetes cluster (named `redb-admission`).

        ```sh
        kubectl delete ValidatingWebhookConfiguration redb-admission
        ```

1. Apply the resource from the new file.

        ```sh
        kubectl apply -f deploy/admission/webhook.yaml
        ```
        