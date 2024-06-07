---
Title: redis-di
linkTitle: redis-di
description: A command line tool to manage & configure Redis Data Integration
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

A command line tool to manage & configure Redis Data Integration

## Usage

```
Usage: redis-di [OPTIONS] COMMAND [ARGS]...
```

## Options

- `version`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--version`

  Show the version and exit.

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di [OPTIONS] COMMAND [ARGS]...

  A command line tool to manage & configure Redis Data Integration

Options:
  --version  Show the version and exit.
  --help     Show this message and exit.

Commands:
  add-context           Adds a new context
  config-rdi            Configures RDI db connection credentials
  delete                Deletes RDI database permanently
  delete-all-contexts   Deletes all contexts
  delete-context        Deletes a context
  deploy                Deploys the RDI configurations including target
  describe-job          Describes a transformation engine's job
  dump-support-package  Dumps RDI support package
  get-rejected          Returns all the stored rejected entries
  install               Installs RDI
  list-contexts         Lists all saved contexts
  list-jobs             Lists transformation engine's jobs
  monitor               Monitors RDI by collecting metrics and exporting...
  reset                 Resets the pipeline into initial full sync mode
  scaffold              Generates configuration files for RDI
  set-context           Sets a context to be the active one
  set-secret            Creates a secret of a specified key
  start                 Starts the pipeline
  status                Displays the status of the pipeline end to end
  stop                  Stops the pipeline
  trace                 Starts a trace session for troubleshooting data...
```
