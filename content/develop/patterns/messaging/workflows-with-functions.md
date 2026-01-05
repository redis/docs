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
description: Build durable workflows and state machines with Redis Functions
linkTitle: Workflows with Functions
title: How do I build workflows with Redis Functions?
weight: 3
---

## Problem

You need to implement multi-step workflows with:

- State transitions that must be atomic
- Complex business logic executed server-side
- Coordination between multiple keys
- Guaranteed consistency across steps
- Reduced network round-trips

Client-side workflow logic is error-prone and has race conditions.

## Solution overview

Redis Functions provide server-side execution for workflows:

1. **Atomic execution** - All operations in one transaction
2. **Server-side logic** - Reduce network overhead
3. **State management** - Track workflow state in Redis
4. **Error handling** - Rollback on failure
5. **Reusable libraries** - Deploy once, call many times

Functions are written in Lua and executed atomically on the Redis server.

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│         Workflow with Redis Functions                    │
└──────────────────────────────────────────────────────────┘

CLIENT-SIDE (Before Functions)
┌────────────────────────────────────────────────────────┐
│ 1. GET order:123                    ─┐                 │
│ 2. Check inventory                   │ 5 round-trips   │
│ 3. DECRBY inventory:item 1           │ Race conditions │
│ 4. SET order:123 status=confirmed    │ Error-prone     │
│ 5. PUBLISH notifications order_123  ─┘                 │
└────────────────────────────────────────────────────────┘

SERVER-SIDE (With Functions)
┌────────────────────────────────────────────────────────┐
│  Client                                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │ FCALL process_order order:123 item:456 qty:1    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  Redis Server (Atomic Execution)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ function process_order(order_id, item, qty)      │  │
│  │   -- 1. Get order                                │  │
│  │   local order = redis.call('JSON.GET', order_id) │  │
│  │                                                  │  │
│  │   -- 2. Check inventory                          │  │
│  │   local stock = redis.call('GET', 'inv:'..item)  │  │
│  │   if stock < qty then                            │  │
│  │     return {err = 'OUT_OF_STOCK'}                │  │
│  │   end                                            │  │
│  │                                                  │  │
│  │   -- 3. Update inventory                         │  │
│  │   redis.call('DECRBY', 'inv:'..item, qty)        │  │
│  │                                                  │  │
│  │   -- 4. Update order status                      │  │
│  │   redis.call('JSON.SET', order_id,               │  │
│  │     '$.status', 'confirmed')                     │  │
│  │                                                  │  │
│  │   -- 5. Notify                                   │  │
│  │   redis.call('PUBLISH', 'orders', order_id)      │  │
│  │                                                  │  │
│  │   return {ok = 'ORDER_CONFIRMED'}                │  │
│  │ end                                              │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Single result │
         │ 1 round-trip  │
         │ Atomic        │
         └───────────────┘

Benefits:
  - 5 round-trips → 1 round-trip
  - No race conditions
  - Atomic execution
  - Reusable across clients
```

## Prerequisites

Before implementing this pattern, review:

- [Redis Functions]({{< relref "/develop/programmability/functions-intro" >}}) - Functions documentation
- [Lua scripting]({{< relref "/develop/programmability/lua-api" >}}) - Lua API reference
- [Transactions]({{< relref "/develop/data-types/transactions" >}}) - MULTI/EXEC basics
- [Atomic operations]({{< relref "/develop/patterns/data-modeling/atomic-operations" >}}) - Multi-key atomicity

## Implementation

### Step 1: Simple workflow function

Create a function for a basic state transition.

**Lua function:**

```lua
#!lua name=workflows

local function transition_state(keys, args)
    local workflow_key = keys[1]
    local from_state = args[1]
    local to_state = args[2]
    
    -- Get current state
    local current = redis.call('HGET', workflow_key, 'state')
    
    -- Validate transition
    if current ~= from_state then
        return redis.error_reply('Invalid state transition: expected ' .. from_state .. ', got ' .. current)
    end
    
    -- Update state and timestamp
    redis.call('HSET', workflow_key, 
        'state', to_state,
        'updated_at', redis.call('TIME')[1]
    )
    
    return {ok = true, new_state = to_state}
end

redis.register_function('transition_state', transition_state)
```

**Python usage:**

```python
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Load function library
with open('workflows.lua', 'r') as f:
    r.function_load(f.read())

# Initialize workflow
r.hset('workflow:order:123', mapping={
    'state': 'pending',
    'created_at': '1234567890'
})

# Transition state
result = r.fcall('transition_state', 1, 'workflow:order:123', 'pending', 'processing')
print(f"Transition result: {result}")

# Try invalid transition (will fail)
try:
    r.fcall('transition_state', 1, 'workflow:order:123', 'pending', 'completed')
