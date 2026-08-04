---
Title: Manage database tags
alwaysopen: false
categories:
- docs
- operate
- rs
description: Manage tags for databases in a Redis Software cluster.
linkTitle: Database tags
toc: 'true'
weight: 17
---

You can create custom tags to categorize databases in a Redis Software cluster. 

The **Databases** screen shows tags for each database in the list.

{{<image filename="images/rs/screenshots/databases/view-db-list-tags.png" alt="The databases screen includes tags for each database.">}}

## Add database tags

You can add tags when you [create a database]({{<relref "/operate/rs/databases/create">}}) or [edit an existing database's configuration]({{<relref "/operate/rs/databases/configure#edit-database-settings">}}).

To add tags to a database using the Cluster Manager UI:

1. While in edit mode on the database's configuration screen, click **Add tags**.

    {{<image filename="images/rs/screenshots/databases/add-db-tags-button.png" alt="The Add tags button on the database configuration screen.">}}

1. Enter a key and value for the tag. Keys and values previously used by existing tags will appear as suggestions.

    {{<image filename="images/rs/screenshots/databases/manage-db-tags-dialog-suggestions.png" alt="The Manage tags dialog lets you add, edit, or delete tags.">}}

1. To add additional tags, click **Add tag**.

1. After you finish adding tags, click **Done** to close the tag manager.

1. Click **Create** or **Save**.

## Edit database tags

To edit a database's existing tags using the Cluster Manager UI:

1. Go to the database's **Configuration** screen, then click **Edit**.

1. Next to the existing **Tags**, click {{< image filename="/images/rs/buttons/edit-db-tags-button.png#no-click" alt="Edit tags button" width="22px" class="inline" >}}.

    {{<image filename="images/rs/screenshots/databases/edit-db-tags-button-location.png" alt="The Edit tags button on the database configuration screen.">}}

1. Edit or delete existing tags, or click **Add tag** to add new tags.

1. After you finish editing tags, click **Done** to close the tag manager.

1. Click **Save**.

## Tag validation rules

The following rules apply to tags you create or edit.

Tag keys and values are preserved exactly as you enter them. Redis Software does not change their casing.

Key rules:

- A key must not be empty or contain only whitespace.
- A key must be unique on the database. Uniqueness is exact and case-sensitive, so `env` and `Env` are different keys.
- A key must be at most 64 characters.
- A key must start with a letter or an underscore and can contain only letters, digits, and underscores.
- A key must not be a system key. See [System tags](#system-tags).

Valid key examples: `env`, `team`, `TEAM`, `_owner`, `app_1`.

Invalid key examples: `1team`, `env.prod`, `team-name`, `region:az`, `with space`, `bad/key`.

Value rules:

- A value must not be empty or contain only whitespace.
- A value must be at most 128 characters.
- A value can contain letters, digits, spaces, and the characters `. _ + - @ : /`.

Valid value examples: `prod`, `Team A`, `us-east-1`, `service/api`, `owner@example.com`, `v1.2.3`.

Count limit:

- A database can have at most 30 tags that meet these rules. [System tags](#system-tags) and unchanged [legacy tags](#backward-compatibility-for-existing-tags) do not count toward this limit.

### Backward compatibility for existing tags

The current validation rules were introduced in Redis Software version 8.2.0, when database tags became eligible to be exposed as labels in [v2 metrics]({{<relref "/operate/rs/monitoring/metrics_stream_engine/prometheus-metrics-v2">}}). In particular, tag keys must follow the [Prometheus label name rules](https://prometheus.io/docs/concepts/data_model/#metric-names-and-labels). Tags created before version 8.2.0 might not meet these rules.

Existing tags that do not meet the current validation rules can remain on a database for backward compatibility, as long as they are unchanged. A tag is considered unchanged only when both its key and its value stay exactly the same.

If you edit the key or value of such a tag, the edited tag must pass the current validation rules. Unchanged legacy tags that do not meet the rules are not eligible for metrics. To use them in metrics, replace or rename them with valid tags.

### System tags

Some tag keys, such as `redis`, `cluster`, and `db`, are reserved for internal use by Redis Software. These are called system tags:

- You cannot add or manage system tags through normal database configuration. These reserved keys are rejected.
- System tags cannot be exposed in metrics.
- When you retrieve tags, the response can include an `isSystem` marker that identifies system tags. This marker is computed by Redis Software each time tags are returned. It is not a customer-editable or persistent field, and any `isSystem` value you send when writing tags is ignored. You cannot turn a tag into a system tag by setting `isSystem`.
- Editing your own tags does not remove system tags that are already stored on the database.

## Use database tags in metrics

You can expose selected database tags as labels in [v2 metrics]({{<relref "/operate/rs/monitoring/metrics_stream_engine/prometheus-metrics-v2">}}) through a dedicated `db_tags` metric. This lets you build dashboards, alerts, filters, and ownership views that are grouped by your tags, once the relevant tag keys are enabled in the cluster's metrics configuration.

For how to enable export, choose which tag keys are exposed, query metrics with `db_tags`, and use tags in observability platforms such as Prometheus, Grafana, Datadog, New Relic, and Dynatrace, see [Database tags in metrics]({{<relref "/operate/rs/monitoring/metrics_stream_engine/db-tags-in-metrics">}}).

## Troubleshooting database tags

### Why can't I add a tag?

Check if your tags adhere to the [validation rules]({{<relref "/operate/rs/databases/configure/db-tags#tag-validation-rules">}}).

### Why can't I update the value of some of the existing tags?

Those tags are likely [legacy tags]({{<relref "/operate/rs/databases/configure/db-tags#backward-compatibility-for-existing-tags">}}) that no longer meet the current validation rules.
