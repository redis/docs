---
Title: Create IAM resources using Terraform
Weight: $weight
alwaysopen: false
categories:
- docs
- operate
- rc
linkTitle: Terraform
aliases:
  - /operate/rc/how-to/view-edit-cloud-account/iam-resources/terraform
  - /operate/rc/cloud-accounts/iam-resources/terraform
  - /operate/rc/cloud-integrations/aws-cloud-accounts/iam-resources/terraform
---
You can use [HashiCorp Terraform](https://www.terraform.io/intro/index.html) to create identity and access management (IAM) resources to support AWS cloud account access to Redis Cloud subscriptions.

{{< warning >}}
We use the provided credentials to configure your AWS environment and provision required resources.

You **must not** change the configurations of provisioned resources or stop or terminate provisioned instances. If you do, your databases will be inaccessible and Redis will not be able to ensure database stability. See [Avoid service disruption]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings#avoid-service-disruption" >}}) for more details.
{{< /warning >}}

The following example uses the `terraform-aws-Redislabs-Cloud-Account-IAM-Resources` module, located in Amazon&nbsp;S3:


1. Copy the following code into a file called `main.tf`.

    {{< line-limit >}}
{{% code-include file="rv/terraformIAMTemplate.json" language="js" %}}
    {{< /line-limit >}}

    Replace the following values in the `main.tf` file:

    - `<profile>`: The AWS CLI profile to use.
    - `<region>`: The AWS region to use.
    - `<pgp_key>`: The PGP key to use. For details, see the [Terraform docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_user_login_profile#pgp_key).

2. Initialize Terraform with the module:

    Note: Terraform requires [AWS credentials be supplied](https://www.terraform.io/docs/language/modules/sources.html#s3-bucket), but the source of the module is a public S3 bucket, so any valid credentials should work. 

    ```
    AWS_ACCESS_KEY_ID=<access_key_id> AWS_SECRET_KEY=<secret_key> terraform init
    ```

    Replace `<access_key_id>` and `<secret_key>` with valid AWS keys.

3. Build the resources and display the outputs:

    ```
    terraform apply
    ```

    You need the following information to [create a Cloud Account]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings" >}}) in the Redis Cloud console:

    - **Access Key ID**: The `accessKeyId` output.
    - **Secret Access Key**: Run the following command to extract the secret key from the `accessSecretKey` output:
        ``` shell
        echo $(terraform output -raw accessSecretKey)
        ```
    - **IAM Role Name**: The `IAMRoleName` output.

