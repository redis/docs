---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
description: Coordinate multiple AI agents using Redis Streams and shared state
linkTitle: Multi-agent coordination
title: How do I coordinate multiple AI agents?
weight: 1
---

## Problem

You need to coordinate multiple AI agents working together:

- Route tasks to specialized agents
- Share state and context between agents
- Implement agent-to-agent communication
- Track workflow progress
- Handle agent failures and retries

Single agents can't handle complex multi-step workflows efficiently.

## Solution overview

Redis provides multi-agent coordination with:

1. **Streams** - Message passing between agents
2. **JSON/Hashes** - Shared state management
3. **Pub/Sub** - Real-time notifications
4. **Consumer groups** - Load balancing across agent instances
5. **Functions** - Atomic state transitions

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                  Multi-Agent System                         │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │   Orchestrator       │
                    │   (Coordinator)      │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
         ┌────────────┐ ┌────────────┐ ┌────────────┐
         │  Task      │ │  Task      │ │  Task      │
         │  Stream A  │ │  Stream B  │ │  Stream C  │
         └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
               │              │              │
         ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
         │           │  │           │  │           │
         ▼           ▼  ▼           ▼  ▼           ▼
    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
    │Agent A1│  │Agent A2│  │Agent B1│  │Agent C1│
    │Research│  │Research│  │Writer  │  │Coder   │
    └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘
         │           │           │           │
         └───────────┴───────────┴───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Shared State       │
              │   (JSON Documents)   │
              │                      │
              │  - Workflow status   │
              │  - Agent registry    │
              │  - Task results      │
              └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Agent Messages     │
              │   (Pub/Sub)          │
              │                      │
              │  agent:A1:inbox      │
              │  agent:B1:inbox      │
              └──────────────────────┘
```

## Prerequisites

Before implementing this pattern, review:

- [Streams event pipeline]({{< relref "/develop/patterns/ingestion/streams-event-pipeline" >}}) - Streams basics
- [Consumer groups]({{< relref "/develop/patterns/ingestion/consumer-groups" >}}) - Parallel processing
- [Workflows with Functions]({{< relref "/develop/patterns/messaging/workflows-with-functions" >}}) - State machines
- [Agent memory]({{< relref "/develop/patterns/ai/agent-memory" >}}) - Agent state

## Implementation

### Step 1: Agent registry and discovery

Register agents and their capabilities.

**Python example:**

```python
import redis
import json
import time

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def register_agent(agent_id, capabilities, metadata=None):
    """Register an agent with its capabilities"""
    metadata = metadata or {}
    
    agent_info = {
        "agent_id": agent_id,
        "capabilities": capabilities,
        "status": "active",
        "registered_at": time.time(),
        "last_heartbeat": time.time(),
        **metadata
    }
    
    # Store agent info
    r.json().set(f"agent:{agent_id}", "$", agent_info)
    
    # Add to capability indexes
    for capability in capabilities:
        r.sadd(f"agents:by_capability:{capability}", agent_id)
    
    # Set TTL for auto-cleanup
    r.expire(f"agent:{agent_id}", 300)  # 5 minutes

def heartbeat(agent_id):
    """Update agent heartbeat"""
    r.json().set(f"agent:{agent_id}", "$.last_heartbeat", time.time())
    r.expire(f"agent:{agent_id}", 300)

def find_agents_by_capability(capability):
    """Find all agents with a specific capability"""
    agent_ids = r.smembers(f"agents:by_capability:{capability}")
    
    agents = []
    for agent_id in agent_ids:
        agent_info = r.json().get(f"agent:{agent_id}")
        if agent_info:
            agents.append(agent_info)
    
    return agents

# Register agents
register_agent("agent_research", ["web_search", "summarization"])
register_agent("agent_writer", ["content_generation", "editing"])
register_agent("agent_coder", ["code_generation", "code_review"])

# Find agents
research_agents = find_agents_by_capability("web_search")
print(f"Research agents: {research_agents}")
```

### Step 2: Task routing and distribution

Route tasks to appropriate agents using Streams.

**Python example:**

```python
def create_task(task_type, payload, priority="normal"):
    """Create a task for agents to process"""
    task = {
        "task_id": f"task_{int(time.time() * 1000)}",
        "task_type": task_type,
        "payload": json.dumps(payload),
        "priority": priority,
        "status": "pending",
        "created_at": time.time()
    }
    
    # Add to task stream
    stream_key = f"tasks:{task_type}"
    message_id = r.xadd(stream_key, task)
    
    # Store task details
    r.json().set(f"task:{task['task_id']}", "$", task)
    
    return task['task_id'], message_id

