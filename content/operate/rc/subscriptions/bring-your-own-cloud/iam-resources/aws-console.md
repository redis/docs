---
LinkTitle: AWS console
Title: Create IAM resources using AWS console
alwaysopen: false
categories:
- docs
- operate
- rc
weight: $weight
aliases:
  - /operate/rc/how-to/view-edit-cloud-account/iam-resources/aws-console
  - /operate/rc/cloud-accounts/iam-resources/aws-console
  - /operate/rc/cloud-integrations/aws-cloud-accounts/iam-resources/aws-console
---
Follow these steps to manually create IAM resources using the [AWS console](https://console.aws.amazon.com/).

{{< warning >}}
We use the provided credentials to configure your AWS environment and provision required resources.

You **must not** change the configurations of provisioned resources or stop or terminate provisioned instances. If you do, your databases will be inaccessible and Redis will not be able to ensure database stability. See [Avoid service disruption]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings#avoid-service-disruption" >}}) for more details.
{{< /warning >}}

## Step 1: Create the IAM instance policy

The IAM instance policy controls the permissions for the instances that Redis Cloud creates in your AWS account.

Follow the steps to [create an IAM policy using the JSON editor](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_create-console.html#access_policies_create-json-editor) with the following settings:

- In **Specify permissions**, select **JSON**, and then enter the contents of the RedisLabsInstanceRolePolicy.json policy file:

    {{< scrollable-code >}}
{{< external-json "https://raw.githubusercontent.com/Redislabs-Solution-Architects/cloudformation-aws-Redislabs-Cloud-Account-IAM-Resources/refs/heads/master/RedisLabsInstanceRolePolicy.json" >}}
    {{< /scrollable-code >}}

- In **Review and Create**, enter `RedisLabsInstanceRolePolicy` in the **Policy name** field.

Select **Create policy** to finish policy creation.

## Step 2: Create the service role

After creating the instance role policy, you must create a role to assign the policy.

Follow the steps to [create a role for an AWS service](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-service.html#roles-creatingrole-service-console) with the following settings:

- In **Select trusted entity**:
    - **Trusted entity**: Select **AWS service**.
    - **Service or use case**: Select **EC2**.
    - **Use case**: Select **EC2**.
- In **Add permissions**, select the **RedisLabsInstanceRolePolicy** you created.
- In **Name, review, and create**, enter `redislabs-cluster-node-role` in the **Role name** field.

Select **Create role** to finish role creation.

## Step 3: Create the user policy

The user policy controls the permissions for the user that Redis Cloud uses to manage your AWS account.

Follow the steps to [create an IAM policy using the JSON editor](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_create-console.html#access_policies_create-json-editor) with the following settings:

- In **Specify permissions**, select **JSON**, and then enter the contents of the RedisLabsIAMUserRestrictedPolicy.json policy file:

    {{< scrollable-code >}}
{{< external-json "https://raw.githubusercontent.com/Redislabs-Solution-Architects/cloudformation-aws-Redislabs-Cloud-Account-IAM-Resources/refs/heads/master/RedislabsIAMUserRestrictedPolicy.json" >}}
    {{< /scrollable-code >}}

- In **Review and Create**, enter `RedislabsIAMUserRestrictedPolicy` in the **Policy name** field.

Select **Create policy** to finish policy creation.

## Step 4: Create the programmatic access user

After you create the user policy, you must create a programmatic access user and attach the policy to it.

Follow the steps to [create a user on the AWS console](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html), with the following settings:

- In **Specify user details**, For **User name**, enter `redislabs-user`.
- In **Set permissions**:
    - **Permissions options**: Select **Attach existing policies directly**.
    - **Permissions policies**: Select the **RedislabsIAMUserRestrictedPolicy** you created from the list.

Select **Create user** to create the user.

After you create the user, you need to add an access key for the user.

Follow the steps to [create an access key](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-keys-admin-managed.html#admin-create-access-key) for the user you just created. Save the access key ID and secret access key in a secure location.

## Step 5: Create the console access role

The console access role controls the permissions for the user that Redis Cloud uses to access the AWS console.

Follow the steps to [Create a role for an IAM user](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-user.html) with the following settings:

- In **Select trusted entity**:
    - **Trusted entity**: Select **AWS account**.
    - **An AWS account**: Select **Another AWS account**.
    - **Account ID**: Enter account number `168085023892` (Redis Cloud's AWS account).
    - **Options**: Select **Require MFA**.
    {{< warning >}}
Do not check the **Require external ID** checkbox.
    {{< /warning >}}
- In **Add permissions**, select the **RedislabsIAMUserRestrictedPolicy** you created.
- In **Name, review, and create**, enter `redislabs-role` in the **Role name** field.

Select **Create role** to finish role creation. Save the Role name for later.

## Next steps

When you've finished creating all of the resources, you can [create a Cloud Account]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings" >}}) in the Redis Cloud console. To do this, you'll need the following information:

- **Access Key ID**: The Access Key ID for the [programmatic user you created](#step-4-create-the-programmatic-access-user).
- **Secret Access Key**: The Secret Access Key for the [programmatic user you created](#step-4-create-the-programmatic-access-user).
- **IAM Role Name**: The name of the [console access role you created](#step-5-create-the-console-access-role).
