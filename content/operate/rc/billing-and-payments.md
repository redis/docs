---
Title: Billing & payments
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes how to view billing transactions and manage payment methods
  for Redis Cloud subscriptions.
linkTitle: Billing & payments
weight: 39
---

The **Billing & Payments** screen:

- Shows recent transactions for your account
- Helps you manage your payment methods
- Applies coupon credits to your account

{{<image filename="images/rc/billing-billing-history-tab.png" alt="The Billing & Payments screen shows billing transactions and manage payment methods." >}}

The following tabs are available:

- The **Billing History** tab displays recent charges and payments.  Each transaction includes the following details:

    | Detail | Description |
    |:-------|:------------|
    | Date   | Date the transaction was recorded |
    | Description | Description of the transaction |
    | Reference | Reference number |
    | Amount    | Transaction amount |

    Billing details may vary between regions.

    You can [download invoices](#download-invoice) on this tab.

    A **Pay Now** button appears in selected regions.

    {{<image filename="images/rc/billing-payments-pay-now.png" width="100px" alt="Use the Pay Now button to Pay your invoice in selected regions." >}} 
    
    Select this button to pay your invoice.

- The **Payment Methods** tab lists your current payment methods.  You can add a new payment method, associate different payment methods with specific subscriptions, and remove payment methods.

    {{<image filename="images/rc/billing-payment-method-tab.png" alt="The Payments Methods tab helps you manage payments for your subscriptions." >}}

    Select **Add credit card** to enter new credit card details, or **Add marketplace account** to add a [Google Cloud Marketplace]({{< relref "/operate/rc/cloud-integrations/gcp-marketplace/" >}}) or [AWS Marketplace]({{< relref "/operate/rc/cloud-integrations/aws-marketplace/" >}}) account.

- The **Credits** tab shows coupon credits that have been applied to your account, if any.

    {{<image filename="images/rc/billing-payments-credits-tab.png" alt="The Credits tab lets you apply coupons to your account and shows credits that have already been applied." >}}

    | Detail | Description |
    |:-------|:------------|
    | Code   | Coupon code |
    | Coupon Amount | Amount credited to your account |
    | Current Balance | Amount left |
    | Date added | Date applied to your account |
    | Expiration Date | Date the amount expires |

    You can [apply a coupon](#apply-coupon) on this tab.

## Download invoice

To download an invoice:

1. In the [Redis Cloud console](https://cloud.redis.io/), select **Billing & Payments**.

2.  From the **Billing History** tab, locate and select the invoice.

3.  Select the **Download invoice** icon displayed to the right of the invoice amount.

    {{<image filename="images/rc/icon-billing-download.png" width="50px" alt="Use the download icon to download a PDF for the selected invoice." >}}

The invoice is downloaded as an Acrobat PDF file.  Use your browser's download features to manage the file.

## Add credit card

To add a new credit card:

1. In the [Redis Cloud console](https://cloud.redis.io/), select **Billing & Payments > Payment Methods**.

2.  Select **Add credit card** and add the credit card details.

    {{< embed-md "rc-credit-card-add.md" >}} 

3.  Select the **Add Credit Card** button to save your changes.

    {{<image filename="images/rc/button-billing-save-card.png" width="150px" alt="Use the Save Card button to save new payment details." >}}

## Add marketplace account

If you have a [Google Cloud Marketplace]({{< relref "/operate/rc/cloud-integrations/gcp-marketplace/" >}}) or [AWS Marketplace]({{< relref "/operate/rc/cloud-integrations/aws-marketplace/" >}}) account already associated with another Redis Account that you own, you can add it to your current account. 

{{< embed-md "rc-marketplace-account-add.md" >}}

## Apply coupon

Coupons apply credits to your Redis Cloud account.  To redeem a coupon:

1. In the [Redis Cloud console](https://cloud.redis.io/), select **Billing & Payments** and then select the **Credits** tab.

2.  Enter the coupon code and then select the **Apply** button.

    {{<image filename="images/rc/button-billing-payments-apply.png" width="80px" alt="Use the Apply button to redeem a coupon." >}}

    The value of the coupon is applied to your account when accepted.  

For help, contact [Support](https://redis.io/support/).

{{< note >}}
Generally, charges are non-refundable.

For any special circumstances that may warrant a refund, please contact [Support](https://redis.io/support/) and be sure to provide detail about the reasons for the refund request.
{{< /note >}}

## Download cost report

{{< embed-md "rc-cost-report-csv.md" >}}