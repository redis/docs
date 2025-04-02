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
summary: The Redis Cloud Terraform provider allows you to provision and manage Redis
  Cloud resources.
toc: 'true'
type: integration
weight: 4
hideListLinks: true
---

[Terraform](https://developer.hashicorp.com/terraform) is an open source automation tool developed by Hashicorp that allows you to easily provision infrastructure as code.

Redis develops and maintains a [Terraform provider for Redis Cloud](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest). The Redis Cloud Terraform provider allows many of the same actions as found in the [Redis Cloud API]({{< relref "/operate/rc/api" >}}).

See [Get started with Terraform]({{< relref "/integrate/terraform-provider-for-redis-cloud/get-started" >}}) for an example of how to use the Terraform provider.

## Data sources and Resources

The Terraform provider represents API actions as data sources and resources. Data sources are read-only and allow you to get information, while resources allow you to create and manage infrastructure.

The Redis Cloud Terraform provider allows for the following data sources:

- Redis Cloud Pro:
  - [Subscriptions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_subscription)
  - [Databases](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_database)
  - [Database capabilities](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_database_modules)
  - [VPC peering connections](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_subscription_peerings)
  - [Cloud accounts](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_cloud_account)
  - [Supported persistence options](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_data_persistence)
  - [AWS Transit Gateways](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_transit_gateway)
  - Google Cloud Private Service Connect [Services](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_private_service_connect) and [Endpoints](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_private_service_connect_endpoints)
- Redis Cloud Essentials:
  - [Plans](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_essentials_plan)
  - [Subscriptions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_essentials_subscription)
  - [Databases](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_essentials_database)
- Active-Active:
  - [Subscriptions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_subscription)
  - [Databases](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_subscription_database)
  - [AWS Transit Gateways](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_active_active_transit_gateway)
  - Google Cloud Private Service Connect [services](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_active_active_private_service_connect) and [endpoints](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_active_active_private_service_connect_endpoints)
- [Payment methods](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_payment_method)
- [Supported cloud provider regions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_regions)
- ACL [roles](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_acl_role), [rules](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_acl_rule), and [users](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/data-sources/rediscloud_acl_user)

It also allows you to create and manage the following resources:

- Redis Cloud Pro:
  - [Subscriptions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_subscription)
  - [Databases](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_subscription_database)
    - **NOTE**: Upgrade your Terraform provider to version 1.8.1 to create databases with Search and Query.
  - [VPC peering connections](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_subscription_peering)
  - [Cloud accounts](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_cloud_account)
  - [AWS Transit Gateway attachments](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_transit_gateway_attachment)
  - Google Cloud Private Service Connect [connections](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_private_service_connect), [endpoints](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_private_service_connect_endpoint) and [endpoint acceptors](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_private_service_connect_endpoint_accepter)
- Redis Cloud Essentials:
  - [Subscriptions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_essentials_subscription)
  - [Databases](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_essentials_database)
- Active-Active:
  - [Subscriptions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_subscription)
  - [Databases](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_subscription_database)
  - [Regions](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_subscription_regions)
  - [VPC peering connections](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_subscription_peering)
  - [AWS Transit Gateway attachments](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_transit_gateway_attachment)
  - Google Cloud Private Service Connect [connections](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_private_service_connect), [endpoints](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_private_service_connect_endpoint) and [endpoint acceptors](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_active_active_private_service_connect_endpoint_accepter)
- ACL [rules](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_acl_rule), [roles](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_acl_role), and [users](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs/resources/rediscloud_acl_user)


## More info

- [Get started with Terraform]({{< relref "/integrate/terraform-provider-for-redis-cloud/get-started" >}})
- [Redis Cloud Terraform Registry](https://registry.terraform.io/providers/RedisLabs/rediscloud/latest/docs)
- [Terraform documentation](https://developer.hashicorp.com/terraform/docs)
- [Terraform configuration syntax](https://developer.hashicorp.com/terraform/language/syntax/configuration)