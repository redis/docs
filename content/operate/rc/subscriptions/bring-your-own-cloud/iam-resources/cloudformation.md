---
Title: Create IAM resources using CloudFormation
Weight: $weight
alwaysopen: false
categories:
- docs
- operate
- rc
linkTitle: CloudFormation
---
You can use [AWS CloudFormation](https://aws.amazon.com/cloudformation/) to create the IAM resources for Redis Cloud Bring your Own Cloud (BYOC).

{{< warning >}}
We use the provided credentials to configure your AWS environment and provision required resources.

You **must not** change the configurations of provisioned resources or stop or terminate provisioned instances. If you do, your databases will be inaccessible and Redis will not be able to ensure database stability. See [Avoid service disruption]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings#avoid-service-disruption" >}}) for more details.
{{< /warning >}}

## Create resources using CloudFormation on the AWS Console

The following link uses CloudFormation to create a stack using the AWS console:

<a href="https://console.aws.amazon.com/cloudformation/home?#/stacks/new?stackName=RedisCloud&templateURL=https://s3.amazonaws.com/iam-resource-automation-do-not-delete/RedisCloud.yaml">
<img alt="Launch RedisCloud template" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"/>
</a>

When the stack finishes, select the stack and then the **Outputs** tab. You need the following information to [create a Cloud Account]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings" >}}) in the Redis Cloud console:

- **Access Key ID**: The `accessKeyId` output.
- **Secret Access Key**: Follow the link to AWS Secrets Manager in the `accessSecretKey` output and select **Retrieve secret value**. 
- **IAM Role Name**: The `IAMRoleName` output.

## Create resources using CloudFormation through AWS CLI

You can also use the AWS command-line interface (CLI) to create the stack:

``` shell
aws cloudformation create-stack --stack-name RedisCloud --template-url \
https://s3.amazonaws.com/iam-resource-automation-do-not-delete/RedisCloud.yaml \
--capabilities CAPABILITY_AUTO_EXPAND CAPABILITY_NAMED_IAM CAPABILITY_IAM
```

You can track the status of the cloud formation with the following command:

```shell
aws cloudformation describe-stacks --stack-name RedisCloud
```

After the stack finishes, you can retrieve the outputs from the `Outputs` section of the response.

You need the following information to [create a Cloud Account]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings" >}}) in the Redis Cloud console:

- **Access Key ID**: The `accessKeyId` output.
- **Secret Access Key**: Extract the secret ID from the `accessSecretKey` output. The secret ID is the `name` query parameter in the `accessSecretKey` output. 

    For example, if the `accessSecretKey` output is `https://console.aws.amazon.com/secretsmanager/home?region=<region>/secret?name=/redislabsuser/secret_access_key`, then the secret ID is `/redislabsuser/secret_access_key`.

    Use the secret ID to retrieve the secret value using the AWS secretsmanager CLI:

    ``` shell
    aws secretsmanager get-secret-value --secret-id=<accessSecretKey-ID>
    ```
    Replace `<accessSecretKey-ID>` with the secret ID you extracted from the `accessSecretKey` output.
- **IAM Role Name**: The `IAMRoleName` output.
