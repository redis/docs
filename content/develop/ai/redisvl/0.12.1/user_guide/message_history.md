---
linkTitle: LLM message history
title: LLM Message History
weight: 07
url: '/develop/ai/redisvl/0.12.1/user_guide/message_history/'
---


Large Language Models are inherently stateless and have no knowledge of previous interactions with a user, or even of previous parts of the current conversation. While this may not be noticeable when asking simple questions, it becomes a hindrance when engaging in long running conversations that rely on conversational context.

The solution to this problem is to append the previous conversation history to each subsequent call to the LLM.

This notebook will show how to use Redis to structure and store and retrieve this conversational message history.


```python
from redisvl.extensions.message_history import MessageHistory

chat_history = MessageHistory(name='student tutor')
```

To align with common LLM APIs, Redis stores messages with `role` and `content` fields.
The supported roles are "system", "user" and "llm".

You can store messages one at a time or all at once.


```python
chat_history.add_message({"role":"system", "content":"You are a helpful geography tutor, giving simple and short answers to questions about European countries."})
chat_history.add_messages([
    {"role":"user", "content":"What is the capital of France?"},
    {"role":"llm", "content":"The capital is Paris."},
    {"role":"user", "content":"And what is the capital of Spain?"},
    {"role":"llm", "content":"The capital is Madrid."},
    {"role":"user", "content":"What is the population of Great Britain?"},
    {"role":"llm", "content":"As of 2023 the population of Great Britain is approximately 67 million people."},]
    )
```

At any point we can retrieve the recent history of the conversation. It will be ordered by entry time.


```python
context = chat_history.get_recent()
for message in context:
    print(message)
```

    {'role': 'llm', 'content': 'The capital is Paris.'}
    {'role': 'user', 'content': 'And what is the capital of Spain?'}
    {'role': 'llm', 'content': 'The capital is Madrid.'}
    {'role': 'user', 'content': 'What is the population of Great Britain?'}
    {'role': 'llm', 'content': 'As of 2023 the population of Great Britain is approximately 67 million people.'}


In many LLM flows the conversation progresses in a series of prompt and response pairs. Message history offer a convenience function `store()` to add these simply.


```python
prompt = "what is the size of England compared to Portugal?"
response = "England is larger in land area than Portal by about 15000 square miles."
chat_history.store(prompt, response)

context = chat_history.get_recent(top_k=6)
for message in context:
    print(message)
```

    {'role': 'user', 'content': 'And what is the capital of Spain?'}
    {'role': 'llm', 'content': 'The capital is Madrid.'}
    {'role': 'user', 'content': 'What is the population of Great Britain?'}
    {'role': 'llm', 'content': 'As of 2023 the population of Great Britain is approximately 67 million people.'}
    {'role': 'user', 'content': 'what is the size of England compared to Portugal?'}
    {'role': 'llm', 'content': 'England is larger in land area than Portal by about 15000 square miles.'}


## Managing multiple users and conversations

For applications that need to handle multiple conversations concurrently, Redis supports tagging messages to keep conversations separated.


```python
chat_history.add_message({"role":"system", "content":"You are a helpful algebra tutor, giving simple answers to math problems."}, session_tag='student two')
chat_history.add_messages([
    {"role":"user", "content":"What is the value of x in the equation 2x + 3 = 7?"},
    {"role":"llm", "content":"The value of x is 2."},
    {"role":"user", "content":"What is the value of y in the equation 3y - 5 = 7?"},
    {"role":"llm", "content":"The value of y is 4."}],
    session_tag='student two'
    )

for math_message in chat_history.get_recent(session_tag='student two'):
    print(math_message)
```

    {'role': 'system', 'content': 'You are a helpful algebra tutor, giving simple answers to math problems.'}
    {'role': 'user', 'content': 'What is the value of x in the equation 2x + 3 = 7?'}
    {'role': 'llm', 'content': 'The value of x is 2.'}
    {'role': 'user', 'content': 'What is the value of y in the equation 3y - 5 = 7?'}
    {'role': 'llm', 'content': 'The value of y is 4.'}


