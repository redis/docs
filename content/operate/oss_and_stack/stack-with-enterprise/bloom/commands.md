---
Title: Probabilistic data structure commands
alwaysopen: false
categories:
- docs
- operate
- stack
description: Lists probabilistic data structure commands and provides links to the
  command reference pages.
linkTitle: Commands
toc: 'true'
weight: 25
---

The following tables list probabilistic data structure commands. See the command links for more information about each command's syntax, arguments, and examples.

## Bloom filter commands

| Command | Redis<br />Enterprise | Redis<br />Cloud | Description |
|:--------|:----------------------|:-----------------|:------|
| [BF.ADD]({{< baseurl >}}/commands/bf.add) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds an item to the filter. |
| [BF.EXISTS]({{< baseurl >}}/commands/bf.exists) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Checks if an item exists in the filter. |
| [BF.INFO]({{< baseurl >}}/commands/bf.info) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns information about a Bloom filter. |
| [BF.INSERT]({{< baseurl >}}/commands/bf.insert) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds multiple items to a filter. If the key does not exist, it creates a new filter. |
| [BF.LOADCHUNK]({{< baseurl >}}/commands/bf.loadchunk) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Restores a Bloom filter previously saved with [BF.SCANDUMP]({{< baseurl >}}/commands/bf.scandump). |
| [BF.MADD]({{< baseurl >}}/commands/bf.madd) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds multiple items to the filter. |
| [BF.MEXISTS]({{< baseurl >}}/commands/bf.mexists) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | For multiple items, checks if each item exists in the filter. |
| [BF.RESERVE]({{< baseurl >}}/commands/bf.reserve) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Creates a Bloom filter. Sets the false positive rate and capacity. |
| [BF.SCANDUMP]({{< baseurl >}}/commands/bf.scandump) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Starts an incremental save of a Bloom filter. |

## Cuckoo filter commands

| Command | Redis<br />Enterprise | Redis<br />Cloud | Description |
|:--------|:----------------------|:-----------------|:------|
| [CF.ADD]({{< baseurl >}}/commands/cf.add) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds an item to a filter. |
| [CF.ADDNX]({{< baseurl >}}/commands/cf.addnx) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds an item to a filter only if the item does not already exist. |
| [CF.COUNT]({{< baseurl >}}/commands/cf.count) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns the probable number of times an item occurs in the filter. |
| [CF.DEL]({{< baseurl >}}/commands/cf.del) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Removes one instance of an item from the filter. |
| [CF.EXISTS]({{< baseurl >}}/commands/cf.exists) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Checks if an item exists in the filter. |
| [CF.INFO]({{< baseurl >}}/commands/cf.info) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns information about a cuckoo filter. |
| [CF.INSERT]({{< baseurl >}}/commands/cf.insert) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds multiple items to a filter. Optionally sets the capacity if the filter does not already exist. |
| [CF.INSERTNX]({{< baseurl >}}/commands/cf.insertnx) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds multiple items to a filter if they do not already exist. Optionally sets the capacity if the filter does not already exist. |
| [CF.LOADCHUNK]({{< baseurl >}}/commands/cf.loadchunk) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Restores a cuckoo filter previously saved with [CF.SCANDUMP]({{< baseurl >}}/commands/cf.scandump). |
| [CF.MEXISTS]({{< baseurl >}}/commands/cf.mexists) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | For multiple items, checks if each item exists in the filter. |
| [CF.RESERVE]({{< baseurl >}}/commands/cf.reserve) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Creates a cuckoo filter and sets its capacity. |
| [CF.SCANDUMP]({{< baseurl >}}/commands/cf.scandump) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Starts an incremental save of a cuckoo filter. |

## Count-min sketch commands

| Command | Redis<br />Enterprise | Redis<br />Cloud | Description |
|:--------|:----------------------|:-----------------|:------|
| [CMS.INCRBY]({{< baseurl >}}/commands/cms.incrby) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Increases item counts. |
| [CMS.INFO]({{< baseurl >}}/commands/cms.info) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns width, depth, and total count of the sketch. |
| [CMS.INITBYDIM]({{< baseurl >}}/commands/cms.initbydim) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Initializes a count-min sketch to the specified dimensions (width and depth). |
| [CMS.INITBYPROB]({{< baseurl >}}/commands/cms.initbyprob) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Initializes a count-min sketch to allow the specified overestimation percent for the item count and the probability of overestimation. |
| [CMS.MERGE]({{< baseurl >}}/commands/cms.merge) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Merges several sketches into one sketch. |
| [CMS.QUERY]({{< baseurl >}}/commands/cms.query) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns the count for one or more items in a sketch. |

## Top-k commands

| Command | Redis<br />Enterprise | Redis<br />Cloud | Description |
|:--------|:----------------------|:-----------------|:------|
| [TOPK.ADD]({{< baseurl >}}/commands/topk.add) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds an item to the data structure. |
| [TOPK.COUNT]({{< baseurl >}}/commands/topk.count) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns probable item counts. |
| [TOPK.INCRBY]({{< baseurl >}}/commands/topk.incrby) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Increases the score of an item by the specified number. |
| [TOPK.INFO]({{< baseurl >}}/commands/topk.info) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns the number of required items (k), width, depth, and decay values. |
| [TOPK.LIST]({{< baseurl >}}/commands/topk.list) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns the keys of items in the top-k list. Optionally returns their item counts. |
| [TOPK.QUERY]({{< baseurl >}}/commands/topk.query) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Checks whether an item is one of top-k items. |
| [TOPK.RESERVE]({{< baseurl >}}/commands/topk.reserve) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Initializes a top-k with the specified number of top occurring items to keep, width, depth, and decay. |

## T-digest sketch commands

| Command | Redis<br />Enterprise | Redis<br />Cloud | Description |
|:--------|:----------------------|:-----------------|:------|
| [TDIGEST.ADD]({{< baseurl >}}/commands/tdigest.add) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds one or more samples to a t-digest sketch. |
| [TDIGEST.CDF]({{< baseurl >}}/commands/tdigest.cdf) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Estimates the fraction of all observations which are less than or equal to the specified value. |
| [TDIGEST.CREATE]({{< baseurl >}}/commands/tdigest.create) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Allocates memory and initializes a t-digest sketch. |
| [TDIGEST.INFO]({{< baseurl >}}/commands/tdigest.info) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns information about the t-digest sketch. |
| [TDIGEST.MAX]({{< baseurl >}}/commands/tdigest.max) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns the maximum value from the sketch. |
| [TDIGEST.MERGE]({{< baseurl >}}/commands/tdigest.merge) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Copies values from one sketch to another. |
| [TDIGEST.MIN]({{< baseurl >}}/commands/tdigest.min) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns the minimum value from the sketch. |
| [TDIGEST.QUANTILE]({{< baseurl >}}/commands/tdigest.quantile) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Estimates one or more cutoffs. |
| [TDIGEST.RESET]({{< baseurl >}}/commands/tdigest.reset) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Resets the sketch and reinitializes it. |
| [TDIGEST.TRIMMED_MEAN]({{< baseurl >}}/commands/tdigest.trimmed_mean) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Estimates the mean value from the sketch, excluding values outside the specified range. |
