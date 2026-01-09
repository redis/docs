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
description: Implement atomic multi-key operations with transactions and Redis Functions
linkTitle: Atomic operations
title: How do I implement atomic multi-key operations?
weight: 2
---

## Problem

You need to update multiple keys atomically:

- Transfer funds between accounts
- Update inventory and create order simultaneously
- Maintain consistency across related data
- Prevent race conditions
- Rollback on failure

Individual commands can't guarantee atomicity across multiple keys.

## Solution overview

Redis provides three approaches for atomic multi-key operations:

1. **MULTI/EXEC** - Transaction blocks for simple atomic operations
2. **WATCH** - Optimistic locking for conditional transactions
3. **Redis Functions** - Server-side Lua for complex logic

Choose based on complexity and whether you need conditional logic.

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│         Atomic Operations Patterns                       │
└──────────────────────────────────────────────────────────┘

1. MULTI/EXEC (Simple Transactions)
   ┌────────────────────────────────────────┐
   │ Client                                 │
   │ ┌────────────────────────────────────┐ │
   │ │ MULTI                              │ │
   │ │ DECRBY account:A 100               │ │
   │ │ INCRBY account:B 100               │ │
   │ │ EXEC                               │ │
   │ └────────────────────────────────────┘ │
   └────────────────────────────────────────┘
          │
          ▼
   ┌────────────────────────────────────────┐
   │ Redis: All or nothing execution        │
   │ ✓ Both commands succeed                │
   │ ✗ Or both fail                         │
   └────────────────────────────────────────┘

2. WATCH (Optimistic Locking)
   ┌────────────────────────────────────────┐
   │ WATCH account:A                        │
   │ balance = GET account:A                │
   │ if balance >= 100:                     │
   │   MULTI                                │
   │   DECRBY account:A 100                 │
   │   INCRBY account:B 100                 │
   │   EXEC                                 │
   └────────────────────────────────────────┘
          │
          ├─── Key changed? ───┐
          │                    │
          ▼ NO                 ▼ YES
   ┌──────────┐         ┌──────────┐
   │ Execute  │         │  Retry   │
   └──────────┘         └──────────┘

3. Redis Functions (Complex Logic)
   ┌────────────────────────────────────────┐
   │ function transfer(from, to, amount)    │
   │   local balance = redis.call(          │
   │     'GET', from)                       │
   │   if balance >= amount then            │
   │     redis.call('DECRBY', from, amount) │
   │     redis.call('INCRBY', to, amount)   │
   │     return 'OK'                        │
   │   else                                 │
   │     return 'INSUFFICIENT_FUNDS'        │
   │   end                                  │
   │ end                                    │
   └────────────────────────────────────────┘
          │
          ▼
   Atomic execution on server
   No network round-trips for logic
```

## Prerequisites

Before implementing this pattern, review:

- [Transactions]({{< relref "/develop/using-commands/transactions" >}}) - MULTI/EXEC documentation
- [Redis Functions]({{< relref "/develop/programmability/functions-intro" >}}) - Server-side execution
- [Workflows with Functions]({{< relref "/develop/patterns/messaging/workflows-with-functions" >}}) - Function patterns

## Implementation

### Step 1: Simple transactions with MULTI/EXEC

Use MULTI/EXEC for straightforward atomic operations.

**Python example:**

```python
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def transfer_funds(from_account, to_account, amount):
    """Transfer funds atomically between accounts"""
    pipe = r.pipeline()
    
    # Queue commands
    pipe.decrby(f"account:{from_account}:balance", amount)
    pipe.incrby(f"account:{to_account}:balance", amount)
    pipe.lpush(f"account:{from_account}:transactions", 
               f"Transfer -{amount} to {to_account}")
    pipe.lpush(f"account:{to_account}:transactions",
               f"Transfer +{amount} from {from_account}")
    
    # Execute atomically
    results = pipe.execute()
    
    return results

# Initialize accounts
r.set("account:alice:balance", 1000)
r.set("account:bob:balance", 500)

# Transfer $100 from Alice to Bob
transfer_funds("alice", "bob", 100)

print(f"Alice balance: {r.get('account:alice:balance')}")  # 900
print(f"Bob balance: {r.get('account:bob:balance')}")      # 600
```

**Node.js example:**

```javascript
import { createClient } from 'redis';

const client = await createClient().connect();