except redis.ResponseError as e:
    print(f"Error: {e}")
```

### Step 2: Order processing workflow

Implement a complete order workflow with multiple steps.

**Lua function:**

```lua
#!lua name=order_workflow

local function process_order(keys, args)
    local order_key = keys[1]
    local inventory_key = keys[2]
    local user_key = keys[3]
    
    local product_id = args[1]
    local quantity = tonumber(args[2])
    local price = tonumber(args[3])
    
    -- Check inventory
    local available = tonumber(redis.call('HGET', inventory_key, product_id) or 0)
    if available < quantity then
        return {ok = false, error = 'Insufficient inventory'}
    end
    
    -- Check user balance
    local balance = tonumber(redis.call('HGET', user_key, 'balance') or 0)
    local total = price * quantity
    if balance < total then
        return {ok = false, error = 'Insufficient funds'}
    end
    
    -- Execute order atomically
    -- 1. Deduct inventory
    redis.call('HINCRBY', inventory_key, product_id, -quantity)
    
    -- 2. Deduct balance
    redis.call('HINCRBYFLOAT', user_key, 'balance', -total)
    
    -- 3. Create order
    redis.call('HSET', order_key,
        'product_id', product_id,
        'quantity', quantity,
        'total', total,
        'state', 'completed',
        'timestamp', redis.call('TIME')[1]
    )
    
    -- 4. Add to order history
    redis.call('LPUSH', user_key .. ':orders', order_key)
    
    return {
        ok = true,
        order_id = order_key,
        total = total,
        new_balance = balance - total
    }
end

redis.register_function('process_order', process_order)
```

**Python usage:**

```python
# Setup initial state
r.hset('inventory:products', 'product:1', 100)
r.hset('user:123', 'balance', 1000.00)

# Process order
result = r.fcall(
    'process_order',
    3,
    'order:456',           # order key
    'inventory:products',  # inventory key
    'user:123',           # user key
    'product:1',          # product_id
    '5',                  # quantity
    '19.99'               # price
)

if result[b'ok']:
    print(f"Order successful! New balance: ${result[b'new_balance']}")
else:
    print(f"Order failed: {result[b'error']}")
```

### Step 3: State machine workflow

Implement a state machine with allowed transitions.

**Lua function:**

```lua
#!lua name=state_machine

-- Define allowed transitions
local transitions = {
    pending = {'processing', 'cancelled'},
    processing = {'shipped', 'cancelled'},
    shipped = {'delivered', 'returned'},
    delivered = {'returned'},
    cancelled = {},
    returned = {}
}

local function transition_workflow(keys, args)
    local workflow_key = keys[1]
    local new_state = args[1]
    local metadata = cjson.decode(args[2] or '{}')
    
    -- Get current state
    local current_state = redis.call('HGET', workflow_key, 'state')
    if not current_state then
        return redis.error_reply('Workflow not found')
    end
    
    -- Check if transition is allowed
    local allowed = transitions[current_state]
    local is_valid = false
    for _, state in ipairs(allowed) do
        if state == new_state then
            is_valid = true
            break
        end
    end
    
    if not is_valid then
        return redis.error_reply('Invalid transition from ' .. current_state .. ' to ' .. new_state)
    end
    
    -- Perform transition
    local timestamp = redis.call('TIME')[1]
    
    -- Update state
    redis.call('HSET', workflow_key,
        'state', new_state,
        'updated_at', timestamp
    )
    
    -- Add to history
    local history_entry = cjson.encode({
        from = current_state,
        to = new_state,
        timestamp = timestamp,
        metadata = metadata
    })
    redis.call('RPUSH', workflow_key .. ':history', history_entry)
    
    -- Set metadata if provided
    for key, value in pairs(metadata) do
        redis.call('HSET', workflow_key, key, value)
    end
    
    return {
        ok = true,
        from_state = current_state,
        to_state = new_state,
        timestamp = timestamp
    }
end

redis.register_function('transition_workflow', transition_workflow)
```

**Python usage:**

```python
import json

# Initialize workflow
r.hset('workflow:order:789', mapping={
    'state': 'pending',
    'order_id': '789',
    'created_at': '1234567890'
})

# Transition: pending -> processing
result = r.fcall(
    'transition_workflow',
    1,
    'workflow:order:789',
    'processing',
    json.dumps({'processor': 'worker-1'})
)
print(f"Transitioned to: {result[b'to_state']}")

# Transition: processing -> shipped
result = r.fcall(
    'transition_workflow',
    1,
    'workflow:order:789',
    'shipped',
    json.dumps({'tracking_number': 'TRACK123'})
)

# View history
history = r.lrange('workflow:order:789:history', 0, -1)
print("\nWorkflow history:")
for entry in history:
    event = json.loads(entry)
    print(f"  {event['from']} -> {event['to']} at {event['timestamp']}")
