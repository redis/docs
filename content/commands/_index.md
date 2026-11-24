---
title: Commands
linkTitle: Commands
description: Redis command reference, filterable by group and by Redis Software and Redis Cloud compatibility.
hidden: true
aliases:
- /operate/rs/references/compatibility/commands/cluster/
- /operate/rs/references/compatibility/commands/connection/
- /operate/rs/references/compatibility/commands/data-types/
- /operate/rs/references/compatibility/commands/generic/
- /operate/rs/references/compatibility/commands/pub-sub/
- /operate/rs/references/compatibility/commands/scripting/
- /operate/rs/references/compatibility/commands/server/
- /operate/rs/references/compatibility/commands/transactions/
- /operate/oss_and_stack/stack-with-enterprise/bloom/commands/
- /operate/oss_and_stack/stack-with-enterprise/json/commands/
- /operate/oss_and_stack/stack-with-enterprise/search/commands/
- /operate/oss_and_stack/stack-with-enterprise/timeseries/commands/
# The filtered view each alias above lands on. Hugo aliases can't carry a query
# string, so layouts/alias.html reads this list and redirects with the query;
# readers without JavaScript land on the unfiltered list. Every alias needs an
# entry here or the build warns; an empty query lands on the unfiltered list.
alias_query:
- from: /operate/rs/references/compatibility/commands/cluster
  query: group=cluster
- from: /operate/rs/references/compatibility/commands/connection
  query: group=connection
- from: /operate/rs/references/compatibility/commands/data-types
  query: group=array,bitmap,geo,hash,hyperloglog,list,set,sorted-set,stream,string,vector_set
- from: /operate/rs/references/compatibility/commands/generic
  query: group=generic
- from: /operate/rs/references/compatibility/commands/pub-sub
  query: group=pubsub
- from: /operate/rs/references/compatibility/commands/scripting
  query: group=scripting
- from: /operate/rs/references/compatibility/commands/server
  query: group=server
- from: /operate/rs/references/compatibility/commands/transactions
  query: group=transactions
- from: /operate/oss_and_stack/stack-with-enterprise/bloom/commands
  query: group=bf,cf,cms,topk,tdigest
- from: /operate/oss_and_stack/stack-with-enterprise/json/commands
  query: group=json
- from: /operate/oss_and_stack/stack-with-enterprise/search/commands
  query: group=search,suggestion
- from: /operate/oss_and_stack/stack-with-enterprise/timeseries/commands
  query: group=timeseries
---
