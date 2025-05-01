---
aliases: /develop/connect/redis-for-vscode
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Connect to Redis from Visual Studio Code.
hideListLinks: true
linkTitle: Redis for VS Code
stack: true
title: Redis for VS Code
weight: 5
---

Redis for VS Code is an extension that allows you to connect to your Redis databases from within Microsoft Visual Studio Code.
After connecting to a database, you can view, add, modify, and delete keys, and interact with your Redis databases using a Redis Insight like UI and also a built-in CLI interface.
The following data types are supported:

- [Hash]({{< relref "/develop/data-types/hashes" >}})
- [List]({{< relref "/develop/data-types/lists" >}})
- [Set]({{< relref "/develop/data-types/sets" >}})
- [Sorted Set]({{< relref "/develop/data-types/sorted-sets" >}})
- [String]({{< relref "/develop/data-types/strings" >}})
- [JSON]({{< relref "/develop/data-types/json" >}})

## Install the Redis for VS Code extension

Open VS Code and click on the **Extensions** menu button. In the **Search Extensions in Marketplace** field, type "Redis for VS Code" and press the `enter` or `return` key. There may be more than one option shown, so be sure to click on the extension published by Redis. The correct extension is shown below. Click on the **Install** to install the extension.

{{< image filename="images/dev/connect/vscode/vscode-install1.png" >}}

Once installed, check the **Auto Update** button to allow VS Code to install future revisions of the extension automatically.

{{< image filename="images/dev/connect/vscode/vscode-install2.png" >}}

After installing the extension, your VS Code menu will look similar to the following.

{{< image filename="images/dev/connect/vscode/vscode-menu.png" >}}

## Connect to Redis databases {#connect-db}

Click on the Redis mark (the cursive **R**) in the VS Code menu to begin connecting a Redis database to VS Code. If you do not currently have access to a Redis database, consider giving Redis Cloud a try. [It's free](https://redis.io/try-free/).

{{< image filename="images/dev/connect/vscode/vscode-initial.png" >}}

Click on the **+ Connect database** button. A dialog will display in the main pane. In the image shown below, all the options have been checked to show the available details for each connection. These connection details are similar to those accessible from [`redis-cli`]({{< relref "/develop/tools/cli" >}}).

{{< note >}}
In the first release of Redis for VS Code, there is no way to change the logical database after you have selected it. If you need to connect to a different logical database, you need to add a separate database connection.
{{< /note >}}

{{< image filename="images/dev/connect/vscode/vscode-add-menu.png" >}}

After filling out the necessary fields, click on the **Add Redis database** button. The pane on the left side, where you would normally see the Explorer view, shows your database connections.

{{< image filename="images/dev/connect/vscode/vscode-cnx-view.png" >}}

{{< note >}}
Local databases, excluding OSS cluster databases, with default usernames and no passwords will automatically be added to your list of database connections.
{{< /note >}}

### Connection tools

Several tools are displayed for each open connection.

{{< image filename="images/dev/connect/vscode/vscode-cnx-tools.png" >}}

Left to right, they are:

- Refresh connection, which retrieves fresh data from the connected Redis database.
- Edit connection, which shows a dialog similar to the one described in [Connect to Redis Databases](#connect-db) above.
- Delete connection.
- Open CLI. See [CLI tool](#cli) below for more information.
- Sort keys, either ascending or descending.
- Filter keys by key name or pattern, and by key type.
- Add a new key by type: Hash, List, Set, Sorted Set, String, or JSON.

## Key view

Here's what you'll see when there are no keys in your database (the image on the left) and when keys are present (the image on the right).

{{< image filename="images/dev/connect/vscode/vscode-key-view-w-wo-keys.png" >}}

Redis for VS Code will automatically group the keys based on the one available setting, **Delimiter to separate namespaces**, which you can view by clicking on the gear icon in the top-right of the left side pane. Click on the current value to change it. The default setting is the colon (`:`) character.

{{< image filename="images/dev/connect/vscode/vscode-settings.png" >}}

Click on a key to display its contents.

{{< image filename="images/dev/connect/vscode/vscode-key-view.png" >}}

### Key editing tools

There are several editing tools that you can use to edit key data. Each data type has its own editing capabilities. The following examples show edits to JSON data. Note that changes to keys are immediately written to the server.

- **Rename**. Click on the key name field to change the name.

{{< image filename="images/dev/connect/vscode/vscode-edit-name.png" >}}

- **Set time-to-live (TTL)**. Click on the **TTL** field to set the duration in seconds.

{{< image filename="images/dev/connect/vscode/vscode-edit-ttl.png" >}}

- **Delete**. Click on the trash can icons to delete the entire key (highlighted in red) or portions of a key (highlighted in yellow).

{{< image filename="images/dev/connect/vscode/vscode-edit-del.png" >}}

- **Add to key**. Click on the `+` button next to the closing bracket (shown highlighted in green above) to add a new component to a key. 

{{< image filename="images/dev/connect/vscode/vscode-edit-add.png" >}}

- **Refresh**. Click on the refresh icon (the circular arrow) to retrieve fresh data from the server. In the examples below, refresh was clicked (the image on the left) and the key now has a new field called "test" that was added by another Redis client (the image on the right).

{{< image filename="images/dev/connect/vscode/vscode-recycle-before-after.png" >}}

For strings, hashes, lists, sets, and sorted sets, the extension supports numerous value formatters (highlighted in red in the image below). They are:

- Unicode
- ASCII
- Binary (blob)
- HEX
- JSON
- Msgpack
- Pickle
- Protobuf
- PHP serialized
- Java serialized
- 32-bit vector
- 64-bit vector

{{< image filename="images/dev/connect/vscode/vscode-edit-value-formatters.png" >}}

Also for Hash keys, you can set per-field TTLs (highlighted in yellow in the image above), a new feature added to Redis Open Source 7.4.

## CLI tool {#cli}

The connection tool with the boxed `>_` icon opens a Redis CLI window in the **REDIS CLI** tab at the bottom of the primary pane.

{{< image filename="images/dev/connect/vscode/vscode-cli.png" >}}

The CLI interface works just like the [`redis-cli`]({{< relref "/develop/tools/cli" >}}) command.