```

### Step 4: Saga pattern for distributed workflows

Implement compensating transactions for rollback.

**Lua function:**

```lua
#!lua name=saga

local function execute_saga(keys, args)
    local saga_key = keys[1]
    local steps = cjson.decode(args[1])
    
    -- Track completed steps for rollback
    local completed = {}
    
    -- Execute each step
    for i, step in ipairs(steps) do
        local success, result = pcall(function()
            if step.type == 'HSET' then
                return redis.call('HSET', step.key, step.field, step.value)
            elseif step.type == 'HINCRBY' then
                return redis.call('HINCRBY', step.key, step.field, step.amount)
            elseif step.type == 'SADD' then
                return redis.call('SADD', step.key, step.member)
            end
        end)
        
        if not success then
            -- Rollback completed steps
            for j = #completed, 1, -1 do
                local rollback = completed[j]
                if rollback.type == 'HSET' then
                    redis.call('HSET', rollback.key, rollback.field, rollback.old_value)
                elseif rollback.type == 'HINCRBY' then
                    redis.call('HINCRBY', rollback.key, rollback.field, -rollback.amount)
                elseif rollback.type == 'SADD' then
                    redis.call('SREM', rollback.key, rollback.member)
                end
            end
            
            return {ok = false, error = 'Step ' .. i .. ' failed', rolled_back = true}
        end
        
        -- Store for potential rollback
        table.insert(completed, step)
    end
    
    -- Record saga completion
    redis.call('HSET', saga_key,
        'status', 'completed',
        'completed_at', redis.call('TIME')[1]
    )
    
    return {ok = true, steps_completed = #completed}
end

redis.register_function('execute_saga', execute_saga)
```

### Step 5: Scheduled workflow execution

Combine Functions with Streams for scheduled workflows.

**Python example:**

```python
def schedule_workflow(workflow_id, execute_at, workflow_data):
    """Schedule a workflow for future execution"""
    # Add to sorted set with execution time as score
    r.zadd('scheduled:workflows', {workflow_id: execute_at})
    
    # Store workflow data
    r.hset(f'workflow:{workflow_id}', mapping=workflow_data)

def process_scheduled_workflows():
    """Process workflows that are due"""
    import time
    
    now = time.time()
    
    # Get workflows due for execution
    due_workflows = r.zrangebyscore('scheduled:workflows', '-inf', now)
    
    for workflow_id in due_workflows:
        # Get workflow data
        workflow_data = r.hgetall(f'workflow:{workflow_id}')
        
        # Execute workflow function
        try:
            result = r.fcall(
                'transition_workflow',
                1,
                f'workflow:{workflow_id}',
                workflow_data[b'next_state'],
                '{}'
            )
            
            # Remove from scheduled set
            r.zrem('scheduled:workflows', workflow_id)
            
            print(f"Executed workflow {workflow_id}")
        except Exception as e:
            print(f"Failed to execute {workflow_id}: {e}")

# Schedule a workflow
import time
future_time = time.time() + 3600  # 1 hour from now
schedule_workflow('order:999', future_time, {
    'state': 'pending',
    'next_state': 'processing'
})
```

## Redis Cloud setup

When deploying workflows to Redis Cloud:

1. **Load functions once** - Use FUNCTION LOAD on startup
2. **Version functions** - Use library names for versioning
3. **Monitor execution** - Track function call latency
4. **Handle errors** - Implement proper error handling in Lua
5. **Test thoroughly** - Functions are harder to debug than client code

Example configuration:
- **Function libraries**: Load on application startup
- **Error handling**: Return structured error responses
- **Logging**: Use redis.log() for debugging
- **Atomicity**: All operations in function are atomic

## Common pitfalls

1. **Not handling errors** - Always validate state before transitions
2. **Missing rollback logic** - Implement compensating transactions
3. **Complex functions** - Keep functions focused and simple
4. **Not versioning** - Use library names for version control
5. **Blocking operations** - Avoid long-running computations

## Related patterns

- [Atomic operations]({{< relref "/develop/patterns/data-modeling/atomic-operations" >}}) - Multi-key atomicity
- [Exactly-once processing]({{< relref "/develop/patterns/ingestion/exactly-once-processing" >}}) - Idempotency
- [Distributed locks]({{< relref "/develop/clients/patterns/distributed-locks" >}}) - Coordination

## More information

- [Redis Functions]({{< relref "/develop/programmability/functions-intro" >}})
- [Lua API]({{< relref "/develop/programmability/lua-api" >}})
- [FUNCTION LOAD command]({{< relref "/commands/function-load" >}})
- [FCALL command]({{< relref "/commands/fcall" >}})
- [Transactions]({{< relref "/develop/data-types/transactions" >}})