def agent_process_tasks(agent_id, task_types, group_name="agents"):
    """Agent processes tasks from streams"""
    # Create consumer group if needed
    for task_type in task_types:
        stream_key = f"tasks:{task_type}"
        try:
            r.xgroup_create(stream_key, group_name, id='0', mkstream=True)
        except:
            pass  # Group already exists
    
    # Build streams dict
    streams = {f"tasks:{tt}": ">" for tt in task_types}
    
    while True:
        # Read from streams
        messages = r.xreadgroup(
            group_name,
            agent_id,
            streams,
            count=1,
            block=1000
        )
        
        if not messages:
            heartbeat(agent_id)
            continue
        
        for stream, msgs in messages:
            for msg_id, task_data in msgs:
                # Process task
                task_id = task_data['task_id']
                print(f"{agent_id} processing {task_id}")
                
                # Update task status
                r.json().set(f"task:{task_id}", "$.status", "processing")
                r.json().set(f"task:{task_id}", "$.assigned_to", agent_id)
                
                # Simulate processing
                time.sleep(1)
                
                # Complete task
                r.json().set(f"task:{task_id}", "$.status", "completed")
                
                # Acknowledge
                r.xack(stream, group_name, msg_id)
                
                print(f"{agent_id} completed {task_id}")

# Create tasks
create_task("web_search", {"query": "Redis vector search"})
create_task("content_generation", {"topic": "AI agents"})
```

### Step 3: Agent-to-agent communication

Implement message passing between agents.

**Python example:**

```python
def send_message(from_agent, to_agent, message_type, content):
    """Send message from one agent to another"""
    message = {
        "from": from_agent,
        "to": to_agent,
        "type": message_type,
        "content": json.dumps(content),
        "timestamp": time.time()
    }
    
    # Add to recipient's inbox
    inbox_key = f"agent:{to_agent}:inbox"
    r.xadd(inbox_key, message)
    
    # Notify via pub/sub
    r.publish(f"agent:{to_agent}:notifications", json.dumps(message))
    
    return message

def receive_messages(agent_id, last_id='0-0'):
    """Receive messages for an agent"""
    inbox_key = f"agent:{agent_id}:inbox"
    
    messages = r.xread({inbox_key: last_id}, count=10, block=1000)
    
    received = []
    for stream, msgs in messages:
        for msg_id, msg_data in msgs:
            received.append({
                "id": msg_id,
                "from": msg_data['from'],
                "type": msg_data['type'],
                "content": json.loads(msg_data['content']),
                "timestamp": float(msg_data['timestamp'])
            })
    
    return received

# Agent communication
send_message(
    "agent_research",
    "agent_writer",
    "research_complete",
    {"summary": "Redis is an in-memory data store...", "sources": ["redis.io"]}
)

# Receive messages
messages = receive_messages("agent_writer")
print(f"Messages: {messages}")
```

### Step 4: Shared state management

Manage shared state across agents.

**Python example:**

```python
def create_workflow(workflow_id, steps):
    """Create a multi-agent workflow"""
    workflow = {
        "workflow_id": workflow_id,
        "steps": steps,
        "current_step": 0,
        "status": "pending",
        "results": {},
        "created_at": time.time()
    }
    
    r.json().set(f"workflow:{workflow_id}", "$", workflow)
    return workflow_id

def update_workflow_step(workflow_id, step_index, result):
    """Update workflow step result"""
    pipe = r.pipeline()
    
    # Store result
    pipe.json().set(
        f"workflow:{workflow_id}",
        f"$.results.step_{step_index}",
        result
    )
    
    # Move to next step
    pipe.json().numincrby(f"workflow:{workflow_id}", "$.current_step", 1)
    
    # Check if complete
    workflow = r.json().get(f"workflow:{workflow_id}")
    if workflow['current_step'] + 1 >= len(workflow['steps']):
        pipe.json().set(f"workflow:{workflow_id}", "$.status", "completed")
    
    pipe.execute()

def get_workflow_status(workflow_id):
    """Get workflow status"""
    return r.json().get(f"workflow:{workflow_id}")

# Create workflow
workflow_id = create_workflow("wf_001", [
    {"agent_type": "web_search", "action": "research"},
    {"agent_type": "content_generation", "action": "write"},
    {"agent_type": "code_generation", "action": "create_example"}
])

# Update steps
update_workflow_step(workflow_id, 0, {"summary": "Research complete"})
update_workflow_step(workflow_id, 1, {"content": "Article written"})

