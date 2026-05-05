---
linkTitle: LLM message history
title: LLM Message History
url: '/develop/ai/redisvl/0.13.0/api/message_history/'
---


## SemanticMessageHistory

<a id="semantic-message-history-api"></a>

## MessageHistory

<a id="message-history-api"></a>

### `class MessageHistory(name, session_tag=None, prefix=None, redis_client=None, redis_url='redis://localhost:6379', connection_kwargs={}, **kwargs)`

Bases: `BaseMessageHistory`

Initialize message history

Message History stores the current and previous user text prompts and
LLM responses to allow for enriching future prompts with session
context. Message history is stored in individual user or LLM prompts and
responses.

* **Parameters:**
  * **name** (*str*) – The name of the message history index.
  * **session_tag** (*Optional* *[* *str* *]*) – Tag to be added to entries to link to a specific
    conversation session. Defaults to instance ULID.
  * **prefix** (*Optional* *[* *str* *]*) – Prefix for the keys for this conversation data.
    Defaults to None and will be replaced with the index name.
  * **redis_client** (*Optional* *[* *Redis* *]*) – A Redis client instance. Defaults to
    None.
  * **redis_url** (*str* *,* *optional*) – The redis url. Defaults to redis://localhost:6379.
  * **connection_kwargs** (*Dict* *[* *str* *,* *Any* *]*) – The connection arguments
    for the redis client. Defaults to empty {}.

#### `add_message(message, session_tag=None)`

Insert a single prompt or response into the message history.
A timestamp is associated with it so that it can be later sorted
in sequential ordering after retrieval.

* **Parameters:**
  * **message** (*Dict* *[* *str* *,**str* *]*) – The user prompt or LLM response.
  * **session_tag** (*Optional* *[* *str* *]*) – Tag to be added to entries to link to a specific
    conversation session. Defaults to instance ULID.
* **Return type:**
  None

#### `add_messages(messages, session_tag=None)`

Insert a list of prompts and responses into the message history.
A timestamp is associated with each so that they can be later sorted
in sequential ordering after retrieval.

* **Parameters:**
  * **messages** (*List* *[* *Dict* *[* *str* *,* *str* *]* *]*) – The list of user prompts and LLM responses.
  * **session_tag** (*Optional* *[* *str* *]*) – Tag to be added to entries to link to a specific
    conversation session. Defaults to instance ULID.
* **Return type:**
  None

#### `clear()`

Clears the conversation message history.

* **Return type:**
  None

#### `delete()`

Clear all conversation keys and remove the search index.

* **Return type:**
  None

#### `drop(id=None)`

Remove a specific exchange from the conversation history.

* **Parameters:**
  **id** (*Optional* *[* *str* *]*) – The id of the message entry to delete.
  If None then the last entry is deleted.
* **Return type:**
  None

#### `get_recent(top_k=5, as_text=False, raw=False, session_tag=None, role=None)`

Retrieve the recent message history in sequential order.

* **Parameters:**
  * **top_k** (*int*) – The number of previous messages to return. Default is 5.
  * **as_text** (*bool*) – Whether to return the conversation as a single string,
    or list of alternating prompts and responses.
  * **raw** (*bool*) – Whether to return the full Redis hash entry or just the
    prompt and response.
  * **session_tag** (*Optional* *[* *str* *]*) – Tag of the entries linked to a specific
    conversation session. Defaults to instance ULID.
  * **role** (*Optional* *[* *Union* *[* *str* *,* *List* *[* *str* *]* *]* *]*) – Filter messages by role(s).
    Can be a single role string ("system", "user", "llm", "tool") or
    a list of roles. If None, all roles are returned.
* **Returns:**
  A single string transcription of the messages
  : or list of strings if as_text is false.
* **Return type:**
  Union[str, List[str]]
* **Raises:**
  **ValueError** – if top_k is not an integer greater than or equal to 0,
      or if role contains invalid values.

#### `store(prompt, response, session_tag=None)`

Insert a prompt:response pair into the message history. A timestamp
is associated with each exchange so that they can be later sorted
in sequential ordering after retrieval.

* **Parameters:**
  * **prompt** (*str*) – The user prompt to the LLM.
  * **response** (*str*) – The corresponding LLM response.
  * **session_tag** (*Optional* *[* *str* *]*) – Tag to be added to entries to link to a specific
    conversation session. Defaults to instance ULID.
* **Return type:**
  None

#### `property messages: List[str] | List[Dict[str, str]]`

Returns the full message history.
