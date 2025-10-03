---
Title: Supported Cloud providers and regions
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
linktitle: Supported regions
weight: 90
---

Your choice of cloud provider and region may affect latency between your application and your database, and may affect what connectivity options are available for your database.

Redis Cloud supports databases on the following cloud providers:
- [Amazon Web Services (AWS)](#amazon-web-services)
- [Google Cloud](#google-cloud)
- [Microsoft Azure](#microsoft-azure)

## Amazon Web Services

Redis Cloud supports databases in the following Amazon Web Services (AWS) regions.

Redis Cloud Pro databases on AWS support [VPC Peering]({{< relref "/operate/rc/security/network-security/connect-private-endpoint/vpc-peering#aws-vpc-peering" >}}) and [Transit Gateway]({{< relref "/operate/rc/security/network-security/connect-private-endpoint/aws-transit-gateway" >}}).

{{< multitabs id="aws-regions"
    tab1="Americas"
    tab2="Europe"
    tab3="Asia Pacific"
    tab4="Middle East and Africa" >}}

| Region ID      | Location                 | Redis Cloud Pro | Redis Cloud Essentials |
|:---------------|:-------------------------|:----------------|:-----------------------|
| `ca-central-1` | Montreal, Canada         | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `mx-central-1` | Central Mexico | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `sa-east-1`    | Sao Paulo, Brazil        | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `us-east-1`    | Northern Virginia, USA   | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `us-east-2`    | Ohio, USA                | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `us-west-1`    | Northern California, USA | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `us-west-2`    | Oregon, USA              | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

-tab-sep-

| Region ID | Location | Redis Cloud Pro | Redis Cloud Essentials |
|---|---|---|---|
| `eu-central-1` | Frankfurt, Germany | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `eu-central-2` | Zurich, Switzerland | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `eu-north-1` | Stockholm, Sweden | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `eu-south-1` | Milan, Italy | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `eu-south-2` | Spain | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `eu-west-1` | Ireland | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `eu-west-2` | London, UK | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `eu-west-3` | Paris, France | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

-tab-sep-

| Region ID        | Location             | Redis Cloud Pro | Redis Cloud Essentials |
|:-----------------|:---------------------|:----------------|:-----------------------|
| `ap-east-1`      | Hong Kong, China     | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `ap-northeast-1` | Tokyo, Japan         | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `ap-northeast-2` | Seoul, South Korea   | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `ap-northeast-3` | Osaka, Japan         | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `ap-south-1`     | Mumbai, India        | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `ap-south-2`     | Hyderabad, India     | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `ap-southeast-1` | Singapore            | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `ap-southeast-2` | Sydney, Australia    | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `ap-southeast-3` | Jakarta, Indonesia   | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `ap-southeast-4` | Melbourne, Australia | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `ap-southeast-5` | Malaysia | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `ap-southeast-7` | Thailand | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |

-tab-sep-

| Region ID      | Location                | Redis Cloud Pro | Redis Cloud Essentials |
|:---------------|:------------------------|:----------------|:-----------------------|
| `af-south-1`   | Cape Town, South Africa | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `il-central-1` | Tel Aviv, Israel        | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `me-central-1` | UAE                     | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `me-south-1`   | Bahrain                 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

{{< /multitabs >}}

## Google Cloud

Redis Cloud supports databases in the following Google Cloud regions.

Redis Cloud Pro databases on Google Cloud support [VPC Peering]({{< relref "/operate/rc/security/network-security/connect-private-endpoint/vpc-peering#gcp-vpc-peering" >}}) and [Private Service Connect]({{< relref "/operate/rc/security/network-security/connect-private-endpoint/private-service-connect" >}}).

{{< multitabs id="gcp-regions"
    tab1="Americas"
    tab2="Europe"
    tab3="Asia Pacific"
    tab4="Middle East and Africa" >}}

| Region ID                 | Location            | Redis Cloud Pro | Redis Cloud Essentials |
|:--------------------------|:--------------------|:----------------|:-----------------------|
| `northamerica-northeast1` | Montreal, Canada    | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `northamerica-northeast2` | Toronto, Canada     | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `southamerica-east1`      | Sao Paulo, Brazil   | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `southamerica-west1`      | Santiago, Chile     | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `us-central1`             | Iowa, USA           | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `us-east1`                | South Carolina, USA | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `us-east4`                | Virginia, USA       | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `us-east5`                | Columbus, USA       | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `us-south1`               | Dallas, USA         | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `us-west1`                | Oregon, USA         | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `us-west2`                | Los Angeles, USA    | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `us-west3`                | Salt Lake City, USA | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `us-west4`                | Las Vegas, USA      | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |

-tab-sep-

| Region ID           | Location            | Redis Cloud Pro | Redis Cloud Essentials |
|:--------------------|:--------------------|:----------------|:-----------------------|
| `europe-central2`   | Warsaw, Poland      | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `europe-north1`     | Finland             | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `europe-southwest1` | Madrid, Spain       | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `europe-west1`      | Belgium             | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `europe-west2`      | London, UK          | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `europe-west3`      | Frankfurt, Germany  | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `europe-west4`      | Netherlands         | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `europe-west6`      | Zurich, Switzerland | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `europe-west8`      | Milan, Italy        | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `europe-west9`      | Paris, France       | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `europe-west10`     | Berlin, Germany     | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `europe-west12`     | Turin, Italy        | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |

-tab-sep-

| Region ID              | Location             | Redis Cloud Pro | Redis Cloud Essentials |
|:-----------------------|:---------------------|:----------------|:-----------------------|
| `asia-east1`           | Taiwan               | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `asia-east2`           | Hong Kong, China     | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `asia-northeast1`      | Tokyo, Japan         | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `asia-northeast2`      | Osaka, Japan         | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `asia-northeast3`      | Seoul, South Korea   | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `asia-south1`          | Mumbai, India        | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `asia-south2`          | Delhi, India         | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `asia-southeast1`      | Singapore            | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `asia-southeast2`      | Jakarta, Indonesia   | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `australia-southeast1` | Sydney, Australia    | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| `australia-southeast2` | Melbourne, Australia | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |

-tab-sep-

| Region ID       | Location                   | Redis Cloud Pro | Redis Cloud Essentials |
|:----------------|:---------------------------|:----------------|:-----------------------|
| `africa-south1` | Johannesburg, South Africa | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `me-central1`   | Doha, Qatar                | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `me-central2`   | Dammam, Saudi Arabia       | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |
| `me-west1`      | Tel Aviv, Israel           | <span title="Supported">&#x2705;</span> | <span title="Not supported">&#x274c;</span> |

{{< /multitabs >}}

## Microsoft Azure

Redis Cloud Essentials is available on the following Microsoft Azure regions:

| Region ID | Location        |
|:----------|:----------------|
| `east-us` | Virginia, USA   |
| `west-us` | California, USA |

{{< note >}}
Redis Cloud Pro is available on Azure through Azure Cache for Redis Enterprise. See [Azure Cache for Redis pricing](https://azure.microsoft.com/en-us/pricing/details/cache/) to view the list of Azure regions that support Azure Cache for Redis Enterprise.
{{< /note >}}