status = get_workflow_status(workflow_id)
print(f"Workflow status: {status}")
```

### Step 5: Orchestrator pattern

Implement a coordinator agent that manages other agents.

**Python example:**

```python
class AgentOrchestrator:
    def __init__(self, orchestrator_id):
        self.orchestrator_id = orchestrator_id
        self.r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    
    def execute_workflow(self, workflow_definition):
        """Execute a multi-agent workflow"""
        workflow_id = f"wf_{int(time.time() * 1000)}"
        
        # Create workflow
        create_workflow(workflow_id, workflow_definition['steps'])
        
        # Execute steps sequentially
        for i, step in enumerate(workflow_definition['steps']):
            print(f"Executing step {i}: {step['action']}")
            
            # Find capable agent
            agents = find_agents_by_capability(step['agent_type'])
            
            if not agents:
                raise Exception(f"No agent found for {step['agent_type']}")
            
            # Assign to first available agent
            agent = agents[0]
            agent_id = agent['agent_id']
            
            # Create task
            task_id, _ = create_task(
                step['agent_type'],
                {"workflow_id": workflow_id, "step": i, **step.get('params', {})}
            )
            
            # Wait for completion (simplified)
            while True:
                task = self.r.json().get(f"task:{task_id}")
                if task['status'] == 'completed':
                    break
                time.sleep(0.5)
            
            # Get result and update workflow
            result = task.get('result', {})
            update_workflow_step(workflow_id, i, result)
        
        return workflow_id
    
    def execute_parallel_workflow(self, workflow_definition):
        """Execute steps in parallel where possible"""
        workflow_id = f"wf_{int(time.time() * 1000)}"
        
        # Create workflow
        create_workflow(workflow_id, workflow_definition['steps'])
        
        # Group steps by dependencies
        parallel_groups = self._group_by_dependencies(workflow_definition['steps'])
        
        for group in parallel_groups:
            # Execute all steps in group in parallel
            task_ids = []
            
            for step in group:
                agents = find_agents_by_capability(step['agent_type'])
                if agents:
                    task_id, _ = create_task(
                        step['agent_type'],
                        {"workflow_id": workflow_id, **step.get('params', {})}
                    )
                    task_ids.append(task_id)
            
            # Wait for all tasks in group to complete
            self._wait_for_tasks(task_ids)
        
        return workflow_id
    
    def _group_by_dependencies(self, steps):
        """Group steps by dependencies (simplified)"""
        # In real implementation, analyze dependencies
        return [steps]  # All in one group for now
    
    def _wait_for_tasks(self, task_ids):
        """Wait for multiple tasks to complete"""
        while task_ids:
            for task_id in task_ids[:]:
                task = self.r.json().get(f"task:{task_id}")
                if task and task['status'] == 'completed':
                    task_ids.remove(task_id)
            
            if task_ids:
                time.sleep(0.5)

# Example usage
orchestrator = AgentOrchestrator("orchestrator_001")

workflow = {
    "steps": [
        {"agent_type": "web_search", "action": "research", "params": {"query": "Redis"}},
        {"agent_type": "content_generation", "action": "write", "params": {"topic": "Redis guide"}},
        {"agent_type": "code_generation", "action": "examples", "params": {"language": "python"}}
    ]
}

# workflow_id = orchestrator.execute_workflow(workflow)
# print(f"Workflow {workflow_id} completed")
```

## Redis Cloud setup

When deploying multi-agent systems to Redis Cloud:

1. **Use consumer groups** - Load balance across agent instances
2. **Implement heartbeats** - Detect failed agents
3. **Set appropriate TTLs** - Clean up stale data
4. **Monitor streams** - Track message backlog
5. **Use Functions** - Atomic state transitions

Example configuration:
- **Heartbeat interval**: 30-60 seconds
- **Agent TTL**: 5 minutes
- **Task retention**: 24 hours
- **Consumer group**: One per agent type
- **Stream trimming**: Keep last 10K messages

## Common pitfalls

1. **No heartbeat** - Can't detect failed agents
2. **Missing acknowledgments** - Tasks processed multiple times
3. **No retry logic** - Failed tasks lost
4. **Circular dependencies** - Workflow deadlocks
5. **Not using consumer groups** - Poor load balancing

## Related patterns

- [Streams event pipeline]({{< relref "/develop/patterns/ingestion/streams-event-pipeline" >}}) - Event processing
- [Consumer groups]({{< relref "/develop/patterns/ingestion/consumer-groups" >}}) - Parallel processing
- [Workflows with Functions]({{< relref "/develop/patterns/messaging/workflows-with-functions" >}}) - State machines
- [Agent memory]({{< relref "/develop/patterns/ai/agent-memory" >}}) - Agent state

## More information

- [Streams]({{< relref "/develop/data-types/streams" >}})
- [Consumer groups]({{< relref "/develop/data-types/streams#consumer-groups" >}})
- [Pub/Sub]({{< relref "/develop/data-types/pubsub" >}})
- [JSON]({{< relref "/develop/data-types/json" >}})
- [Redis Functions]({{< relref "/develop/programmability/functions-intro" >}})

