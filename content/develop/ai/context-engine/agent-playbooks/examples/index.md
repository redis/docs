---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Download complete Python examples for publishing knowledge and connecting an agent.
hideListLinks: true
linktitle: Download examples
title: Download examples
weight: 65
---

Download these complete Python examples and run them with the setup in each guide.

| Example | Script | Required permission | Cleanup |
|:--------|:-------|:--------------------|:--------|
| [Publish a skill]({{< relref "/develop/ai/context-engine/agent-playbooks/quickstart" >}}) | [publish_skill.py](publish_skill.py) | `write`, `publish` | Leaves one published skill for the agent walkthrough. |
| [Connect an agent]({{< relref "/develop/ai/context-engine/agent-playbooks/connect-agent" >}}) | [mcp_client.py](mcp_client.py) | `read` | Creates no content. |
| [Publish and retrieve an answer]({{< relref "/develop/ai/context-engine/agent-playbooks/publish-knowledge#add-an-answer" >}}) | [faq_example.py](faq_example.py) | `write`, `publish` | Deletes the entry it created. |

Download [requirements.txt](requirements.txt) into the same directory. In an activated virtual environment, install the pinned clients:

```sh
python -m pip install -r requirements.txt
```

The examples use `redis-agent-playbook==0.1.0a2` and `mcp==1.30.0`. Each guide specifies the environment variables it needs. Keep credentials out of source files and model prompts.
