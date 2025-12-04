---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- arguments:
  - arguments:
    - display_text: task-id
      name: task-id
      type: string
    - arguments:
      - display_text: start-slot
        name: start-slot
        type: integer
      - display_text: end-slot
        name: end-slot
        type: integer
      multiple: true
      name: slot-range
      type: block
    name: sync
    token: SYNC
    type: block
  - display_text: task-id
    name: task-id
    token: RDBCHANNEL
    type: string
  - display_text: snapshot-eof
    name: snapshot-eof
    token: SNAPSHOT-EOF
    type: pure-token
  - display_text: stream-eof
    name: stream-eof
    token: STREAM-EOF
    type: pure-token
  - arguments:
    - display_text: state
      name: state
      type: string
    - display_text: offset
      name: offset
      type: integer
    name: ack
    token: ACK
    type: block
  - display_text: error
    name: error
    token: FAIL
    type: string
  - arguments:
    - display_text: option
      multiple: true
      name: option
      type: string
    - display_text: value
      multiple: true
      name: value
      type: string
    name: conf
    token: CONF
    type: block
  name: subcommand
  type: oneof
arity: -3
command_flags:
- admin
- stale
- no_async_loading
complexity: O(1)
group: cluster
hints:
- nondeterministic_output
since: 8.4.0
summary: Internal command for atomic slot migration protocol between cluster nodes.
syntax_fmt: "CLUSTER SYNCSLOTS <SYNC\_task-id start-slot end-slot [start-slot\n  end-slot\
  \ ...] | RDBCHANNEL\_task-id | SNAPSHOT-EOF | STREAM-EOF |\n  ACK\_state offset\
  \ | FAIL\_error | CONF\_option [option ...] value\n  [value ...]>"
syntax_str: ''
---
