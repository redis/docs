---
Title: AWS Route53 DNS management
alwaysopen: false
categories:
- docs
- operate
- rs
description: How to configure AWS Route 53 DNS
linkTitle: AWS Route 53 DNS
weight: $weight
url: '/operate/rs/7.8/networking/configuring-aws-route53-dns-redis-enterprise/'
---

Redis Enterprise Software uses DNS to achieve high availability and fail-over regardless of where it is installed.


## What is AWS Route 53?

Route 53 is a scalable DNS service by Amazon Web Service (AWS). It routes user traffic to AWS resources and external sites, offering DNS health checks, traffic management, and failover capabilities. It's integral for high-availability architectures and also provides domain registration services.

## Create a hosted zone

Creating a hosted zone in Amazon Route 53 is a foundational step in managing your domain's DNS settings.

A hosted zone functions as a container for the DNS records of a specific domain. To create one, you first need to:

1. Log into the AWS Management Console
2. Navigate to the Route 53 dashboard
3. Select "Create Hosted Zone"
4. Enter your domain name, and choose public hosted zone

The hosted zone provides you with a set of Name Server (NS) records, which you will need to update at your domain registrar. This process effectively delegates the DNS management of your domain to Route 53, allowing you to create, update, and manage DNS records for your domain within the AWS ecosystem.

{{< image filename="/images/rs/00-CreateHostedZone-en.png" >}}

Once created, it will appear in the list of **Hosted zones**

{{< image filename="/images/rs/03-HostedZoneSelection-en.png" >}}

## Create glue records

A **glue record** is a type of DNS record that helps prevent circular dependencies by providing the IP addresses of your nameservers. To create glue records in Route 53, you first need to set up a hosted zone for your domain. You will create a separate A record for each node in your Redis Enterprise cluster. The **Record name** will be a subdomain definition of the NS record you will define and the **value** should be set to the IP address of the node in your cluster.

{{< image filename="/images/rs/05-NS1Configuration-en.png" >}}

Once complete, it should look something like this

{{< image filename="/images/rs/06-NSList-en.png" >}}


## Create nameserver record

When you create a new hosted zone in Route 53 for your domain, a set of NS records is automatically generated. These records list the nameservers assigned by Route 53 to your domain.

You will need to create a new NS record which will point to the glue records created in the previous step.

{{<note>}}
It is important to make sure that the **Record Name** of the NS record equals the FQDN (Fully Qualified Domain Name) of your Redis Enterprise cluster. If not, DNS resolution will not function correctly.
{{</note>}}

{{< image filename="/images/rs/07-NSRecord-en.png" >}}


## Validate

Once all steps are completed, the configuration should look similar to this

{{< image filename="/images/rs/08-FinalConfig-en.png" >}}

You can test and validate your settings by using the ```dig``` command.

```sh
dig ns test.demo-rlec.redislabs.com

; <<>> DiG 9.9.5-9+deb8u9-Debian <<>> ns test.demo-rlec.redislabs.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 25061
;; flags: qr rd ra; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;test.demo-rlec.redislabs.com. IN NS

;; ANSWER SECTION:
test.demo-rlec.redislabs.com. 3409 IN NS node2.test.demo-rlec.redislabs.com.
test.demo-rlec.redislabs.com. 3409 IN NS node1.test.demo-rlec.redislabs.com.
test.demo-rlec.redislabs.com. 3409 IN NS node3.test.demo-rlec.redislabs.com.

;; Query time: 31 msec
;; SERVER: 192.168.1.254#53(192.168.1.254)
;; WHEN: Tue Feb 14 16:49:13 CET 2017
;; MSG SIZE  rcvd: 120
```

You can see that the name are given a prefix of `ns-`. This answer does not come
from *Route53* but from the cluster nameservers themselves.

