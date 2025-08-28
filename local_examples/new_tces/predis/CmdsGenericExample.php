// EXAMPLE: cmds_generic
<?php
// HIDE_START
require_once 'vendor/autoload.php';

use Predis\Client;

$client = new Client([
    'scheme' => 'tcp',
    'host'   => '127.0.0.1',
    'port'   => 6379,
]);
// HIDE_END

// STEP_START del
$delResult1 = $client->set('key1', 'Hello');
echo $delResult1 . "\n"; // >>> OK

$delResult2 = $client->set('key2', 'World');
echo $delResult2 . "\n"; // >>> OK

$delResult3 = $client->del(['key1', 'key2', 'key3']);
echo $delResult3 . "\n"; // >>> 2
// STEP_END

// STEP_START exists
$existsResult1 = $client->set('key1', 'Hello');
echo $existsResult1 . "\n"; // >>> OK

$existsResult2 = $client->exists('key1');
echo $existsResult2 . "\n"; // >>> 1

$existsResult3 = $client->exists('nosuchkey');
echo $existsResult3 . "\n"; // >>> 0

$existsResult4 = $client->set('key2', 'World');
echo $existsResult4 . "\n"; // >>> OK

$existsResult5 = $client->exists(['key1', 'key2', 'nosuchkey']);
echo $existsResult5 . "\n"; // >>> 2
// STEP_END

// STEP_START expire
$expireResult1 = $client->set('mykey', 'Hello');
echo $expireResult1 . "\n"; // >>> OK

$expireResult2 = $client->expire('mykey', 10);
echo $expireResult2 . "\n"; // >>> 1

$expireResult3 = $client->ttl('mykey');
echo $expireResult3 . "\n"; // >>> 10

$expireResult4 = $client->set('mykey', 'Hello World');
echo $expireResult4 . "\n"; // >>> OK

$expireResult5 = $client->ttl('mykey');
echo $expireResult5 . "\n"; // >>> -1
// STEP_END

// STEP_START ttl
$ttlResult1 = $client->set('mykey', 'Hello');
echo $ttlResult1 . "\n"; // >>> OK

$ttlResult2 = $client->expire('mykey', 10);
echo $ttlResult2 . "\n"; // >>> 1

$ttlResult3 = $client->ttl('mykey');
echo $ttlResult3 . "\n"; // >>> 10
// STEP_END

// HIDE_START
$client->disconnect();
// HIDE_END
?>
