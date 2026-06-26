---
Title: State machine object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents a state machine.
linkTitle: state-machine
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/state-machine/'
---

A state machine object tracks the status of database actions.

A state machine contains the following attributes:

| Name        | Type/Value | Description |
|-------------|------------|-------------|
| action_uid  | string     | A globally unique identifier of the action |
| object_name | string     | Name of the object being manipulated by the state machine |
| status      | pending    | Requested state machine has not started |
|             | active     | State machine is currently running |
|             | completed  | Operation complete |
|             | failed     | Operation or state machine failed |
| name        | string     | Name of the running (or failed) state machine |
| state       | string     | Current state within the state machine, when known |
| error       | string     | A descriptive error string for failed state machine, when known |
