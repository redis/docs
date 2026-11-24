<?php
// Runs one command, or one MULTI/EXEC block, through Predis and prints what it returns or throws.
// Arguments: port user password mode payload...  (see _common.py for the format)
require __DIR__ . '/vendor/autoload.php';

[, $port, $user, $pass, $mode] = $argv;
$payload = array_slice($argv, 5);
function toks($p) { return array_map(fn($s) => str_starts_with($s, 'hex:') ? hex2bin(substr($s, 4)) : $s, explode("\x01", $p)); }
function raw($p) { $t = toks($p); return new Predis\Command\RawCommand(array_shift($t), $t); }
function one($s) { return str_replace(["\r", "\n"], ' ', (string) $s); }

$params = ['scheme' => 'tcp', 'host' => '127.0.0.1', 'port' => (int) $port, 'timeout' => 5.0, 'read_write_timeout' => 5.0];
if ($user !== '') $params['username'] = $user;
if ($pass !== '') $params['password'] = $pass;
try {
    $c = new Predis\Client($params);
    if ($mode === 'cmd') {
        $r = $c->executeCommand(raw($payload[0]));
        echo "OK\t" . one(json_encode($r)) . "\n";
    } else {
        $r = $c->transaction(function ($tx) use ($payload) {
            foreach ($payload as $p) $tx->executeCommand(raw($p));
        });
        echo "OK\t" . one(json_encode($r)) . "\n";
    }
} catch (Throwable $e) {
    $prev = $e->getPrevious();
    $type = $e instanceof Predis\Response\ServerException ? ' [getErrorType ' . $e->getErrorType() . ']' : '';
    echo "EXC\t" . get_class($e) . "\t" . one($e->getMessage()) . $type . ($prev ? ' [previous ' . get_class($prev) . ': ' . one($prev->getMessage()) . ']' : '') . "\n";
}
