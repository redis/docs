## Conflict resolution rules

With Active-Active databases, it's possible for two different instances to try to run write operations on the same data at the same time. If this happens, conflicts can arise when the replicas attempt to sync these changes with each other. Conflict resolution rules determine how the database handles conflicting operations.

There are two types of conflict resolution:

1. Merge:

    - The operations are associative.

    - Merges the results of both operations.

1. Win over:

    - The operations are not associative.

    - One operation wins the conflict and sets the value.

    - Ignores the losing operation.

The following conflict resolution rules show how Active-Active databases resolve conflicts for various JSON commands.

### Assign different types to a key

**Conflict**

Two instances concurrently assign values of different types to the same key within a JSON document.

For example:

Instance 1 assigns an object to a key within a JSON document.

Instance 2 assigns an array to the same key.

**Resolution type**

Win over

**Resolution rule**

The instance with the smaller ID wins, so the key becomes an object in the given example.

**Example**

| Time  | Description | Instance 1 | Instance 2 |
| :---: | :--- | :--- | :--- |
| t1 | Set the same key to an object or an array | JSON.SET doc $.a '{}' | JSON.SET doc $.a '[]' |
| t2 | Add data to the object and array | <nobr>JSON.SET doc  $.a.x '“y”'</nobr> <br /><br /> Result: <br /> {"a": {"x": "y"}} | <nobr>JSON.SET doc $.a '["z"]'</nobr> <br /><br /> Result: <br /> {“a”: ["z"]} |
| t3 | Active-Active synchronization | – Sync – | – Sync – |
| t4 | Instance 1 wins | JSON.GET doc $ <br /><br /> Result: <br /> {"a": {"x": "y"}} | JSON.GET doc $ <br /><br /> Result: <br /> {"a": {"x": "y"}} |

### Create versus create

**Conflict**

Two instances concurrently use `JSON.SET` to assign a new JSON document to the same key.

**Resolution type**

Win over

**Resolution rule**

The instance with the smaller ID wins.

**Example**

| Time  | Description | Instance 1 | Instance 2 |
| :---: | :--- | :--- | :--- |
| t1 | Create a new JSON document | <nobr>JSON.SET doc $ '{"field": "a"}'</nobr> | <nobr>JSON.SET doc $ '{"field": "b"}'</nobr> |
| t2 | Active-Active synchronization | – Sync – | – Sync – |
| t3 | Instance 1 wins | JSON.GET doc $ <br /><br /> Result: <br /> {"field": "a"} | JSON.GET doc $ <br /><br /> Result: <br /> {"field": "a"} |

### Create versus update

**Conflict**

Instance 1 creates a new document and assigns it to an existing key with `JSON.SET`.

Instance 2 updates the existing content of the same key with `JSON.SET`.

**Resolution type**

Win over

**Resolution rule**

The operation that creates a new document wins.

**Example**

| Time  | Description | Instance 1 | Instance 2 |
| :---: | :--- | :--- | :--- |
| t1 | The document exists on both instances | JSON.GET doc $ <br /><br /> Result: <br />  {"field1": "value1"} | JSON.GET doc $ <br /><br /> Result: <br />  {"field1": "value1"} |
| t2 | Instance 1 creates a new document; instance 2 updates the existing document | <nobr>JSON.SET doc $ '{"field2": "value2"}'</nobr> | <nobr>JSON.SET doc $.field1 '[1, 2, 3]'</nobr> |
| t3 | Active-Active synchronization | – Sync – | – Sync – |
| t4 | Instance 1 wins | JSON.GET doc . <br /><br /> Result: <br /> {"field2": "value2"} | JSON.GET doc . <br /><br /> Result: <br /> {"field2": "value2"} |

### Delete versus create

**Conflict**

Instance 1 deletes a JSON document with `JSON.DEL`.

Instance 2 uses `JSON.SET` to create a new JSON document and assign it to the key deleted by instance 1.

**Resolution type**

Win over

**Resolution rule**

Document creation wins over deletion.

**Example**

| Time  | Description | Instance 1 | Instance 2 |
| :---: | :--- | :--- | :--- |
| t1 | The document exists on both instances | JSON.GET doc $ <br /><br /> Result: <br /> {"field1": "value1"} | JSON.GET doc $ <br /><br /> Result: <br /> {"field1": "value1"} |
| t2 | Instance 1 deletes the document; instance 2 creates a new document | JSON.DEL doc | <nobr>JSON.SET doc $ '{"field1": "value2"}'</nobr> |
| t3 | Active-Active synchronization | – Sync – | – Sync – |
| t4 | Instance 2 wins | JSON.GET doc $ <br /><br /> Result: <br /> <nobr>{"field1": "value2"}</nobr> | JSON.GET doc $ <br /><br /> Result: <br /> {"field1": "value2"} |

