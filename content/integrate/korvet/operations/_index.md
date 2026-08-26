---
Title: Operations
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Deploy, monitor, and operate Korvet in production.
hideListLinks: false
linkTitle: Operations
weight: 50
---

This section covers deploying, monitoring, and operating Korvet in production.

## In This Section

- [Deployment]({{< relref "/integrate/korvet/operations/deployment" >}}) - Deploy Korvet in production
- [Production Tuning]({{< relref "/integrate/korvet/operations/production-tuning" >}}) - Size the storage connection pool and tune for produce load
- [Kubernetes]({{< relref "/integrate/korvet/operations/kubernetes" >}}) - Run Korvet on Kubernetes
- [Authentication]({{< relref "/integrate/korvet/operations/authentication" >}}) - Secure access with SASL authentication
- [Monitoring]({{< relref "/integrate/korvet/operations/monitoring" >}}) - Monitor health and performance
- [Logging]({{< relref "/integrate/korvet/operations/logging" >}}) - Configure logging and troubleshooting
- [Admin API]({{< relref "/integrate/korvet/operations/admin-api" >}}) - Manage topics, retention, and the cluster
- [Benchmarks]({{< relref "/integrate/korvet/operations/benchmarks" >}}) - Performance benchmarks and how to run them
- [Troubleshooting]({{< relref "/integrate/korvet/operations/troubleshooting" >}}) - Common issues and solutions

## Production Checklist

Before deploying to production:

- [ ] Configure external Redis instance
- [ ] Enable SASL authentication
- [ ] Enable TLS for Kafka protocol
- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation
- [ ] Plan capacity and scaling
- [ ] Test failover scenarios
- [ ] Document runbook procedures
