---
Title: Enable Private Service Connect
alwaysopen: false
categories:
- docs
- operate
- rc
description: Private Service Connect creates a private endpoint that allows secure
  connections to Redis Cloud databases without exposing your application VPC.
linkTitle: Private Service Connect
toc: 'true'
weight: 50
aliases:
    - /operate/rc/security/private-service-connect/
---

[Private Service Connect](https://cloud.google.com/vpc/docs/private-service-connect) (PSC) creates a private endpoint that allows secure connections to Redis Cloud databases without exposing your application's [virtual private cloud](https://en.wikipedia.org/wiki/Virtual_private_cloud) (VPC). 

This feature is only available for Redis Cloud Pro subscriptions hosted on Google Cloud.

## Considerations

You can use Private Service Connect as an alternative to [VPC peering]({{< relref "/operate/rc/security/network-security/connect-private-endpoint/vpc-peering" >}}), or you can enable both for your subscription.

Compared to VPC peering, Private Service Connect:

- Only exposes the private endpoint instead of the entire application VPC network.

- Allows producer (Redis Cloud VPC) and consumer (application VPC) CIDR ranges to overlap.
 
- Has slightly higher network latency than VPC peering due to load balancing requirements.

    {{<note>}}
Larger clusters are more likely to experience increased latency with Private Service Connect versus VPC peering.
    {{</note>}}

Consider using VPC peering and Private Service Connect in parallel for the following situations:

- When migrating from one connectivity solution to the other.

- If different applications need to connect to the same database but have different latency or security requirements.

## Set up Private Service Connect {#setup-psc}

To set up Private Service Connect, you need to:

1. [Configure Private Service Connect](#configure-psc) in the Redis Cloud console.

1. [Create Private Service Connect endpoints](#create-endpoints) in the application VPC.

1. From the Redis Cloud console, review and [accept the Private Service Connect endpoint connection](#accept-psc).

### Configure PSC {#configure-psc}

First, configure Private Service Connect in Redis Cloud:

1. Select **Subscriptions** from the [Redis Cloud console](https://cloud.redis.io/) menu and then select your subscription from the list.

2. Select the **Connectivity** tab and then **Private Service Connect**.

3. Select the **Create connection** button:

    {{<image filename="images/rc/button-subscription-connectivity-psc-create-connection.png" width="140px" alt="Use the Create connection button to configure a new PSC endpoint." >}}

4. Read the **Latency and cost impact** message and select **Accept and continue**:

    {{<image filename="images/rc/button-subscription-connectivity-psc-accept-continue.png" width="140px" alt="Use the Accept and continue button to acknowledge PSC's impact on latency and cost." >}}

5. For **Create connection**, enter the following **Endpoint details**:

    | Setting&nbsp;name | Description |
    |-------------------|-------------|
    | _Google Cloud project ID_ | Google Cloud project ID |
    | _VPC name_ | Name of the VPC that hosts your application |
    | _Subnet name_ | Name of your VPC's subnet of IP address ranges |
    | _Endpoint name_ | Prefix used to create PSC endpoints in the consumer application VPC, so endpoint names appear in Google Cloud as _endpoint name prefix + endpoint number_ |

6. Continue to the **Add connections** step:
    
    {{<image filename="images/rc/button-subscription-continue.png" width="100px" alt="Use the Continue button to proceed to the Add connections step." >}}

7. Select either **Bash Shell** or **PowerShell** and then download or copy the provided `gcloud` script for later:

    {{<image filename="images/rc/subscription-connectivity-psc-gcloud-script.png" width="350px" alt="Use the Download or Copy buttons to save the gcloud script for later use." >}}

8. Select **Continue** to save this endpoint configuration:

    {{<image filename="images/rc/button-subscription-continue.png" width="100px" alt="Use the Continue button to save the PSC endpoint configuration." >}}

### Create endpoints {#create-endpoints}

Now that you have a pending Private Service Connect entry, you need to create the endpoints in your application's VPC:

1. If you have not already done so, [enable Cloud DNS](https://cloud.google.com/dns/docs/set-up-dns-records-domain-name) for your Google Cloud project.

    {{<note>}}
Since it can take some time for the DNS changes to become active, we recommend you wait 10 minutes before running the `gcloud` script in the next steps.
    {{</note>}}

1. If you already have a copy of the `gcloud` script shown earlier during the **Add connections** step, you can continue to the next step. 

    1. Otherwise, return to your Redis Cloud subscription's **Connectivity > Private Service Connect** screen and select **Complete setup** for the pending endpoint:

        {{<image filename="images/rc/button-subscription-connectivity-psc-complete-setup.png" width="140px" alt="Use the Complete setup button if you need access to the gcloud script again." >}}

    1. Download or copy the script.

1. Use the [`gcloud` CLI](https://cloud.google.com/sdk/gcloud) to run the script.

    {{<warning>}}
To ensure the `gcloud` script configures the endpoints correctly, do not make any changes to it.
    {{</warning>}}

The `gcloud` script creates a PSC endpoint and a DNS response policy in the consumer application VPC.


### Accept PSC connection {#accept-psc}

After the `gcloud` script finishes creating the Private Service Connect endpoint, you need to accept the connection in Redis Cloud:

1. In the Redis Cloud console, return to your subscription's **Connectivity > Private Service Connect** screen.

1. Find your pending endpoint connection in the list and select **Accept**:

    {{<image filename="images/rc/button-subscription-connectivity-psc-accept.png" width="100px" alt="Use the Accept button to finish PSC endpoint setup." >}}

### Connect to database {#connect-db}

Once your Private Service Connect endpoint is active, you can connect your application to a database:

1. From your subscription's **Connectivity > Private Service Connect** tab, select the **Connect** button for the active endpoint:

    {{<image filename="images/rc/button-connect.png" width="100px" alt="Use the Connect button to retrieve PSC connection details." >}}

1. Select a database from the list.

1. Copy the endpoint and use it in your application to connect to your database.

{{< note >}}
Once your Private Service Connect endpoint is active, you must connect to the database from the Private Service Connect endpoint if you want to connect with Private Service connect. If you previously used the public or private endpoint to connect to your database, you must migrate any connections to the Private Service Connect endpoint.
{{< /note >}}


## Deactivate Private Service Connect {#deactivate-psc}

To deactivate Private Service Connect for your subscription:

1. Select **Subscriptions** from the [Redis Cloud console](https://cloud.redis.io/) menu and then select your subscription from the list.

1. Select the **Connectivity** tab and then **Private Service Connect**.

1. For each endpoint:

    1. Select the **Delete PSC endpoint** button:

        {{<image filename="images/rc/icon-delete-teal.png" width="40px" alt="Use the Delete PSC endpoint button to remove an endpoint." >}}

    1. Copy the provided `gcloud` script from the **Remove endpoint** dialog.

    1. Run the `gcloud` script with [`gcloud` CLI](https://cloud.google.com/sdk/gcloud) to delete the endpoint and DNS response policy.

1. After you remove all endpoints, select the **Actions** button to see a list of available actions:

    {{<image filename="images/rc/icon-psc-actions.png" width="40px" alt="Use the Toggle actions button to see a list of actions." >}}

1. Select **Remove service** and then **Confirm**:

    {{<image filename="images/rc/button-subscription-connectivity-psc-remove-service-confirm.png" width="100px" alt="Use the Confirm button to deactivate Private Service Connect." >}}

Once you remove all of your Private Service Connect endpoints and deactivate it, you must migrate any connections from a Private Service Connect endpoint to the public or private endpoint of your database.

## Limitations

Private Service Connect has the following limitations in Redis Cloud:

- Although Redis Cloud supports using Private Service Connect with Enterprise clustering, you cannot use the [Cluster API]({{< relref "/operate/rc/databases/create-database#oss-cluster-api" >}}) with Private Service Connect enabled.

## Continue learning with Redis University

{{< university-links >}}
