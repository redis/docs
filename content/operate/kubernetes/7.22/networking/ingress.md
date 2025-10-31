---
Title: Configure Ingress for external routing
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Configure an ingress controller to access your Redis Enterprise databases
  from outside the Kubernetes cluster.
linkTitle: Ingress routing
weight: 5
url: '/operate/kubernetes/7.22/networking/ingress/'
---

## Prerequisites

Before creating an Ingress, you'll need:

 - A RedisEnterpriseDatabase (REDB) with TLS enabled for client connections
 - A supported Ingress controller with `ssl-passthrough` enabled
    - [Ingress-NGINX Controller](https://kubernetes.github.io/ingress-nginx/deploy/)
        - Be sure to use the `kubernetes/ingress-nginx` controller and NOT the `nginxinc/kubernetes-ingress` controller.
    - [HAProxy Ingress](https://haproxy-ingress.github.io/docs/getting-started/)
    - To use Istio for your Ingress resources, see [Configure Istio for external routing]({{< relref "/operate/kubernetes/7.22/networking/istio-ingress" >}})

{{<note>}}Make sure your Ingress controller has `ssl-passthrough`enabled. This is enabled by default for HAProxy, but disabled by default for NGINX. See the [NGINX User Guide](https://kubernetes.github.io/ingress-nginx/user-guide/tls/#ssl-passthrough) for details. {{</note>}}

## Create an Ingress resource

1. Retrieve the hostname of your Ingress controller's `LoadBalancer` service.

    ``` sh
    $ kubectl get svc <haproxy-ingress | ingress-ngnix-controller> \
                        -n <ingress-ctrl-namespace>
    ```

    Below is example output for an HAProxy running on a K8s cluster hosted by AWS.  

    ``` sh
    NAME              TYPE           CLUSTER-IP    EXTERNAL-IP                                                              PORT(S)                      AGE   
    haproxy-ingress   LoadBalancer   10.43.62.53   a56e24df8c6173b79a63d5da54fd9cff-676486416.us-east-1.elb.amazonaws.com   80:30610/TCP,443:31597/TCP   21m
    ```

1. Choose the hostname you will use to access your database (this value will be represented in this article with `<my-db-hostname>`).  

1. Create a DNS entry that resolves your chosen database hostname to the IP address for the Ingress controller's LoadBalancer.  

1. Create the Ingress resource YAML file.  

    ``` YAML
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
      name: rec-ingress
      annotations:
        <controller-specific-annotations-below>
    spec:
      rules:
      - host: <my-db-hostname>
        http:
          paths:
          - path: /
            pathType: ImplementationSpecific
            backend:
              service:
                name: <db-name>
                port:
                  name: redis
    ```  

    For HAProxy, insert the following into the `annotations` section:  

    ``` YAML
    kubernetes.io/ingress.class: haproxy
     ingress.kubernetes.io/ssl-passthrough: "true"
    ```

    For NGINX, insert the following into the `annotations` section:  

    ``` YAML
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    ```  

    The `ssl-passthrough` annotation is required to allow access to the database. The specific format changes depending on your Ingress controller and any additional customizations. See [NGINX Configuration annotations](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/) and [HAProxy Ingress Options](https://www.haproxy.com/documentation/kubernetes/latest/configuration/ingress/) for updated annotation formats.  

## Test your external access  

To test your external access to the database, you need a client that supports [TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security) and [SNI](https://en.wikipedia.org/wiki/Server_Name_Indication).  

#### Test your access with Openssl  

1. Get the default CA certificate from the `redis-enterprise-node` container on any of the Redis Enterprise pods.  

    ``` sh
    $ kubectl exec -it <pod-name> -c redis-enterprise-node \
                    -- cat /etc/opt/redislabs/proxy_cert.pem
    ```  

1. Run the following `openssl` command, substituting your own values for `<my-db-hostname>`.  

    ``` sh
    $ openssl s_client \
      -connect <my-db-hostname>:443 \
      -crlf -CAfile ./proxy_cert.pem \
      -servername <my-db-hostname>
    ```  

    If you are connected to the database, you will receive `PONG` back, as shown below:  

    ``` sh
    ...
     Verify return code: 0 (ok)
    ---

    PING
    +PONG
    ```  

#### Test your access with Python  

You can use the code below to test your access with Python, substituting your own values for `<my-db-hostname>` and `<file-path>`.  

``` python
import redis

r = redis.StrictRedis(host='<my-db-hostname>',
              port=443, db=0, ssl=True,
              ssl_ca_certs='/<file-path>/proxy_cert.pem')


print(r.info())
```

Your output should look something like this:  

``` sh
$ /Users/example-user/Documents/Projects/test_client/venv3.7/bin/python \
    /Users/example-user/Documents/Projects/test_client/test_ssl.py
{
    'redis_version': '5.0.5',
    'redis_git_sha1': 0,
    'redis_git_dirty': 0,
    'redis_build_id': 0,
    'redis_mode': 'standalone',
    'os': 'Linux 4.14.154-128.181.amzn2.x86_64 x86_64',
    'arch_bits': 64,
    'multiplexing_api': 'epoll',
    'gcc_version': '7.4.0',
    'process_id': 1,
    'run_id': '3ce7721b096517057d28791aab555ed8ac02e1de',
    'tcp_port': 10811,
    'uptime_in_seconds': 316467,
    'uptime_in_days': 3,
    'hz': 10,
    'lru_clock': 0,
    'config_file': '',
    'connected_clients': 1,
    'client_longest_output_list': 0,
    'client_biggest_input_buf': 0,
    'blocked_clients': 0,
    'used_memory': 12680016,
    'used_memory_human': '12.9M',
    'used_memory_rss': 12680016,
    'used_memory_peak': 13452496,
    'used_memory_peak_human': '12.82M',
    'used_memory_lua': 151552,
    'mem_fragmentation_ratio': 1,
    'mem_allocator': 'jemalloc-5.1.0',
    'loading': 0,
    'rdb_changes_since_last_save': 0,
    'rdb_bgsave_in_progress': 0,
    'rdb_last_save_time': 1577753916,
    'rdb_last_bgsave_status': 'ok',
    'rdb_last_bgsave_time_sec': 0,
    'rdb_current_bgsave_time_sec': -1,
    'aof_enabled': 0,
    'aof_rewrite_in_progress': 0,
    'aof_rewrite_scheduled': 0,
    'aof_last_rewrite_time_sec': -1,
    'aof_current_rewrite_time_sec': -1,
    'aof_last_bgrewrite_status': 'ok',
    'aof_last_write_status': 'ok',
    'total_connections_received': 4,
    'total_commands_processed': 6,
    'instantaneous_ops_per_sec': 14,
    'total_net_input_bytes': 0,
    'total_net_output_bytes': 0,
    'instantaneous_input_kbps': 0.0,
    'instantaneous_output_kbps': 0.0,
    'rejected_connections': 0,
    'sync_full': 1,
    'sync_partial_ok': 0,
    'sync_partial_err': 0,
    'expired_keys': 0,
    'evicted_keys': 0,
    'keyspace_hits': 0,
    'keyspace_misses': 0,
    'pubsub_channels': 0,
    'pubsub_patterns': 0,
    'latest_fork_usec': 0,
    'migrate_cached_sockets': 0,
    'role': 'master',
    'connected_slaves': 1,
    'slave0': {
        'ip': '0.0.0.0',
        'port': 0,
        'state': 'online',
        'offset': 0,
        'lag': 0
    },
    'master_repl_offset': 0,
    'repl_backlog_active': 0,
    'repl_backlog_size': 1048576,
    'repl_backlog_first_byte_offset': 0,
    'repl_backlog_histlen': 0,
    'used_cpu_sys': 0.0,
    'used_cpu_user': 0.0,
    'used_cpu_sys_children': 0.0,
    'used_cpu_user_children': 0.0,
    'cluster_enabled': 0
}

Process finished with exit code 0
```
