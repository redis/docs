Title: audit_settings
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that configures per-database connection and command auditing
linkTitle: audit_settings
weight: $10
---

Configures per-database connection and command (CRUD) auditing

## audit_settings object

| Name | Type/Value | Description |
|---|---|---|
| audit_mode | string; Values: `'disabled'`, `'connection'`, `'connection_and_crud'`; default: `'disabled'` | Per-database auditing mode. `'disabled'`: no audit records are generated. `'connection'`: audits connection and AUTH events only. `'connection_and_crud'`: audits connection, AUTH, and CRUD command events. Cannot be set to `'connection_and_crud'` without connection auditing also active. |
| username_filter | [complex object](#username_filter); default: disabled | Filters which client usernames are included in or excluded from CRUD audit records. |
| source_ip_filter | [complex object](#source_ip_filter); default: disabled | Filters which client source IPs are included in or excluded from CRUD audit records. |
| max_total_key_bytes | integer (range: 0+) ; default: `131072` | Maximum total key bytes captured in a single command audit record. |

Filter changes take effect for new client connections only. Existing connections continue to be audited according to the filters that were active when the connection was established.

## username_filter object

Controls which client usernames are included in or excluded from CRUD audit records.

| Name | Type/Value | Description |
|---|---|---|
| enabled | boolean; default: `false` | Enables the username filter. |
| usernames | array of strings; default: `[]`; max 512 entries | Usernames to include or exclude, depending on `filter_type`. |
| filter_type | string; Values: `'inclusive'`, `'exclusive'`; default: `'inclusive'` | `'inclusive'` audits only the listed usernames. `'exclusive'` audits all usernames except the listed ones. |
| allow_while_username_unknown | boolean; default: `false` | Allows command auditing to proceed before the connection's username is known. |

**Validation:**
- Each username must be 1–255 characters, using printable ASCII characters only.
- Usernames must not contain `&`, `<`, `>`, or double-quote characters.
- If `enabled` is `true`, `usernames` must not be empty.

## source_ip_filter object

Controls which client source IP addresses are included in or excluded from CRUD audit records.

| Name | Type/Value | Description |
|---|---|---|
| enabled | boolean; default: `false` | Enables the source IP filter. |
| ip_addresses | array of strings; default: `[]` | Bare IPv4 or IPv6 addresses. |
| cidr_ranges | array of strings; default: `[]` | IPv4 or IPv6 CIDR ranges. |
| filter_type | string; Values: `'inclusive'`, `'exclusive'`; default: `'inclusive'` | `'inclusive'` audits only matching IPs/ranges. `'exclusive'` audits all except matching IPs/ranges. |

**Validation:**
- `ip_addresses` entries must be bare IPv4 or IPv6 addresses (no ranges or CIDR notation).
- `cidr_ranges` entries must be valid IPv4 or IPv6 CIDR ranges.
- If `enabled` is `true`, at least one `ip_addresses` or `cidr_ranges` entry is required.
- The combined number of `ip_addresses` and `cidr_ranges` entries cannot exceed 512.
