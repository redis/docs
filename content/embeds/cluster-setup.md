1. In a browser, go to `https://<name-or-IP-address-of-the-machine-with-Redis-Enterprise-Software-installed>:8443` to access the Cluster Manager UI. If you use a browser on the host machine, you can also access the Cluster Manager UI at `https://localhost:8443`.

    The cluster generates self-signed TLS certificates to secure the connection. Because these self-signed certificates are unknown to the browser, you must accept them before you proceed.

    If the server does not show the sign-in screen, try again after a few minutes.

1. Select **Create new cluster**.

    ![When you first install Redis Software, you need to set up a cluster.](/images/rs/screenshots/cluster/setup/create-cluster.png)

2. Enter an email and password for the administrator account, then select **Next** to proceed to cluster setup.

    ![Set the credentials for your admin user.](/images/rs/screenshots/cluster/setup/admin-credentials.png)

    You can also use these credentials to connect to the [REST API]({{< relref "/operate/rs/references/rest-api" >}}).

3. Enter your cluster license key if you have one. Otherwise, a trial version is installed.

    ![Enter your cluster license key if you have one.](/images/rs/screenshots/cluster/setup/cluster-license-key.png)

4. In the **Configuration** section, enter a cluster FQDN such as `cluster.local`, then select **Next**.

    ![Configure the cluster FQDN.](/images/rs/screenshots/cluster/setup/config-cluster.png)

    > [!WARNING]
    > If the FQDN is `cluster.local`, you cannot configure DNS. You cannot change the FQDN after cluster creation.

1. On the node setup screen, select **Create cluster** to accept the defaults.

    ![Configure the node specific settings.](/images/rs/screenshots/cluster/setup/node-settings.png)

6. Select **OK** to acknowledge the replacement of the HTTPS TLS certificate on the node.  If you receive a browser warning, you can proceed safely.

    ![Modal shown when a page refresh is needed because the certificates have been updated.](/images/rs/screenshots/cluster/setup/https-page-refresh-modal.png)
