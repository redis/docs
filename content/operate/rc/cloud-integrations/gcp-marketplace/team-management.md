---
LinkTitle: Team management
Title: Google Cloud Marketplace team management
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to add users in a legacy version of the Google Cloud Marketplace
  subscription.
weight: $weight
---

{{<banner-article bannerColor="#fff8dc">}}
This article applies to an earlier Google Cloud marketplace listing. For the current [Redis Cloud - Pay as You Go](https://console.cloud.google.com/marketplace/product/redis-marketplace-isaas/redis-enterprise-cloud-flexible-plan) listing, manage your team through the [Access Management]({{< relref "/operate/rc/security/console-access-control/access-management" >}}) screen. See [Sign up for Redis Cloud with Google Cloud Marketplace]({{< relref "/operate/rc/cloud-integrations/gcp-marketplace/" >}}) for more information.
{{</banner-article>}}

If you subscribed to Redis Cloud through Google Cloud Marketplace using the **Redis Cloud** listing, use the IAM section of the Google Cloud console to manage your team.

To grant Redis Cloud access to a Google Cloud user, select **Add** to add a member, insert the email address, and then assign the following roles to the user:
- To designate a viewer, assign `editor`, `serviceusage.serviceUsageViewer`, and `redisenterprisecloud.viewer`
- To designate an owner, assign `editor`, `serviceusage.serviceUsageViewer`, and `redisenterprisecloud.admin`


If these roles are not available, you can add them to your project.

1. Select **Manage Roles**.
2. Use the filter table field to locate the role. (Search for “service usage viewer” or “Redis Cloud admin”.)
3. Select the role.
4. Select **Create role from selection** and then select **Create**.
5. Use IAM to add a member and assign the desired role.

Users must sign in to Redis Cloud using their single sign-on credentials before they appear in the team member list.
