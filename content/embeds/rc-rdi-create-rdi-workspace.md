To create a Data Integration workspace for an existing [Pro subscription](/content/operate/rc/databases/create-database/create-pro-database-new.md):

1. From the Redis Cloud console, select **Data Integration** from the left-hand menu. If you don't have any workspaces yet, select **Create workspace** to go to the **Create workspace** page.

    ![The create workspace button.](/images/rc/rdi/rdi-create-workspace-button.png)
    {width="200px"}

    If you already have a workspace deployed, you'll see your current workspaces. Select **New workspace** to go to the **Create workspace** page.

    ![The new workspace button.](/images/rc/rdi/rdi-new-workspace-button.png)
    {width="150px"}

    You can also go to the **Data Integration** tab from your subscription or database page and select **Create workspace** to go to the **Create workspace** page for your subscription.

    ![The create workspace button.](/images/rc/rdi/rdi-create-workspace-button.png)
    {width="200px"}

2. Select your Pro subscription from the list if it's not already selected.

    ![The select pro subscription drop down.](/images/rc/rdi/rdi-create-workspace-select-subscription.png)
    {width="80%"}

3. Review the suggested **Data Integration subnet (CIDR)**. The console suggests a dedicated `/22` Classless Inter-Domain Routing (CIDR) range for the workspace.

    Before you create the workspace, [plan network capacity for all its pipelines](/content/operate/rc/rdi/scale-pipeline.md#plan-workspace-network-capacity). If you expect more than 5 sources or more than 5 processor replicas in total, choose a `/21` or larger range. This is conservative planning guidance, not a guaranteed capacity limit. You cannot enlarge the workspace CIDR after creation.

    For AWS, the RDI workspace CIDR must:

    - Be in the same [RFC 1918 private address range](https://datatracker.ietf.org/doc/html/rfc1918#section-3) as the subscription VPC's primary CIDR: `10.0.0.0/8`, `172.16.0.0/12`, or `192.168.0.0/16`.
    - Not overlap with existing subscription, peering, transit gateway (TGW), application, database, or RDI workspace CIDR ranges.

    For example, if the subscription VPC's primary CIDR is `10.238.252.0/24`, then `192.168.0.0/22` is invalid because it is in a different RFC 1918 range. An unused range such as `10.239.0.0/22` is valid.

    If the automatic suggestion is missing or unsuitable, select another unused range that meets your capacity needs and is in the same private range. For more information, see [VPC CIDR block association restrictions](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html#vpc-resize).

    ![The select pro subscription drop down.](/images/rc/rdi/rdi-create-workspace-cidr.png)
    {width="80%"}

4. Select **Create workspace** to create your workspace.

    ![The create workspace button.](/images/rc/rdi/rdi-create-workspace-button.png)
    {width="200px"}

Your workspace will be created in the background. You can select **Create pipeline** to [create your pipeline](/content/operate/rc/rdi/define.md) while the workspace is provisioning, or you can select **Create pipeline later** to go back to the Redis Cloud console.
