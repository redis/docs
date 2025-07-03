---
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
hideListLinks: true
linktitle: View and edit cache
title: View and edit LangCache service
weight: 15
---

After you have [created your first LangCache service]({{< relref "/operate/rc/langcache/create-service" >}}), selecting **LangCache AI** from the Redis Cloud Console menu will take you to the **LangCache Services** page. 

This page displays a list of all LangCache services associated with your account.

{{<image filename="images/rc/langcache-service-list.png" alt="The LangCache service in the LangCache service list." >}}

Select your LangCache service from the list to view the service's details.

## Configuration tab

The **Configuration** tab lets you view the details of your LangCache service. It contains the following sections:

- The **Connectivity** section provides the connection details for your LangCache service.
- The **General** section provides the cache settings for your LangCache service.
- The **Actions** section lets you flush or delete your LangCache service.

### Connectivity

The **Connectivity** section provides the connection details for your LangCache service. 

{{<image filename="images/rc/langcache-view-connectivity.png" alt="The connectivity settings for the LangCache service." >}}

| Setting name          |Description|
|:----------------------|:----------|
| **API Key** | The Bearer token for your LangCache API requests. |
| **Cache ID** | The unique ID of your LangCache service. |
| **API Base URL** | The base URL for LangCache API requests. |

Select the **Copy** button next to the Cache ID and API Base URL to copy them to the clipboard. If you lost the API key value or need to rotate the key, you can [replace the service API key](#replace-service-api-key) at any time.

See [use the LangCache API]({{< relref "/operate/rc/langcache/use-langcache" >}}) for more information on how to use these values. 

#### Replace service API key

The API key is only available immediately after you create the LangCache service. If you lost this value, or need to rotate the key, you can replace the service key at any time.

To replace the service key:

1. Select **Replace key**.

    {{<image filename="images/rc/langcache-replace-key.png" alt="The Replace Key button." >}}

1. A confirmation dialog will appear. Select **Confirm** to confirm.

1. The new key will appear in a dialog box. Select **Copy** to copy the key to the clipboard.

    {{<image filename="images/rc/langcache-service-key.png" alt="The LangCache service key window. Use the Copy button to save the service key to the clipboard." >}}

    {{<warning>}}
This is the only time the value of the user key is available. Save it to a secure location before closing the dialog box. <br/><br/>

If you lose the service key value, you will need to replace the key again.
    {{</warning>}}

### General

The **General** section provides configuration details for your LangCache service.

{{<image filename="images/rc/langcache-view-general.png" alt="The general settings for the LangCache service." >}}

| Setting name          |Description|
|:----------------------|:----------|
| **Service name** | The name of the LangCache service. |
| **Database** | The database that stores your cache data. |
| **Similarity threshold** | The minimum similarity score required to consider a cached response a match. _(Editable)_ |
| **TTL** | The number of seconds to cache entries before they expire. _(Editable)_ |
| **Embedding Provider** | The embedding provider to use for your service. |

Some of these settings can be changed after cache creation. To do so, select the **Edit** button.

### Attributes

The **Attributes** section provides the custom attributes defined for your LangCache service.

{{<image filename="images/rc/langcache-view-attributes.png" alt="The custom attributes for the LangCache service." >}}

You can not edit custom attributes after cache creation.

### Actions

The **Actions** section lets you flush or delete your LangCache service.

{{<image filename="images/rc/langcache-view-actions.png" alt="The actions for the LangCache service." >}}

#### Flush cache

Flushing the cache completely erases all cached data while preserving the service configuration and the search index used by the cache.

To flush the cache:

1. Select **Flush**.

1. A confirmation dialog will appear. Select **Flush** again to confirm.

Flushing the cache is permanent and cannot be undone, and will result in cache misses until the cache is repopulated.

#### Delete service

Deleting your LangCache service permanently deletes all associated cached data, the service configuration, and the LangCache search index. It also immediately terminates all API keys associated with the service. Data stored in other indexes within the same database will remain unaffected.

To delete your LangCache service:

1. Select **Delete**.

1. A confirmation dialog will appear. Select the checkbox to confirm that you want to delete the service.

1. Select **Delete** again to confirm.

Deleting the LangCache service is permanent and cannot be undone.

## Metrics tab

The **Metrics** tab provides a series of graphs showing performance data for your LangCache service. See [Monitor a LangCache service]({{< relref "/operate/rc/langcache/monitor-cache" >}}) for more information.