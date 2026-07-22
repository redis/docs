5. Choose a **Deletion grace period** from the list. You can choose between the following options:
    - **Immediate**: If Redis Cloud loses access to your key, Redis will notify you and delete your database immediately.
    - **Alert only (No deletion, limited SLA)**: If Redis Cloud loses access to your key, Redis will notify you but will not delete your database.

    {{<warning>}}
If you select **Alert only (No deletion, limited SLA)**, Redis will not be able to make changes to your database if we lose access to your key. This includes database upgrades, failovers to persistent storage, and other operations that require access to your key. Because of this, Redis will not be able to meet its [Service Level Agreement (SLA)](https://redis.io/legal/redis-cloud-service-level-agreement/) if we lose access to your key.

Provide a new key as soon as possible to avoid service disruption.
    {{</warning>}}

6. After you finish granting access to your key, you can save your changes. For a new subscription, select **Activate** to activate your subscription and start billing.

    {{<image filename="images/rc/cmek-new-subscription-activate.png" alt="The Activate button." width=500px >}}