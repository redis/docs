---
Title: Collect logs
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Run the log collector script to package relevant logs into a tar.gz file
  to send to Redis Support for help troubleshooting your Kubernetes environment.
linkTitle: Collect logs
weight: 89
---

The Redis Enterprise cluster (REC) log collector script ([`log_collector.py`](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/log_collector/log_collector.py)) creates and fills a directory with the relevant logs for your environment. These logs will help the support team with troubleshooting.

The log collector tool has two modes:

- **restricted** collects only resources and logs created by the operator and Redis Enterprise deployments
- **all** collects everything from your environment

{{<note>}} This script requires Python 3.6 or later. {{</note>}}

## Prerequisites

Before running the log collector, ensure you have the appropriate RBAC permissions configured. See [Log collector RBAC examples]({{< relref "/operate/kubernetes/reference/yaml/log-collector-rbac" >}}) for detailed RBAC configuration instructions.

## Collect logs

1. Download the latest [`log_collector.py`](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/log_collector/log_collector.py) file.

1. Ensure your `kubectl` or `oc` CLI is configured to access the Kubernetes cluster you want to collect logs from.

1. Have a K8s administrator run the script on the system that runs your `kubectl` or `oc` commands.

    ```bash
    python log_collector.py
    ```

## Options

You can run `log_collector.py` with the following options:

| Option | Description |
|--------|-------------|
| `-n`, `--namespace` | Sets the namespace(s) to collect from. Can be set to a single namespace, or multiple namespaces (comma-separated). When left empty, will use the current context's namespace from kubeconfig. |
| `-o`, `--output_dir` | Sets the output directory. Defaults to current working directory. |
| `-a`, `--logs_from_all_pods` | Collect logs from all pods in the selected namespace(s), and otherwise collect only from the operator and pods run by the operator. |
| `-t`, `--timeout` | Time to wait for external commands to finish execution (Linux only). Defaults to 180s. Specify 0 to disable timeout. |
| `--k8s_cli` | The K8s cli client to use (kubectl/oc/auto-detect). Defaults to auto-detect (chooses between 'kubectl' and 'oc'). Full paths can also be used. |
| `-m`, `--mode` | Controls which resources are collected. In 'restricted' mode, only resources associated with the operator and have the label 'app=redis-enterprise' are collected. In 'all' mode, all resources are collected. Defaults to 'restricted' mode. |
| `--collect_istio` | Collect data from istio-system namespace to debug potential problems related to istio ingress method. |
| `--collect_empty_files` | Collect empty log files for missing resources. |
| `--helm_release_name` | Collect resources related to the given Helm release name. |
| `--collect_rbac_resources` | Temporary development flag. Collect all role based access control related custom resources. |
| `-h`, `--help` | Show help message and exit. |

{{< note >}} If you get an error because the yaml module is not found, install the pyYAML module with `pip install pyyaml`.
{{< /note >}}

1. Upload the resulting `tar.gz` file containing all the logs to [Redis Support](https://support.redislabs.com/).