### Delete versus update

**Conflict**

Instance 1 deletes a JSON document with `JSON.DEL`.

Instance 2 updates the content of the same document with `JSON.SET`.

**Resolution type**

Win over

**Resolution rule**

Document deletion wins over updates.

**Example**

| Time  | Description | Instance 1 | Instance 2 |
| :---: | :--- | :--- | :--- |
| t1 | The document exists on both instances | JSON.GET doc $ <br /><br /> Result: <br /> <nobr>{"field1": "value1"}</nobr> | JSON.GET doc $ <br /><br /> Result: <br /> {"field1": "value1"} |
| t2 | Instance 1 deletes the document; instance 2 updates it | JSON.DEL doc | <nobr>JSON.SET doc $.field1 '[1, 2, 3]'</nobr> |
| t3 | Active-Active synchronization | – Sync – | – Sync – |
| t4 | Instance 1 wins | JSON.GET doc $ <br /><br /> Result: <br /> (nil) | JSON.GET doc $ <br /><br /> Result: <br /> (nil) |

### Update versus update

**Conflict**

Instance 1 updates a field inside a JSON document with `JSON.SET`.

Instance 2 updates the same field with a different value.

**Resolution type**

Win over

**Resolution rule**

The instance with the smallest ID wins.

**Example**

| Time  | Description | Instance 1 | Instance 2 |
| :---: | :--- | :--- | :--- |
| t1 | The document exists on both instances | JSON.GET doc $ <br /><br /> Result: <br /> {"field": "a"} | JSON.GET doc $ <br /><br /> Result: <br /> {"field": "a"} |
| t2 | Update the same field with different data | <nobr>JSON.SET doc $.field "b"</nobr> | <nobr>JSON.SET doc $.field "c"</nobr> |
| t3 | Active-Active synchronization | – Sync – | – Sync – |
| t4 | Instance 1 wins | JSON.GET doc $ <br /><br /> Result: <br /> {"field": "b"} | JSON.GET doc $ <br /><br /> Result: <br /> {"field": "b"} |

### Update versus clear

The version of RedisJSON prior to v2.2 has two different ways to reset the content of a JSON object:

- Assign a new empty JSON object:
    
    ```sh
    JSON.SET doc $.colors '{}'
    ```

    If you use this method, it cannot be merged with a concurrent update.

- For each key, remove it with `JSON.DEL`:

    ```sh
    JSON.DEL doc $.colors.blue
    ```

    With this method, it can merge the reset with concurrent updates.

As of RedisJSON v2.2, you can use the `JSON.CLEAR` command to reset the JSON document without removing each key manually. This method also lets concurrent updates be merged.

#### Assign an empty object

**Conflict**

Instance 1 adds "red" to the existing "colors" object with `JSON.SET`.

Instance 2 assigns a new empty object for "colors".

**Resolution type**

Win over

**Resolution rule**

Document creation wins over the update, so the result will be an empty object.

**Example**

| Time  | Description | Instance 1 | Instance 2 |
| :---: | :--- | :--- | :--- |
| t1 | The document exists on both instances | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {"blue": "#0000ff"}} | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {"blue": "#0000ff"}} |
| t2 | Instance 1 adds a new color; instance 2 resets colors to an empty object | <nobr>JSON.SET doc $.colors.red ‘#ff0000’</nobr> | JSON.SET doc $.colors ‘{}’ |
| t3 | Instance 2 adds a new color |  | <nobr>JSON.SET doc $.colors.green ‘#00ff00’</nobr> |
| t4 |  | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {"blue": "#0000ff", "red": "#ff0000"}} | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {"green": "#00ff00"}} |
| t5 | Active-Active synchronization | – Sync – | – Sync – |
| t6 | Instance 2 wins | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {"green": "#00ff00"}} | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {"green": "#00ff00"}} |

#### Use `JSON.CLEAR`

**Conflict**

Instance 1 adds "red" to the existing "colors" object with `JSON.SET`.

Instance 2 clears the "colors" object with `JSON.CLEAR` and adds "green" to "colors".

**Resolution type**

Merge

**Resolution rule**

Merges the results of all operations.

**Example**

| Time  | Description | Instance 1 | Instance 2 |
| :---: | :--- | :--- | :--- |
| t1 | The document exists on both instances | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {"blue": "#0000ff"}} | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {"blue": "#0000ff"}} |
| t2 | Instance 1 adds a new color; instance 2 resets the colors | <nobr>JSON.SET doc $.colors.red ‘#ff0000’</nobr> | JSON.CLEAR doc $.colors |
| t3 |  | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {"blue": "#0000ff", "red": "#ff0000"}} | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {}} |
| t4 | Instance 2 adds a new color |  | <nobr>JSON.SET doc $.colors.green ‘#00ff00’</nobr> |
| t5 |  |  | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {"green": "#00ff00"}} |
| t6 | Active-Active synchronization | – Sync – | – Sync – |
| t7 | Merges the results of both instances | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {"red": "#ff0000", "green": "#00ff00"}} | JSON.GET doc $ <br /><br /> Result: <br /> {"colors": {"red": "#ff0000", "green": "#00ff00"}} |

