---
LinkTitle: Terraform provider for Redis Cloud
Title: Terraform provider for Redis Cloud
alwaysopen: false
categories:
- docs
- integrate
- rc
description: null
group: provisioning
headerRange: '[1-3]'
linkTitle: Terraform provider for Redis Cloud
summary: The Redis Cloud Terraform provider allows you to provision and manage Redis
  Cloud resources.
toc: 'true'
type: integration
weight: 4
---

[Terraform](https://developer.hashicorp.com/terraform) is an open source automation tool developed by Hashicorp that allows you to easily provision infrastructure as code.

Redis develops and maintains a [Terraform provider for Redis Cloud](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest). The Redis Cloud Terraform provider allows many of the same actions as found in the [Redis Cloud API]({{< relref "/operate/rc/api" >}}).

{{< note >}}
The Redis Cloud Terraform provider supports Flexible subscriptions. It does not support Fixed subscriptions.
{{< /note >}}

See [Get started with Terraform]({{< relref "/integrate/terraform-provider-for-redis-cloud/get-started" >}}) for an example of how to use the Terraform provider.

## Data sources and Resources

The Terraform provider represents API actions as data sources and resources. Data sources are read-only and allow you to get information, while resources allow you to create and manage infrastructure.

The Redis Cloud Terraform provider allows for the following data sources:

- [Subscriptions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_subscription)
- [Databases](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_database)
- [Database capabilities](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_database_modules)
- [Cloud accounts](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_cloud_account)
- [Supported persistence options](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_data_persistence)
- [Payment methods](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_payment_method)
- [Supported cloud provider regions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_regions)
- [VPC peering connections](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_subscription_peerings)
- ACL [roles](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_acl_role), [rules](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_acl_rule), and [users](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_acl_user)
- [Cloud provider regions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_regions)

It also allows you to create and manage the following resources:

- [Subscriptions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_subscription)
- [Databases](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_subscription_database)
- [VPC peering connections](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_subscription_peering)
- [Cloud accounts](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_cloud_account)
- [Active-Active subscriptions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_subscription)
- [Active-Active databases](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_subscription_database)
- [Active-Active regions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_subscription_regions)
- [Active-Active VPC peering connections](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_subscription_peering)
- ACL [rules](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_acl_rule), [roles](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_acl_role), and [users](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_acl_user)


## More info

- [Get started with Terraform]({{< relref "/integrate/terraform-provider-for-redis-cloud/get-started" >}})
- [Redis Cloud Terraform Registry](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs)
- [Terraform documentation](https://developer.hashicorp.com/terraform/docs)
- [Terraform configuration syntax](https://developer.hashicorp.com/terraform/language/syntax/configuration)