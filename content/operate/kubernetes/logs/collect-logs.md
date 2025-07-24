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

As of version 6.2.18-3, the log collector tool has two modes:

- **restricted** collects only resources and logs created by the operator and Redis Enterprise deployments
  - This is the default for versions 6.2.18-3 and later
- **all** collects everything from your environment
  - This is the default mode for versions 6.2.12-1 and earlier

{{<note>}} This script requires Python 3.6 or later. {{</note>}}

1. Download the latest [`log_collector.py`](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/log_collector/log_collector.py) file.

1. Have a K8s administrator run the script on the system that runs your `kubectl` or `oc` commands.
    - Pass `-n` parameter to run on a different namespace than the one you are currently on
    - Pass `-m` parameter to change the log collector mode (`all` or `restricted`)
    - Run with `-h` to see more options

    ```bash
    python log_collector.py 
    ```

   {{< note >}} If you get an error because the yaml module is not found, install the pyYAML module with `pip install pyyaml`.
  {{< /note >}}



1. Upload the resulting `tar.gz` file containing all the logs to [Redis Support](https://support.redislabs.com/).