async function transferFunds(fromAccount, toAccount, amount) {
  const multi = client.multi()
    .decrBy(`account:${fromAccount}:balance`, amount)
    .incrBy(`account:${toAccount}:balance`, amount)
    .lPush(`account:${fromAccount}:transactions`, 
           `Transfer -${amount} to ${toAccount}`)
    .lPush(`account:${toAccount}:transactions`,
           `Transfer +${amount} from ${fromAccount}`);
  
  return await multi.exec();
}

// Transfer funds
await transferFunds('alice', 'bob', 100);
```

### Step 2: Optimistic locking with WATCH

Use WATCH for conditional transactions based on key values.

**Python example:**

```python
def transfer_with_check(from_account, to_account, amount, max_retries=3):
    """Transfer with balance check using optimistic locking"""
    for attempt in range(max_retries):
        try:
            # Watch the balance key
            pipe = r.pipeline()
            pipe.watch(f"account:{from_account}:balance")
            
            # Check balance
            balance = int(pipe.get(f"account:{from_account}:balance") or 0)
            
            if balance < amount:
                pipe.unwatch()
                return False, "Insufficient funds"
            
            # Start transaction
            pipe.multi()
            pipe.decrby(f"account:{from_account}:balance", amount)
            pipe.incrby(f"account:{to_account}:balance", amount)
            
            # Execute
            pipe.execute()
            return True, "Transfer successful"
            
        except redis.WatchError:
            # Key was modified, retry
            continue
    
    return False, "Max retries exceeded"

# Try transfer
success, message = transfer_with_check("alice", "bob", 100)
print(message)
```

**Retry pattern:**

```python
def atomic_update_with_retry(key, update_func, max_retries=10):
    """Generic retry pattern for WATCH transactions"""
    for attempt in range(max_retries):
        try:
            pipe = r.pipeline()
            pipe.watch(key)
            
            # Get current value
            current_value = pipe.get(key)
            
            # Calculate new value
            new_value = update_func(current_value)
            
            # Update atomically
            pipe.multi()
            pipe.set(key, new_value)
            pipe.execute()
            
            return new_value
            
        except redis.WatchError:
            continue
    
    raise Exception("Failed after max retries")

# Example: Increment counter with custom logic
def increment_with_max(current):
    val = int(current or 0)
    return min(val + 1, 100)  # Max value of 100

new_value = atomic_update_with_retry("counter", increment_with_max)
```

### Step 3: Complex operations with Redis Functions

Use Functions for complex multi-key logic.

**Lua function:**

```lua
#!lua name=atomic_ops

local function transfer_with_validation(keys, args)
    local from_key = keys[1]
    local to_key = keys[2]
    local amount = tonumber(args[1])
    local min_balance = tonumber(args[2] or 0)
    
    -- Get current balances
    local from_balance = tonumber(redis.call('GET', from_key) or 0)
    local to_balance = tonumber(redis.call('GET', to_key) or 0)
    
    -- Validate transfer
    if from_balance - amount < min_balance then
        return {ok = false, error = 'Insufficient funds'}
    end
    
    -- Execute transfer
    redis.call('DECRBY', from_key, amount)
    redis.call('INCRBY', to_key, amount)
    
    -- Record transaction
    local timestamp = redis.call('TIME')[1]
    redis.call('LPUSH', from_key .. ':history', 
        string.format('-%d at %s', amount, timestamp))
    redis.call('LPUSH', to_key .. ':history',
        string.format('+%d at %s', amount, timestamp))
    
    return {
        ok = true,
        from_balance = from_balance - amount,
        to_balance = to_balance + amount
    }
end

redis.register_function('transfer_with_validation', transfer_with_validation)
```

**Python usage:**

```python
# Load function
with open('atomic_ops.lua', 'r') as f:
    r.function_load(f.read())

# Execute transfer
result = r.fcall(
    'transfer_with_validation',
    2,
    'account:alice:balance',
    'account:bob:balance',
    '100',  # amount
    '50'    # minimum balance
)

if result[b'ok']:
    print(f"Transfer successful!")
    print(f"New balances: {result[b'from_balance']}, {result[b'to_balance']}")
else:
    print(f"Transfer failed: {result[b'error']}")
