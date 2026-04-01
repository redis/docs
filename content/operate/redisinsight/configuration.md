---
categories:
- docs
- operate
- redisinsight
linkTitle: Configuration settings
title: Redis Insight configuration settings
weight: 5
---
## Configuration environment variables

| Variable | Purpose | Default | Additional info |
| --- | --- | --- | --- |
| RI_APP_PORT | The port that Redis Insight listens on. | <ul><li> Docker: 5540 <li> desktop: 5530 </ul> | See [Express Documentation](https://expressjs.com/en/api.html#app.listen)|
| RI_APP_HOST | The host that Redis Insight connects to. | <ul><li> Docker: 0.0.0.0 <li> desktop: 127.0.0.1 </ul> | See [Express Documentation](https://expressjs.com/en/api.html#app.listen)|
| RI_SERVER_TLS_KEY | Private key for HTTPS. | n/a | Private key in [PEM format](https://www.ssl.com/guide/pem-der-crt-and-cer-x-509-encodings-and-conversions/#ftoc-heading-3). Can be a path to a file or a string in PEM format.|
| RI_SERVER_TLS_CERT | Certificate for supplied private key. | n/a | Public certificate in [PEM format](https://www.ssl.com/guide/pem-der-crt-and-cer-x-509-encodings-and-conversions/#ftoc-heading-3). Can be a path to a file or a string in PEM format.|
| RI_ENCRYPTION_KEY | Key to encrypt data with. | n/a | Available only for Docker. <br> Redis insight stores sensitive information (database passwords, Workbench history, etc.) locally (using [sqlite3](https://github.com/TryGhost/node-sqlite3)). This variable allows you to store sensitive information encrypted using the specified encryption key. <br />Note: The same encryption key should be provided for subsequent `docker run` commands with the same volume attached to decrypt the information. |
| RI_LOG_LEVEL | Configures the log level of the application. | `info` | Supported logging levels are prioritized from highest to lowest: <ul> <li>error<li> warn<li>info<li> http<li> verbose<li> debug<li> silly</ul> |
| RI_FILES_LOGGER | Logs to file. | `true` | By default, you can find log files in the following folders: <ul> <li> Docker: `/data/logs` <li> desktop: `<user-home-dir>/.redisinsight-app/logs` </ul>|
| RI_STDOUT_LOGGER | Logs to STDOUT. | `true` | |
| RI_PROXY_PATH | Configures a subpath for a proxy. | n/a | Available only for Docker. |
| RI_DATABASE_MANAGEMENT | When set to `false`, this disables the ability to manage database connections (adding, editing, or deleting). | `true` | | 
| RI_ACCEPT_TERMS_AND_CONDITIONS | This environment variable allows you to accept the End User License Agreement (EULA) without displaying it in the UI. By setting this variable, you acknowledge that your use of Redis Insight is governed either by your signed agreement with Redis or, if none exists, by the Redis Enterprise Software Subscription Agreement. If neither applies, your use is subject to the Server Side Public License (SSPL). | `true` | | 

## Preconfigure database connections
Redis Insight allows you to preconfigure database connections using environment variables or a JSON file, enabling centralized and efficient configuration.
There are two ways to preconfigure database connections in Redis Insight Electron and Docker:
1. Use environment variables.
1. Use a JSON file.

### Preconfigure database connections using environment variables
Redis Insight allows you to preconfigure database connections using environment variables.

**NOTES**:
- To configure multiple database connections, replace the asterisk (*) in each environment variable with a unique identifier for each database connection. If setting up only one connection, you can omit the asterisk, and Redis Insight will default to using 0 as the ID.
- If you modify environment variables, the changes will take effect after restarting Redis Insight.
- If you restart Redis Insight without these environment variables, all previously added database connections will be removed.

| Variable | Purpose | Default | Additional info |
| --- | --- | --- | --- |
| RI_REDIS_HOST* | Host of a Redis database. | N/A |  |
| RI_REDIS_PORT* | Port of a Redis database. | `6379` |  |
| RI_REDIS_ALIAS* | Alias of a database connection. | `{host}:{port}` |  |
| RI_REDIS_USERNAME* | Username to connect to a Redis database. | `default` |  |
| RI_REDIS_PASSWORD* | Password to connect to a Redis database. | No password |  |
| RI_REDIS_TLS* | Indicates whether TLS certificates should be used to connect. | `false` | Accepts `true` or `false` |
| RI_REDIS_TLS_CA_BASE64* | CA certificate in base64 format. | N/A | Specify a CA certificate in this environment variable or provide a file path using `RI_REDIS_TLS_CA_PATH*`. |
| RI_REDIS_TLS_CA_PATH* | Path to the CA certificate file. | N/A |  |
| RI_REDIS_TLS_CERT_BASE64* | Client certificate in base64 format. | N/A | Specify a client certificate in this environment variable or provide a file path using `RI_REDIS_TLS_CERT_PATH*`. |
| RI_REDIS_TLS_CERT_PATH* | Path to the Client certificate file. | N/A |  |
| RI_REDIS_TLS_KEY_BASE64* | Private key for the client certificate in base64 format. | N/A | Indicate a private key in this environment variable or use another variable to get it from a file. |
| RI_REDIS_TLS_KEY_PATH* | Path to private key file. | N/A |  |
| RI_REDIS_DB | Database index to connect to. | N/A | |

### Preconfigure database connections using a JSON file
Redis Insight also allows you to preconfigure database connections using a JSON file.

**NOTES**
- The JSON file format should match the one used when exporting database connections from Redis Insight.
- The `id` field in the JSON file should include unique identifiers to avoid conflicts for database connections.
- Changes to the JSON file will take effect after restarting Redis Insight.
- If the JSON file is removed, all database connections added via the file will be removed.

| Variable | Purpose | Default | Additional info |
| --- | --- | --- | --- |
| RI_PRE_SETUP_DATABASES_PATH | Path to a JSON file containing the database connections to preconfigure  |  |

## Use Redis Insight behind a reverse proxy

When you configure Redis Insight to run behind a reverse proxy like [NGINX](https://www.nginx.com/), set the request timeout to over 30 seconds on the reverse proxy because some requests can be long-running.

Redis Insight also allows you to manage its connection timeout on the form to configure the connection details. The default timeout is 30 seconds.

Hosting Redis Insight behind a prefix path (path-rewriting) is not supported.
