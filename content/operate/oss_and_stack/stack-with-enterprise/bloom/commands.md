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

| Command | Redis<br />Software | Redis<br />Cloud | Description |
|:--------|:----------------------|:-----------------|:------|
| [BF.ADD](/content/commands/bf.add.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds an item to the filter. |
| [BF.EXISTS](/content/commands/bf.exists.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Checks if an item exists in the filter. |
| [BF.INFO](/content/commands/bf.info.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns information about a Bloom filter. |
| [BF.INSERT](/content/commands/bf.insert.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds multiple items to a filter. If the key does not exist, it creates a new filter. |
| [BF.LOADCHUNK](/content/commands/bf.loadchunk.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Restores a Bloom filter previously saved with [BF.SCANDUMP](/content/commands/bf.scandump.md). |
| [BF.MADD](/content/commands/bf.madd.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds multiple items to the filter. |
| [BF.MEXISTS](/content/commands/bf.mexists.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | For multiple items, checks if each item exists in the filter. |
| [BF.RESERVE](/content/commands/bf.reserve.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Creates a Bloom filter. Sets the false positive rate and capacity. |
| [BF.SCANDUMP](/content/commands/bf.scandump.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Starts an incremental save of a Bloom filter. |

## Cuckoo filter commands

| Command | Redis<br />Software | Redis<br />Cloud | Description |
|:--------|:----------------------|:-----------------|:------|
| [CF.ADD](/content/commands/cf.add.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds an item to a filter. |
| [CF.ADDNX](/content/commands/cf.addnx.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds an item to a filter only if the item does not already exist. |
| [CF.COUNT](/content/commands/cf.count.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns the probable number of times an item occurs in the filter. |
| [CF.DEL](/content/commands/cf.del.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Removes one instance of an item from the filter. |
| [CF.EXISTS](/content/commands/cf.exists.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Checks if an item exists in the filter. |
| [CF.INFO](/content/commands/cf.info.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns information about a cuckoo filter. |
| [CF.INSERT](/content/commands/cf.insert.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds multiple items to a filter. Optionally sets the capacity if the filter does not already exist. |
| [CF.INSERTNX](/content/commands/cf.insertnx.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds multiple items to a filter if they do not already exist. Optionally sets the capacity if the filter does not already exist. |
| [CF.LOADCHUNK](/content/commands/cf.loadchunk.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Restores a cuckoo filter previously saved with [CF.SCANDUMP](/content/commands/cf.scandump.md). |
| [CF.MEXISTS](/content/commands/cf.mexists.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | For multiple items, checks if each item exists in the filter. |
| [CF.RESERVE](/content/commands/cf.reserve.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Creates a cuckoo filter and sets its capacity. |
| [CF.SCANDUMP](/content/commands/cf.scandump.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Starts an incremental save of a cuckoo filter. |

## Count-min sketch commands

| Command | Redis<br />Software | Redis<br />Cloud | Description |
|:--------|:----------------------|:-----------------|:------|
| [CMS.INCRBY](/content/commands/cms.incrby.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Increases item counts. |
| [CMS.INFO](/content/commands/cms.info.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns width, depth, and total count of the sketch. |
| [CMS.INITBYDIM](/content/commands/cms.initbydim.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Initializes a count-min sketch to the specified dimensions (width and depth). |
| [CMS.INITBYPROB](/content/commands/cms.initbyprob.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Initializes a count-min sketch to allow the specified overestimation percent for the item count and the probability of overestimation. |
| [CMS.MERGE](/content/commands/cms.merge.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Merges several sketches into one sketch. |
| [CMS.QUERY](/content/commands/cms.query.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns the count for one or more items in a sketch. |

## Top-k commands

| Command | Redis<br />Software | Redis<br />Cloud | Description |
|:--------|:----------------------|:-----------------|:------|
| [TOPK.ADD](/content/commands/topk.add.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds an item to the data structure. |
| [TOPK.COUNT](/content/commands/topk.count.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns probable item counts. |
| [TOPK.INCRBY](/content/commands/topk.incrby.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Increases the score of an item by the specified number. |
| [TOPK.INFO](/content/commands/topk.info.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns the number of required items (k), width, depth, and decay values. |
| [TOPK.LIST](/content/commands/topk.list.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns the keys of items in the top-k list. Optionally returns their item counts. |
| [TOPK.QUERY](/content/commands/topk.query.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Checks whether an item is one of top-k items. |
| [TOPK.RESERVE](/content/commands/topk.reserve.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Initializes a top-k with the specified number of top occurring items to keep, width, depth, and decay. |

## T-digest sketch commands

| Command | Redis<br />Software | Redis<br />Cloud | Description |
|:--------|:----------------------|:-----------------|:------|
| [TDIGEST.ADD](/content/commands/tdigest.add.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Adds one or more samples to a t-digest sketch. |
| [TDIGEST.CDF](/content/commands/tdigest.cdf.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Estimates the fraction of all observations which are less than or equal to the specified value. |
| [TDIGEST.CREATE](/content/commands/tdigest.create.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Allocates memory and initializes a t-digest sketch. |
| [TDIGEST.INFO](/content/commands/tdigest.info.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns information about the t-digest sketch. |
| [TDIGEST.MAX](/content/commands/tdigest.max.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns the maximum value from the sketch. |
| [TDIGEST.MERGE](/content/commands/tdigest.merge.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Copies values from one sketch to another. |
| [TDIGEST.MIN](/content/commands/tdigest.min.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Returns the minimum value from the sketch. |
| [TDIGEST.QUANTILE](/content/commands/tdigest.quantile.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Estimates one or more cutoffs. |
| [TDIGEST.RESET](/content/commands/tdigest.reset.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Resets the sketch and reinitializes it. |
| [TDIGEST.TRIMMED_MEAN](/content/commands/tdigest.trimmed_mean.md) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> | Estimates the mean value from the sketch, excluding values outside the specified range. |