```

### Step 4: Atomic operations across data types

Combine different data types in atomic operations.

**Python example:**

```python
def create_order_atomic(order_id, user_id, product_id, quantity, price):
    """Create order with inventory check and user update"""
    pipe = r.pipeline()
    
    # 1. Decrement inventory (sorted set)
    pipe.zincrby("inventory:stock", -quantity, product_id)
    
    # 2. Create order (hash)
    pipe.hset(f"order:{order_id}", mapping={
        "user_id": user_id,
        "product_id": product_id,
        "quantity": quantity,
        "total": price * quantity,
        "status": "pending"
    })
    
    # 3. Add to user's orders (set)
    pipe.sadd(f"user:{user_id}:orders", order_id)
    
    # 4. Update user stats (hash)
    pipe.hincrby(f"user:{user_id}:stats", "total_orders", 1)
    pipe.hincrbyfloat(f"user:{user_id}:stats", "total_spent", price * quantity)
    
    # 5. Add to processing queue (list)
    pipe.lpush("orders:pending", order_id)
    
    # Execute all atomically
    results = pipe.execute()
    
    return order_id

# Create order
order_id = create_order_atomic("order:123", "user:456", "product:789", 2, 29.99)
print(f"Order created: {order_id}")
```

### Step 5: Conditional multi-key updates

Implement complex conditional logic with Functions.

**Lua function:**

```lua
#!lua name=conditional_ops

local function update_if_conditions_met(keys, args)
    local conditions = cjson.decode(args[1])
    local updates = cjson.decode(args[2])
    
    -- Check all conditions
    for i, condition in ipairs(conditions) do
        local key = keys[condition.key_index]
        local current = redis.call('GET', key)
        
        if condition.op == 'gt' then
            if not (tonumber(current) > tonumber(condition.value)) then
                return {ok = false, failed_condition = i}
            end
        elseif condition.op == 'eq' then
            if current ~= condition.value then
                return {ok = false, failed_condition = i}
            end
        end
    end
    
    -- All conditions met, apply updates
    for i, update in ipairs(updates) do
        local key = keys[update.key_index]
        
        if update.op == 'set' then
            redis.call('SET', key, update.value)
        elseif update.op == 'incr' then
            redis.call('INCRBY', key, update.value)
        elseif update.op == 'hset' then
            redis.call('HSET', key, update.field, update.value)
        end
    end
    
    return {ok = true, updates_applied = #updates}
end

redis.register_function('update_if_conditions_met', update_if_conditions_met)
```

### Step 6: Batch atomic operations

Process multiple atomic operations efficiently.

**Python example:**

```python
def batch_transfer(transfers):
    """Execute multiple transfers atomically"""
    pipe = r.pipeline()
    
    for transfer in transfers:
        from_acc = transfer['from']
        to_acc = transfer['to']
        amount = transfer['amount']
        
        pipe.decrby(f"account:{from_acc}:balance", amount)
        pipe.incrby(f"account:{to_acc}:balance", amount)
    
    results = pipe.execute()
    return len(transfers)

# Batch transfers
transfers = [
    {"from": "alice", "to": "bob", "amount": 50},
    {"from": "bob", "to": "charlie", "amount": 30},
    {"from": "charlie", "to": "alice", "amount": 20}
]

count = batch_transfer(transfers)
print(f"Executed {count} transfers atomically")
```

## Redis Cloud setup

When deploying atomic operations to Redis Cloud:

1. **Use pipelines** - Batch commands for better performance
2. **Prefer Functions** - For complex logic, use server-side execution
3. **Handle retries** - Implement retry logic for WATCH failures
4. **Monitor performance** - Track transaction execution time
5. **Test thoroughly** - Verify atomicity under concurrent load

Example configuration:
- **Pipeline size**: 100-1000 commands typical
- **WATCH retries**: 3-10 attempts
- **Functions**: Load once on startup
- **Timeout**: Set appropriate command timeouts

## Common pitfalls

1. **Not using pipeline** - Multiple round trips instead of one
2. **Forgetting UNWATCH** - Leaves keys watched after error
3. **Too many WATCH keys** - Increases contention
4. **Not handling WatchError** - Missing retry logic
5. **Complex logic in client** - Use Functions instead

## Related patterns

- [Workflows with Functions]({{< relref "/develop/patterns/messaging/workflows-with-functions" >}}) - State machines
- [Exactly-once processing]({{< relref "/develop/patterns/ingestion/exactly-once-processing" >}}) - Idempotency
- [JSON documents]({{< relref "/develop/patterns/data-modeling/json-documents" >}}) - Document updates

## More information

- [Transactions documentation]({{< relref "/develop/using-commands/transactions" >}})
- [Redis Functions]({{< relref "/develop/programmability/functions-intro" >}})
- [MULTI command]({{< relref "/commands/multi" >}})
- [EXEC command]({{< relref "/commands/exec" >}})
- [WATCH command]({{< relref "/commands/watch" >}})
- [Pipelining]({{< relref "/develop/using-commands/pipelining" >}})

