---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Connect your PHP application to a Redis database
linkTitle: Connect
title: Connect to the server
weight: 10
---

## Basic connection

Connect to a locally-running server on the standard port (6379)
with the following code:

```php
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

$r = new PredisClient([
                'scheme'   => 'tcp',
                'host'     => '127.0.0.1',
                'port'     => 6379,
                'password' => '',
                'database' => 0,
            ]);
```

Store and retrieve a simple string to test the connection:

```php
echo $r->set('foo', 'bar'), PHP_EOL;
// >>> OK

echo $r->get('foo'), PHP_EOL;
// >>> bar
```

Store and retrieve a [hash]({{< relref "/develop/data-types/hashes" >}})
object:

```php
$r->hset('user-session:123', 'name', 'John');
$r->hset('user-session:123', 'surname', 'Smith');
$r->hset('user-session:123', 'company', 'Redis');
$r->hset('user-session:123', 'age', 29);

echo var_export($r->hgetall('user-session:123')), PHP_EOL;
/* >>>
array (
  'name' => 'John',
  'surname' => 'Smith',
  'company' => 'Redis',
  'age' => '29',
)
*/
```

## Connect to a Redis cluster

To connect to a Redis cluster, specify one or more of the nodes in
the `clusterNodes` parameter and set `'cluster'=>'redis'` in
`options`:

```php
$clusterNodes = [
    'tcp://127.0.0.1:30001', // Node 1
    'tcp://127.0.0.1:30002', // Node 2
    'tcp://127.0.0.1:30003', // Node 3
];
$options    = ['cluster' => 'redis'];

// Create a Predis client for the cluster
$rc = new PredisClient($clusterNodes, $options);

echo $rc->cluster('nodes'), PHP_EOL;
/* >>>
d8773e888e92d015b7c52fc66798fd6815afefec 127.0.0.1:30004@40004 slave cde97d1f7dce13e9253ace5cafd3fb0aa67cda63 0 1730713764217 1 connected
58fe1346de4c425d60db24e9b153926fbde0d174 127.0.0.1:30002@40002 master - 0 1730713763361 2 connected 5461-10922
015ecc8148a05377dda22f19921d16efcdd6d678 127.0.0.1:30006@40006 slave c019b75d8b52e83e7e52724eccc716ac553f71d6 0 1730713764218 3 connected
aca365963a72642e6ae0c9503aabf3be5c260806 127.0.0.1:30005@40005 slave 58fe1346de4c425d60db24e9b153926fbde0d174 0 1730713763363 2 connected
c019b75d8b52e83e7e52724eccc716ac553f71d6 127.0.0.1:30003@40003 myself,master - 0 1730713764000 3 connected 10923-16383
cde97d1f7dce13e9253ace5cafd3fb0aa67cda63 127.0.0.1:30001@40001 master - 0 1730713764113 1 connected 0-5460
*/

echo $rc->set('foo', 'bar'), PHP_EOL;
// >>> OK
echo $rc->get('foo'), PHP_EOL;
// >>> bar
```

## Connect to your production Redis with TLS

When you deploy your application, use TLS and follow the
[Redis security]({{< relref "/operate/oss_and_stack/management/security/" >}})
guidelines.

Use the following commands to generate the client certificate and private key:

```bash
openssl genrsa -out redis_user_private.key 2048
openssl req -new -key redis_user_private.key -out redis_user.csr
openssl x509 -req -days 365 -in redis_user.csr -signkey redis_user_private.key -out redis_user.crt
```

If you have the [Redis source folder](https://github.com/redis/redis) available,
you can also generate the certificate and private key with these commands:

```bash
./utils/gen-test-certs.sh
./src/redis-server --tls-port 6380 --port 0 --tls-cert-file ./tests/tls/redis.crt --tls-key-file ./tests/tls/redis.key --tls-ca-cert-file ./tests/tls/ca.crt
```

Pass this information during connection using the `ssl` section of `options`:

```php
$options = [
    'scheme' => 'tls', // Use 'tls' for SSL connections
    'host' => '127.0.0.1', // Redis server hostname
    'port' => 6379, // Redis server port
    'username' => 'default', // Redis username
    'password' => '', // Redis password
    'options' => [
        'ssl' => [
            'verify_peer' => true, // Verify the server's SSL certificate
            'cafile' => './redis_ca.pem', // Path to CA certificate
            'local_cert' => './redis_user.crt', // Path to client certificate
            'local_pk' => './redis_user_private.key', // Path to client private key
        ],
    ],
];

$tlsConnection = new PredisClient($options);

echo $tlsConnection->set('foo', 'bar'), PHP_EOL;
// >>> OK
echo $tlsConnection->get('foo'), PHP_EOL;
// >>> bar
```