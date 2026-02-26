---
Title: Redis Insight v3.2.0, February 2026
linkTitle: v3.2.0 (February 2026)
date: 2026-02-26 00:00:00 +0000
description: Redis Insight v3.2.0
weight: 1
---

## 3.2.0 (February 2026)

This is the General Availability (GA) release of Redis Insight 3.2.0, which includes new features, build updates, and bug fixes.

### Headlines

Connect to Azure Managed Redis with ease. Auto-discover databases across subscriptions with one-click import and connect using Entra ID and Azure passwordless (OAuth) authentication.

### Details

- Added support for Azure Managed Redis and Azure Cache for Redis tiers. This support includes auto-discovery of databases across subscriptions with one-click import, Microsoft Entra ID (OAuth) authentication with automatic background token refresh, and multi-account support to switch easily between different Azure accounts.
- Simplified the build process by removing the Webpack dependency. Vite is used now for both development and production builds.

### Bug fixes

- https://github.com/redis/RedisInsight/pull/5504 Fixed critical security vulnerabilities CVE-2025-55130 (Node.js) and CVE-2025-15467 (OpenSSL) by upgrading the Node.js version and the Alpine base image in Docker.

**SHA-512 Checksums**

| Package             | SHA-512                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Windows             | 4sgqVLCjqEmg3N9kAQUZXu1ORln9/RJaQazRK0GLJP9PdCoE57DvdLIQ0NWyo2Y7gKaciWnbYSALSYy1aEaWKA== |
| Linux AppImage      | D3yFi8AX4nax/Tf9zighm592PVT3Gh6aQ07uABWOrBdp6gA1ENIleypQzrgOqpGyJ3NXMmNjgzmQCdCGHZUL3g== |
| Linux Debian        | fuCXfh7tlUXQ6gvf/j4mPYG0qH0q94hcIV550ZTyymfSog8CCsxtKJAsySY0mIc+zSBV1nfFfK7qXwKeEmULsw== |
| Linux RPM           | IdxUbf5M2c2nXd8huWhPxD+V331zsjLQ/T9T5KqkTNw+gPXsjCxPEX99Y6WuaWFrLF4iGDHZarByVqFYOIWnFg== |
| MacOS Intel         | 6FUSdjAZeqYHg7U+MU8vY4icEwxiA0t14xi8WKh6VVAIf2ZVzjmFt2c4dHqrZuL5moAUJflhOgcZmp5t0xiJpQ== |
| MacOS Apple silicon | tgtdVOsdph+l3rtq1N83qBwr4Lktz/hkPHpDdFzp0JRSe17Qer04mw8GibL9tyf8eVhJsUSF6dzGovGIq9Mv2A== |
