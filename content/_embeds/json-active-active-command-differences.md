## Command differences

Some JSON commands work differently for Active-Active databases.

### `JSON.CLEAR`

[`JSON.CLEAR`]({{< relref "commands/json.clear" >}}) resets JSON arrays and objects. It supports concurrent updates to JSON documents from different instances in an Active-Active database and allows the results to be merged.
