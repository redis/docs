In the **Metrics** tab of your database, select **Connect to Prometheus > Copy Prometheus endpoint** to save your Prometheus endpoint to the clipboard.

{{<image filename="images/rc/database-metrics-connect-prometheus.png" width="250px" alt="Use the Connect to Prometheus button to get the Prometheus endpoint.">}}

You can also get the Prometheus endpoint by calling [`GET /subscriptions/{subscriptionId}`]({{< relref "/operate/rc/api/api-reference#tag/Subscriptions-Pro/operation/getSubscriptionById" >}}) and getting the `prometheusEndpoint` from the response.
