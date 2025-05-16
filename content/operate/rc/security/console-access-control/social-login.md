---
Title: Social login
alwaysopen: false
categories:
- docs
- operate
- rc
description: Social login with Redis Cloud.
linkTitle: Social login
weight: 2
aliases:
    - /operate/rc/security/access-control/social-login/
---

Redis Cloud supports the following social logins:
- [GitHub](https://github.com/)
- [Google](https://accounts.google.com/)

{{<note>}}
If your Google and GitHub accounts share an email address (such as Gmail), you can use either one to sign in to the same Redis Cloud account.
{{</note>}}

## Create a new account with social login

To set up Google login:

1. Select **Google** from the [sign-in](https://cloud.redis.io/) screen.
1. Sign in with the Google account you would like to use.
1. Select **Confirm** on the **Sign in with Google** prompt.

To set up GitHub login:

1. Select **Github** from the [sign-in](https://cloud.redis.io/) screen.
2. Sign in with the Github account you would like to use.
3. Select **Authorize** on the **Authorize Redis Okta Auth Github** prompt.

{{<note>}}
If the email address associated with your GitHub account is not public, you will see an error message that your sign in attempt failed. You need to [make your email address public](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences) on GitHub before you try again.
{{</note>}}

## Migrate an existing account to social login

If you already have a Redis Cloud account that requires an email address and password to sign in, you can migrate your existing account to use a social login associated with that same email address instead.

{{<warning>}}
Once you migrate your account to use social login, you cannot revert to your old email/password sign in method.
{{</warning>}}

To migrate your account to Google social login:

1. Select **Google** on the [sign-in](https://cloud.redis.io/) screen.
1. Choose your preferred account from the list.
1. A confirmation prompt will display and warn that you cannot revert to your old sign in method if you proceed with the migration to social login.
1. Select **Confirm** to continue migration.

To migrate your account to GitHub social login:

1. Select **Github** on the [sign-in](https://cloud.redis.io/) screen.
1. Select **Authorize** on the **Authorize Redis Okta Auth Github** prompt.
1. Enter your GitHub password to **Confirm access**. A confirmation prompt warns that you cannot revert to your old sign-in method if you proceed with the migration to social login.
1. Select **Confirm** to continue migration.
