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
The following link uses [AWS CloudFormation](https://aws.amazon.com/cloudformation/) to create a stack using the AWS console:

<a href="https://console.aws.amazon.com/cloudformation/home?#/stacks/new?stackName=RedisCloud&templateURL=https://s3.amazonaws.com/iam-resource-automation-do-not-delete/RedisCloud.yaml">
<img alt="Launch RedisCloud template" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"/>
</a>

You can then use the `Outputs` tab to find the data needed to complete the creation of a Cloud Account. For the `accessSecretKey` (i.e. user's access key) and `consolePassword` (user's console password) you'll have to follow the links to the AWS Secrets Manager service, and use that to find the secret values. These values, being secrets, aren't displayed directly by CloudFormation.

You can use the AWS command-line interface (CLI) if you prefer:

``` shell
export AWS_PROFILE=YOUR_PROFILE_HERE
aws cloudformation create-stack --stack-name RedisCloud --template-url \
https://s3.amazonaws.com/iam-resource-automation-do-not-delete/RedisCloud.yaml \
--capabilities CAPABILITY_AUTO_EXPAND CAPABILITY_NAMED_IAM CAPABILITY_IAM
```

Update the values of `AWS_PROFILE` with your profile credentials. 

Additional options are described in the [AWS CLI docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html). 

You can track the status of the cloud formation with the following command:

``` console
aws cloudformation describe-stacks --stack-name RedisCloud
```
The data needed to complete the creation of a Cloud Account is shown as `Output Key` and `Output Value` pairs.

For the two secrets (`accessSecretKey` and `consolePassword`) you'll need to use the AWS secretmanager CLI - the value you'll need has a key of `SecretString`:

``` console
aws secretsmanager get-secret-value --secret-id=/redislabsuser/secret_access_key
```

We recommend using yaml output for the `consolePassword`, as it makes decoding the required value easier.

``` console
aws secretsmanager get-secret-value --secret-id=/redislabsuser/password --output yaml
```

The `consolePassword` is a JSON object containing a single member whose key is `password` and whose value is the password. This can be a bit complex to parse out. Here's an example output:

```
user@example-computer ~ % aws secretsmanager get-secret-value 
                              --secret-id=/redislabsuser/password 
                              --output yaml
ARN: arn:aws:secretsmanager:middle-earth-1:913769183952:secret:/redislabsuser/password-qaEMYs
CreatedDate: '2021-06-16T06:27:53.402000-06:00'
Name: /redislabsuser/password
SecretString: '{"password":"S3cr3tP@$$w0rd"}'
VersionId: 00000000-0000-0000-0000-000000000000
VersionStages:
- AWSCURRENT
```

The JSON object is the value (less the single quotes) of the `SecretString` key. i.e. it is <nobr>`{"password":"S3cr3tP@$$w0rd"}`</nobr>.

The password is the value associated with that key (less the double quotes): `S3cr3tP@$$w0rd`.

{{< warning >}}
We use the provided credentials to configure your AWS environment and provision required resources.

You **must not** change the configurations of provisioned resources or stop or terminate provisioned instances. If you do, your databases will be inaccessible and Redis will not be able to ensure database stability. See [Avoid service disruption]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/cloud-account-settings#avoid-service-disruption" >}}) for more details.
{{< /warning >}}
