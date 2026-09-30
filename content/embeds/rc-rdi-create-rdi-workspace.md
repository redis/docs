To create a Data Integration workspace for an existing [Pro subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}):

1. From the Redis Cloud console, select **Data Integration** from the left-hand menu. If you don't have any workspaces yet, select **Create workspace** to go to the **Create workspace** page.

    {{<image filename="images/rc/rdi/rdi-create-workspace-button.png" alt="The create workspace button." width=200px >}}

    If you already have a workspace deployed, you'll see your current workspaces. Select **New workspace** to go to the **Create workspace** page.

    {{<image filename="images/rc/rdi/rdi-new-workspace-button.png" alt="The new workspace button." width=150px >}}

    You can also go to the **Data Integration** tab from your subscription or database page and select **Create workspace** to go to the **Create workspace** page for your subscription.

    {{<image filename="images/rc/rdi/rdi-create-workspace-button.png" alt="The create workspace button." width=200px >}}

2. Select your Pro subscription from the list if it's not already selected.

    {{<image filename="images/rc/rdi/rdi-create-workspace-select-subscription.png" alt="The select pro subscription drop down." width=80% >}}

3. A **Data Integration subnet (CIDR)** is automatically generated for you. Each RDI workspace uses a dedicated `/22` CIDR.

    For AWS, the RDI workspace CIDR must:

    - Be in the same [RFC 1918 private address range](https://datatracker.ietf.org/doc/html/rfc1918#section-3) as the subscription VPC's primary CIDR: `10.0.0.0/8`, `172.16.0.0/12`, or `192.168.0.0/16`.
    - Not overlap with existing subscription, peering, transit gateway (TGW), application, database, or RDI workspace CIDR ranges.

    For example, if the subscription VPC's primary CIDR is `10.238.252.0/24`, then `192.168.0.0/22` is invalid because it is in a different RFC 1918 range. An unused range such as `10.239.0.0/22` is valid.

    If the automatic suggestion is missing or unsuitable, select another unused `/22` CIDR in the same private range. For more information, see [VPC CIDR block association restrictions](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html#vpc-resize).

    {{<image filename="images/rc/rdi/rdi-create-workspace-cidr.png" alt="The select pro subscription drop down." width=80% >}}

4. Select **Create workspace** to create your workspace.

    {{<image filename="images/rc/rdi/rdi-create-workspace-button.png" alt="The create workspace button." width=200px >}}

Your workspace will be created in the background. You can select **Create pipeline** to [create your pipeline]({{<relref "/operate/rc/rdi/define">}}) while the workspace is provisioning, or you can select **Create pipeline later** to go back to the Redis Cloud console.