## Semantic message history
For longer conversations our list of messages keeps growing. Since LLMs are stateless we have to continue to pass this conversation history on each subsequent call to ensure the LLM has the correct context.

A typical flow looks like this:
```
while True:
    prompt = input('enter your next question')
    context = chat_history.get_recent()
    response = LLM_api_call(prompt=prompt, context=context)
    chat_history.store(prompt, response)
```

This works, but as context keeps growing so too does our LLM token count, which increases latency and cost.

Conversation histories can be truncated, but that can lead to losing relevant information that appeared early on.

A better solution is to pass only the relevant conversational context on each subsequent call.

For this, RedisVL has the `SemanticMessageHistory`, which uses vector similarity search to return only semantically relevant sections of the conversation.


```python
from redisvl.extensions.message_history import SemanticMessageHistory
semantic_history = SemanticMessageHistory(name='tutor')

semantic_history.add_messages(chat_history.get_recent(top_k=8))
```

    /Users/tyler.hutcherson/Documents/AppliedAI/redis-vl-python/.venv/lib/python3.13/site-packages/tqdm/auto.py:21: TqdmWarning: IProgress not found. Please update jupyter and ipywidgets. See https://ipywidgets.readthedocs.io/en/stable/user_install.html
      from .autonotebook import tqdm as notebook_tqdm


    13:03:39 sentence_transformers.SentenceTransformer INFO   Use pytorch device_name: mps
    13:03:39 sentence_transformers.SentenceTransformer INFO   Load pretrained SentenceTransformer: sentence-transformers/all-mpnet-base-v2


    Batches: 100%|██████████| 1/1 [00:00<00:00,  6.59it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 10.33it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00,  9.91it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 12.52it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 57.92it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 60.45it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 13.38it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 13.65it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 62.33it/s]



```python
prompt = "what have I learned about the size of England?"
semantic_history.set_distance_threshold(0.35)
context = semantic_history.get_relevant(prompt)
for message in context:
    print(message)
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 56.30it/s]

    {'role': 'user', 'content': 'what is the size of England compared to Portugal?'}


    


You can adjust the degree of semantic similarity needed to be included in your context.

Setting a distance threshold close to 0.0 will require an exact semantic match, while a distance threshold of 1.0 will include everything.


```python
semantic_history.set_distance_threshold(0.7)

larger_context = semantic_history.get_relevant(prompt)
for message in larger_context:
    print(message)
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 50.04it/s]

    {'role': 'user', 'content': 'what is the size of England compared to Portugal?'}
    {'role': 'llm', 'content': 'England is larger in land area than Portal by about 15000 square miles.'}
    {'role': 'user', 'content': 'What is the population of Great Britain?'}
    {'role': 'llm', 'content': 'As of 2023 the population of Great Britain is approximately 67 million people.'}
    {'role': 'user', 'content': 'And what is the capital of Spain?'}


    


## Conversation control

LLMs can hallucinate on occasion and when this happens it can be useful to prune incorrect information from conversational histories so this incorrect information doesn't continue to be passed as context.


```python
semantic_history.store(
    prompt="what is the smallest country in Europe?",
    response="Monaco is the smallest country in Europe at 0.78 square miles." # Incorrect. Vatican City is the smallest country in Europe
)

# get the key of the incorrect message
context = semantic_history.get_recent(top_k=1, raw=True)
bad_key = context[0]['entry_id']
semantic_history.drop(bad_key)

corrected_context = semantic_history.get_recent()
for message in corrected_context:
    print(message)
```

    Batches: 100%|██████████| 1/1 [00:00<00:00, 54.73it/s]
    Batches: 100%|██████████| 1/1 [00:00<00:00, 10.63it/s]

    {'role': 'user', 'content': 'What is the population of Great Britain?'}
    {'role': 'llm', 'content': 'As of 2023 the population of Great Britain is approximately 67 million people.'}
    {'role': 'user', 'content': 'what is the size of England compared to Portugal?'}
    {'role': 'llm', 'content': 'England is larger in land area than Portal by about 15000 square miles.'}
    {'role': 'user', 'content': 'what is the smallest country in Europe?'}


    



```python
chat_history.clear()
semantic_history.clear()
```