### Update versus update array

**Conflict**

Two instances update the same existing array with different content.

**Resolution type**

Merge

**Resolution rule**

Merges the results of all operations on the array. Preserves the original element order from each instance.

**Example**

| Time  | Description | Instance 1 | Instance 2 |
| :---: | :--- | :--- | :--- |
| t1 | The document exists on both instances | JSON.GET doc $ <br /><br /> Result: <br /> '["a", "b", "c"]' | JSON.GET doc $ <br /><br /> Result: <br /> '["a", "b", "c"]' |
| t2 | Instance 1 removes an array element; instance 2 adds one | JSON.ARRPOP doc $ 1 <br /><br /> Result: <br /> ["a", "c"] | <nobr>JSON.ARRINSERT doc $ 0 ‘“y”’</nobr> <br /><br /> Result: <br /> ["y", "a", "b", "c"] |
| t3 | Both instances add another element to the array | <nobr>JSON.ARRINSERT doc $ 1 ‘“x”’</nobr> <br /><br /> Result: <br /> ["a", "x", "c"] | <nobr>JSON.ARRINSERT doc $ 2 ‘“z”’</nobr> <br /><br /> Result: <br /> ["y", "a", "z", "b", "c"] |
| t4 | Active-Active synchronization | – Sync – | – Sync – |
| t5 | Merge results from both instances | JSON.GET doc $ <br /><br /> Result: <br /> ["y", "a", "x", "z", "c"] | JSON.GET doc $ <br /><br /> Result: <br /> ["y", "a", "x", "z", "c"] |

### Update versus delete array element

**Conflict**

Instance 1 removes an element from a JSON array with `JSON.ARRPOP`.

Instance 2 updates the same element that instance 1 removes.

**Resolution type**

Win over

**Resolution rule**

Deletion wins over updates.

**Example**

| Time  | Description | Instance 1 | Instance 2 |
| :---: | :--- | :--- | :--- |
| t1 | The document exists on both instances | JSON.GET doc $ <br /><br /> Result: <br /> {“todo”: [{“title”: “buy milk”, “done”: false}]} | JSON.GET doc $ <br /><br /> Result: <br /> {“todo”: [{“title”: “buy milk”, “done”: false}]} |
| t2 | Instance 1 removes an array element; instance 2 updates the same element | <nobr>JSON.ARRPOP doc $.todo 0</nobr> | <nobr>JSON.SET doc '$.todo[0]["done"]' 'true'’</nobr> |
| t3 |  | JSON.GET doc $ <br /><br /> Result: <br /> {“todo”: []} | JSON.GET doc $ <br /><br /> Result: <br /> [{“title”: “buy milk”, “done”: true}]} |
| t4 | Active-Active synchronization | – Sync – | – Sync – |
| t5 | Instance 1 wins | JSON.GET doc $ <br /><br /> Result: <br /> doc = {“todo”: []} | JSON.GET doc $ <br /><br /> Result: <br /> doc = {“todo”: []} |

### Update versus update object

**Conflict**

Both instances update the same existing object with different content.

**Resolution type**

Merge

**Resolution rule**

Merges the results of all operations on the object.

**Example**

| Time  | Description | Instance 1 | Instance 2 |
| :---: | :--- | :--- | :--- |
| t1 | The document exists on both instances | JSON.GET doc $ <br /><br /> Result: <br /> '{"grocery": []}' | JSON.GET doc $ <br /><br /> Result: <br /> '{"grocery": []}' |
| t2 | Add new elements to the array | <nobr>JSON.ARRAPPEND doc $.grocery ‘“eggs”’</nobr> | JSON.ARRAPPEND doc $.grocery ‘“milk”’ |
| t3 | Add new elements to the array | JSON.ARRAPPEND doc $.grocery ‘“ham”’ | <nobr>JSON.ARRAPPEND doc $.grocery ‘“flour”’</nobr> |
| t4 |  | JSON.GET doc $ <br /><br /> Result: <br /> {"grocery":["eggs", "ham"]} | JSON.GET doc $ <br /><br /> Result: <br /> {"grocery":["milk", "flour"]} |
| t5 | Active-Active synchronization | – Sync – | – Sync – |
| t6 | Merges the results from both instances | JSON.GET doc . <br /><br /> Result: <br /> {"grocery":["eggs","ham","milk", "flour"]} | JSON.GET doc . <br /><br /> Result: <br /> {"grocery":["eggs","ham","milk", "flour" ]} |
