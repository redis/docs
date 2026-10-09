To create a Data Integration workspace for an existing [Pro subscription](/content/operate/rc/databases/create-database/create-pro-database-new.md):

1. In the Redis Cloud console, select **Data Integration**.

2. Select **Create workspace** if you have no workspaces yet.

    ![The create workspace button.](/images/rc/rdi/rdi-create-workspace-button.png)
    {width="200px"}

    If you already have a workspace, select **New workspace**.

    ![The new workspace button.](/images/rc/rdi/rdi-new-workspace-button.png)
    {width="150px"}

    You can also open **Data Integration** from a subscription or database page.
    Select **Create workspace** to use that subscription.

    ![The create workspace button.](/images/rc/rdi/rdi-create-workspace-button.png)
    {width="200px"}

3. Select your Pro subscription if it is not already selected.

    ![The select pro subscription drop down.](/images/rc/rdi/rdi-create-workspace-select-subscription.png)
    {width="80%"}

4. Review **Data Integration subnet (CIDR)**. The console suggests a dedicated
   `/22` Classless Inter-Domain Routing (CIDR) range for the workspace.

    [Plan network capacity for all pipelines](/content/operate/rc/rdi/scale-pipeline.md#plan-workspace-network-capacity)
    before you create the workspace. Choose a `/21` or larger range if you plan
    more than 5 sources or more than 5 processor replicas in total.
    These counts are a conservative planning trigger, not a capacity limit.
    You cannot enlarge the workspace CIDR after creation.

    For Amazon Web Services (AWS), the RDI workspace CIDR must:

    - Be in the same [RFC 1918 private address range](https://datatracker.ietf.org/doc/html/rfc1918#section-3) as the subscription virtual private cloud (VPC)'s primary CIDR: `10.0.0.0/8`, `172.16.0.0/12`, or `192.168.0.0/16`.
    - Not overlap with existing subscription, peering, transit gateway (TGW), application, database, or RDI workspace CIDR ranges.

    For example, a subscription VPC has the primary CIDR `10.238.252.0/24`.
    The range `192.168.0.0/22` is invalid because it is in a different
    RFC 1918 range. An unused range such as `10.239.0.0/22` is valid.

    If the suggestion is missing or unsuitable, select another unused range.
    It must meet your capacity needs and use the same private address range.
    See [VPC CIDR block association restrictions](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html#vpc-resize).

    ![The select pro subscription drop down.](/images/rc/rdi/rdi-create-workspace-cidr.png)
    {width="80%"}

5. Select **Create workspace**.

    ![The create workspace button.](/images/rc/rdi/rdi-create-workspace-button.png)
    {width="200px"}

Redis Cloud creates the workspace in the background. Select **Create pipeline**
to [create your pipeline](/content/operate/rc/rdi/define.md) while it provisions.
Select **Create pipeline later** to return to the Redis Cloud console.
