---
linkTitle: LLM message history
title: LLM Message History
url: '/develop/ai/redisvl/0.8.0/api/essage_history/'
---


## SemanticMessageHistory

<a id="semantic-message-history-api"></a>

### `class SemanticMessageHistory(name, session_tag=None, prefix=None, vectorizer=None, distance_threshold=0.3, redis_client=None, redis_url='redis://localhost:6379', connection_kwargs={}, overwrite=False, **kwargs)`

Bases: `BaseMessageHistory`

Initialize message history with index

Semantic Message History stores the current and previous user text prompts
and LLM responses to allow for enriching future prompts with session
context. Message history is stored in individual user or LLM prompts and
responses.

* **Parameters:**
  * **name** (*str*) – The name of the message history index.
  * **session_tag** (*Optional* *[* *str* *]*) – Tag to be added to entries to link to a specific
    conversation session. Defaults to instance ULID.
  * **prefix** (*Optional* *[* *str* *]*) – Prefix for the keys for this message data.
    Defaults to None and will be replaced with the index name.
  * **vectorizer** (*Optional* *[* *BaseVectorizer* *]*) – The vectorizer used to create embeddings.
  * **distance_threshold** (*float*) – The maximum semantic distance to be
    included in the context. Defaults to 0.3.
  * **redis_client** (*Optional* *[* *Redis* *]*) – A Redis client instance. Defaults to
    None.
  * **redis_url** (*str* *,* *optional*) – The redis url. Defaults to redis://localhost:6379.
  * **connection_kwargs** (*Dict* *[* *str* *,* *Any* *]*) – The connection arguments
    for the redis client. Defaults to empty {}.
  * **overwrite** (*bool*) – Whether or not to force overwrite the schema for
    the semantic message index. Defaults to false.

The proposed schema will support a single vector embedding constructed
from either the prompt or response in a single string.

#### `add_message(message, session_tag=None)`

Insert a single prompt or response into the message history.
A timestamp is associated with it so that it can be later sorted
in sequential ordering after retrieval.

* **Parameters:**
  * **message** (*Dict* *[* *str* *,**str* *]*) – The user prompt or LLM response.
  * **session_tag** (*Optional* *[* *str* *]*) – Tag to be added to entry to link to a specific
    conversation session. Defaults to instance ULID.
* **Return type:**
  None

#### `add_messages(messages, session_tag=None)`

Insert a list of prompts and responses into the session memory.
A timestamp is associated with each so that they can be later sorted
in sequential ordering after retrieval.

* **Parameters:**
  * **messages** (*List* *[* *Dict* *[* *str* *,* *str* *]* *]*) – The list of user prompts and LLM responses.
  * **session_tag** (*Optional* *[* *str* *]*) – Tag to be added to entries to link to a specific
    conversation session. Defaults to instance ULID.
* **Return type:**
  None

#### `clear()`

Clears the message history.

* **Return type:**
  None

#### `delete()`

Clear all message keys and remove the search index.

* **Return type:**
  None

#### `drop(id=None)`

Remove a specific exchange from the message history.

* **Parameters:**
  **id** (*Optional* *[* *str* *]*) – The id of the message entry to delete.
  If None then the last entry is deleted.
* **Return type:**
  None

#### `get_recent(top_k=5, as_text=False, raw=False, session_tag=None)`

Retrieve the recent message history in sequential order.

* **Parameters:**
  * **top_k** (*int*) – The number of previous exchanges to return. Default is 5.
  * **as_text** (*bool*) – Whether to return the conversation as a single string,
    or list of alternating prompts and responses.
  * **raw** (*bool*) – Whether to return the full Redis hash entry or just the
    prompt and response
  * **session_tag** (*Optional* *[* *str* *]*) – Tag of the entries linked to a specific
    conversation session. Defaults to instance ULID.
* **Returns:**
  A single string transcription of the session
  : or list of strings if as_text is false.
* **Return type:**
  Union[str, List[str]]
* **Raises:**
  **ValueError** – if top_k is not an integer greater than or equal to 0.

#### `get_relevant(prompt, as_text=False, top_k=5, fall_back=False, session_tag=None, raw=False, distance_threshold=None)`

Searches the message history for information semantically related to
the specified prompt.

This method uses vector similarity search with a text prompt as input.
It checks for semantically similar prompts and responses and gets
the top k most relevant previous prompts or responses to include as
context to the next LLM call.

* **Parameters:**
  * **prompt** (*str*) – The message text to search for in message history
  * **as_text** (*bool*) – Whether to return the prompts and responses as text
  * **JSON.** (*or as*)
  * **top_k** (*int*) – The number of previous messages to return. Default is 5.
  * **session_tag** (*Optional* *[* *str* *]*) – Tag of the entries linked to a specific
    conversation session. Defaults to instance ULID.
  * **distance_threshold** (*Optional* *[* *float* *]*) – The threshold for semantic
    vector distance.
  * **fall_back** (*bool*) – Whether to drop back to recent conversation history
    if no relevant context is found.
  * **raw** (*bool*) – Whether to return the full Redis hash entry or just the
    message.
* **Returns:**
  Either a list of strings, or a
  list of prompts and responses in JSON containing the most relevant.
* **Return type:**
  Union[List[str], List[Dict[str,str]]

Raises ValueError: if top_k is not an integer greater or equal to 0.

#### `store(prompt, response, session_tag=None)`

Insert a prompt:response pair into the message history. A timestamp
is associated with each message so that they can be later sorted
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

#### `get_recent(top_k=5, as_text=False, raw=False, session_tag=None)`

Retrieve the recent message history in sequential order.

* **Parameters:**
  * **top_k** (*int*) – The number of previous messages to return. Default is 5.
  * **as_text** (*bool*) – Whether to return the conversation as a single string,
    or list of alternating prompts and responses.
  * **raw** (*bool*) – Whether to return the full Redis hash entry or just the
    prompt and response.
  * **session_tag** (*Optional* *[* *str* *]*) – Tag of the entries linked to a specific
    conversation session. Defaults to instance ULID.
* **Returns:**
  A single string transcription of the messages
  : or list of strings if as_text is false.
* **Return type:**
  Union[str, List[str]]
* **Raises:**
  **ValueError** – if top_k is not an integer greater than or equal to 0.

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
