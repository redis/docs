---
Title: RDI ports and protocols
aliases: /integrate/redis-data-integration/ingest/reference/ports/
alwaysopen: false
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Network ports and protocols used by RDI
group: di
linkTitle: Ports and protocols
summary:
  Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 40
---

The table below shows the ports and protocols that RDI uses for its
services:

| Name                | Type       | Port | Protocol |
| :------------------ | :--------- | :--- | :------- |
| prometheus-service  | Service    | 9092 | TCP      |
| prometheus-service  | Ingress    | 9092 | TCP/HTTP |
| rdi-api             | Service    | 8080 | TCP      |
| rdi-api             | Deployment | 8080 | TCP      |
| rdi-api             | Ingress    | 8080 | TCP/HTTP |
| rdi-metric-exporter | Service    | 9121 | TCP      |
| rdi-metric-exporter | Ingress    | 9121 | TCP/HTTP |
| rdi-operator        | Deployment | 8080 | TCP      |
| vm-dis-reloader     | Deployment | 9090 | TCP      |
