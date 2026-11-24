---
Title: Test HA failover
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to perform HA failover testing for Redis Data Integration (RDI) to ensure high availability and reliability of your data integration setup.
group: di
hideListLinks: false
linkTitle: Test HA failover
summary: How to perform HA failover testing
type: integration
weight: 100
---

## Setup
1. Ensure that RDI is up and running on both primary and secondary nodes.
   Run the following command and verify and that each instance should show healthy and running `rdi-api` and `rdi-operator` pods.
```
kubectl -n rdi get pods

# Example output:
NAME                                   READY   STATUS      RESTARTS      AGE
collector-api-577d95bfd8-5wbg6         1/1     Running     0             12m
collector-mysql-95f45bcf7-vwn5l        1/1     Running     0             12m
fluentd-zq2lc                          1/1     Running     0             72m
logrotate-29530445-j729x               0/1     Completed   0             14m
logrotate-29530450-dprr2               0/1     Completed   0             9m40s
logrotate-29530455-mfmzw               0/1     Completed   0             4m40s
processor-f66655469-h7nw2              1/1     Running     0             12m
rdi-api-f75df6796-qwqjw                1/1     Running     0             72m
rdi-metrics-exporter-d57cdf8c8-wjzb5   1/1     Running     0             72m
rdi-operator-7f7f6c7dfd-5qmjd          1/1     Running     0             71m
rdi-reloader-77df5f7854-lwmvz          1/1     Running     0             71m
```

2. Identify the leader node (this is the one that has a running collector pod). A
   collector is named after its source, so the example above shows `collector-mysql` for a
   source named `mysql`.

   You can also ask each node about the pipeline directly. On the follower, the pipeline
   stands by:

   ```
   kubectl -n rdi get pipeline default -o jsonpath='{.status.phase}'

   # Example output on the follower:
   Standby

   # Example output on the leader:
   Active
   ```

   [`redis-di describe`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe.md)
   shows `Status: standby` on the follower, and
   [`redis-di info`](/content/integrate/redis-data-integration/reference/cli/redis-di-info.md)
   shows `Leader Election Mode: follower`.

## Performing the HA Failover Testing

To perform HA, you can simulate a connection failure between the leader and the RDI database by blocking the network traffic. You can do this by running the following commands on the leader node:

1. Identify the RDI database IP (replace `<hostname>` with your own hostname):
```
dig +short <hostname>

# Example:
# dig +short my.redis.hostname.com

# Example output:
54.78.220.161
```

2. For each of the IPs returned by the above command, run the following command to block the traffic:

```
sudo iptables -I FORWARD -d <database_ip> -j DROP

# With the IP from the example above, the command would be:
sudo iptables -I FORWARD -d 54.78.220.161 -j DROP
```


The default configuration for the leader lock is 60 seconds, so it may take up to 2 minutes for the failover to occur.
Meanwhile you can follow the logs of the operator to see the failover process:

```
kubectl -n rdi logs rdi-operator-7f7f6c7dfd-5qmjd -f
```

In about 10 seconds you will start seeing log entries from the leader saying that it could not acquire the leadership.
When the leader lock expires, the second node will acquire the leadership and you will see log entries from the second node indicating that it has become the leader.

Once the failover completes, the two nodes swap their pipeline phases: the pipeline has
`Active` status on the new leader and `Standby` status on the old one.

## Cleanup

To clean up after the test, remove the `iptables` rule that you added to block the traffic:

```sudo iptables -D FORWARD -d <databse_ip> -j DROP```

Use `sudo iptables -S | grep <database_ip>` to verify that the rule has been removed.

## Trigger a failover manually

To move the pipelines to the other instance without simulating a failure, for example before
maintenance, put the leader in standby with the
[`standby_mode`](/content/integrate/redis-data-integration/reference/instance-settings.md#standby_mode)
instance setting. Each instance has its own settings, so run these commands with a CLI
[context](/content/integrate/redis-data-integration/reference/cli/_index.md#contexts) that points
to the instance you want to change.

1. Check that the other instance can take over. On the other instance, run:

   ```
   redis-di get-setting standby_mode
   ```

   The value must not be `true`. If it is `<none>`, also check that
   `operator.leaderElection.standbyMode` is not `true` in the Helm values of that instance. If
   both instances are in standby, neither of them runs the pipelines.

1. On the leader, run `redis-di get-setting standby_mode` and record the value so you can
   restore it after maintenance.

1. On the leader, set `standby_mode` to `true`:

   ```
   redis-di set-setting standby_mode true
   ```

   The leader gives up the leadership and its pipelines change to `standby`.

1. Check that the other instance has taken over. Its
   [`redis-di info`](/content/integrate/redis-data-integration/reference/cli/redis-di-info.md)
   output must show `Leader Election Mode: leader`.

1. Run `redis-di describe <pipeline>` for each expected active pipeline on the new leader.
   Check that its components run without errors and that data reaches the target before
   starting maintenance. Leadership changes and component startup happen asynchronously.

1. When maintenance is over, restore the previous `standby_mode` value on the old leader:

   - If it was `false`, run `redis-di set-setting standby_mode false`.
   - If it was `true`, run `redis-di set-setting standby_mode true`.
   - If it was `<none>`, run `redis-di delete-setting standby_mode`.

   Deleting the setting restores `operator.leaderElection.standbyMode` from the Helm values.
   It lets the instance rejoin leader election only when that value is `false`.

You can also set and delete `standby_mode` with `PATCH /api/v2/settings`. See
[RDI instance settings](/content/integrate/redis-data-integration/reference/instance-settings.md)
for details.
