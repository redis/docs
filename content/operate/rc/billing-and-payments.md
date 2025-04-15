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

    {{<image filename="images/rc/billing-add-credit-card.png" width="80%" alt="Select Add Credit Card to add a new payment method" >}}

3.  If you need to change the account billing address, activate the **Change address** slider and enter the new billing address.

    {{<image filename="images/rc/billing-update-billing-address.png" width="80%" alt="Activate the Change address slider to specify a different billing address." >}}

    {{< note >}}
Changing the billing address for your account will remove any payment methods associated with the old billing address. 
    {{< /note >}}

4.  Select the **Add Credit Card** button to save your changes.

    {{<image filename="images/rc/button-billing-save-card.png" width="150px" alt="Use the Save Card button to save new payment details." >}}

## Add marketplace account

If you have a [Google Cloud Marketplace]({{< relref "/operate/rc/cloud-integrations/gcp-marketplace/" >}}) or [AWS Marketplace]({{< relref "/operate/rc/cloud-integrations/aws-marketplace/" >}}) account already associated with another Redis Account that you own, you can add it to your current account. 

{{< embed-md "rc-marketplace-account-add.md" >}}

## Edit billing address

To edit the Redis Cloud account billing address:

1. In the [Redis Cloud console](https://cloud.redis.io/), select **Billing & Payments > Payment Methods**.

2. Select **Credit card options > Edit billing address**.

    {{<image filename="images/rc/billing-credit-card-options-menu.png" alt="The Credit card options menu on the upper-right hand corner of the payment method." width="200px">}}

3. Enter the new billing address. You must re-enter your payment method details to confirm your address change.

    {{<image filename="images/rc/account-settings-change-billing-address.png" alt="The Edit account billing address screen." width="80%">}}

    Select **Update** to save your new address.

    {{< note >}}
Changing the billing address for your account will remove any payment methods associated with the old billing address. See [Add payment method](#add-payment-method) to learn how to add a payment method back to your account.
    {{< /note >}}

## Edit mailing address

To edit the mailing address associated with a payment method:

1. In the [Redis Cloud console](https://cloud.redis.io/), select **Billing & Payments** and then select the **Payment Methods** tab.

2. Select **Credit card options > Edit mailing address**.

    {{<image filename="images/rc/billing-credit-card-options-menu.png" alt="The Credit card options menu on the upper-right hand corner of the payment method." width="200px">}}

3. If the mailing address is different from the billing address, deactivate the **Use billing address** slider and enter the new mailing address. 

    {{<image filename="images/rc/billing-change-mailing-address.png" alt="The Edit mailing address screen." width="80%">}}

    Select **Update** to save your changes.

## Apply coupon

Coupons apply credits to your Redis Cloud account.  To redeem a coupon:

1. In the [Redis Cloud console](https://cloud.redis.io/), select **Billing & Payments** and then select the **Credits** tab.

2.  Enter the coupon code and then select the **Apply** button.

    {{<image filename="images/rc/button-billing-payments-apply.png" width="80px" alt="Use the Apply button to redeem a coupon." >}}

    The value of the coupon is applied to your account when accepted.  

For help, contact [Support](https://support.redislabs.com).

{{< note >}}
Generally, charges are non-refundable.

For any special circumstances that may warrant a refund, please contact [Support](https://support.redislabs.com) and be sure to provide detail about the reasons for the refund request.
{{< /note >}}

## Download cost report

{{< embed-md "rc-cost-report-csv.md" >}}