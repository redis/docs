In the example below, database writes are concurrent at the points in
time t1 and t2 and happen before a sync can communicate the changes.
However, writes at times t4 and t6 are not concurrent as a sync happened
in between.

|  **Time** | **CRDB Instance1** | **CRDB Instance2** |
|  ------: | :------: | :------: |
|  t1 | SET key1 "a" |  |
|  t2 |  | SET key1 "b" |
|  t3 | — Sync — | — Sync — |
|  t4 | SET key1 "c" |  |
|  t5 | — Sync — | — Sync — |
|  t6 |  | SET key1 "d" |