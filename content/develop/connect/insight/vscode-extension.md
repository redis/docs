---
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
linkTitle: Redis for VS Code
stack: true
title: Redis for VS Code
weight: 5
---

Redis for VS Code is an extension that allows you to connect to your Redis databases from within Microsoft Visual Studio Code.
After connecting to a database, you can view, add, modify, and delete keys, and interact with your Redis databases using a built-in CLI interface.
The following data types are supported:

- Hash
- List
- Set
- Sorted Set
- String
- JSON

## Install the Redis for VS Code extension

Open VS Code and click on the **Extensions** menu button. In the **Search Extensions in Marketplace** field, type "**[DWD] ADD OFFICAL NAME [DWD]**" and press the `enter` or `return` key. There may be more than one option shown, so be sure to click on the option published by Redis.

**[DWD] flesh out with more instructions once the extension is available in the marketplace. [DWD]**

After installing the extension, your VS Code menu will look similar to the following.

<img src="../images/ri-vscode-menu.png">

The Redis for VS Code extension will automatically update just like any other VS Code extension.

## Connect to Redis databases

Click on the Redis mark (the cursive **R**) in the VS Code menu to begin connecting a Redis database to VS Code.

<img src="../images/ri-vscode-initial.png">

Click on the **+ Connect database** button. A dialog will display in the main pane. In the image shown below, all the options have been checked to show the available details for each connection. These connection details are similar to those accessible from the Redis CLI (`redis-cli`).

{{< note >}}
When you select a logical database, you won't be able to change it later; there's no mechanism to do so. If you need to connect to a different logical database, you need to add a separate database connection.
{{< /note >}}

<img src="../images/ri-vscode-add-menu.png">

After filling out the necessary fields, click on the **Add Redis database** button. The left side pane, where you would normally see folders and files in normal operation, shows your database connections.

### Connection tools

There are several connection-related tools that are displayed for each opened connection.

<img src="../images/ri-vscode-cnx-tools.png">

Left to right, they are:

- Refresh connection, which retrieves fresh data from the connected Redis database.
- Edit connection. A dialog similar to the one shown in the previous section is displayed.
- Delete connection.
- Open CLI. [More on this later](#cli).
- Sort keys, either ascending or descending.
- Filter keys by key name or pattern, and by key type.
- Add new key by type: Hash, List, Set, Sorted Set, String, or JSON.



<img src="../images/ri-vscode-cnx-view.png" >

## Key view

Here's what you'll see when there are no keys in your database (the image on the left) and when keys are present (the image on the right).

| View with no keys | View with JSON keys |
|:---               |:---                     |
| <img src="../images/ri-vscode-no-keys.png"> | <img src="../images/ri-vscode-w-keys.png" > |

Redis for VS Code will automatically group the keys based on the one available setting **Delimiter to separate namespaces**, which you can view by clicking on the gear icon in the top-right of the left side pane. Click on the current value to change it. The default setting is the colon (`:`) character.

<img src="../images/ri-vscode-settings.png">

Click on a key to display its contents.

<img src="../images/ri-vscode-key-view.png">

### Key editing tools

There are several editing tools that you can use to edit key data. Each data type will have their own editing capabilities. JSON data is shown in the following examples.

Changes to keys are immediately written to the server.

- **Rename**. Hover over the key name to change it.

<img src="../images/ri-vscode-edit-name.png">

- **Set time-to-live (TTL)**. Click on the **TTL** field to set the duration in seconds.

<img src="../images/ri-vscode-edit-ttl.png">

- **Delete**. Click on the trash can icons to delete the entire key (highlighted in red) or portions of a key (highlighted in yellow).

<img src="../images/ri-vscode-edit-del.png">

- **Add to key**. Click on the `+` button next to the closing bracket (shown highlighted in green above) add a new component to a key. 

<img src="../images/ri-vscode-edit-add.png">

- **Refresh**. Click on the refresh icon (the circular arrow) to retrieve fresh data from the server. In the examples below, refresh was clicked and the key now has a new field called "test" that was added by another Redis client.

| Before refresh | After refresh |
|:---               |:---                     |
| <img src="../images/ri-vscode-recycle-before.png"> | <img src="../images/ri-vscode-recycle-after.png" > |

## The CLI tool {#cli}

The connection tool with the boxed `>_` icon opens a Redis CLI window in the **REDIS CLI** tab at the bottom of the primary pane.

<img src="../images/ri-vscode-cli.png">

The CLI interface works just like the `redis-cli` command.
