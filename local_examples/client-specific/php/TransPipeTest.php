// EXAMPLE: pipe_trans_tutorial
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;
use Predis\Transaction\MultiExec;

$r = new PredisClient([
    'scheme'   => 'tcp',
    'host'     => '127.0.0.1',
    'port'     => 6379,
    'password' => '',
    'database' => 0,
]);

for ($i = 0; $i < 8; $i++) {
    $r->del("seat:$i");
}

for ($i = 1; $i < 4; $i++) {
    $r->del("counter:$i");
}

$r->del('shellpath');

// STEP_START basic_pipe
$pipe = $r->pipeline();
$pipe->set('seat:0', '#0')
    ->set('seat:1', '#1')
    ->set('seat:2', '#2')
    ->set('seat:3', '#3')
    ->set('seat:4', '#4');
$pipe->execute();

$pipe = $r->pipeline();
$pipe->get('seat:0')
    ->get('seat:1')
    ->get('seat:2')
    ->get('seat:3')
    ->get('seat:4');
$seats = $pipe->execute();

echo implode(', ', $seats), PHP_EOL;
// >>> #0, #1, #2, #3, #4

$responses = $r->pipeline(function ($pipe) {
    $pipe->set('seat:5', '#5');
    $pipe->set('seat:6', '#6');
    $pipe->set('seat:7', '#7');
    $pipe->get('seat:5');
    $pipe->get('seat:6');
    $pipe->get('seat:7');
});

echo implode(', ', array_slice($responses, 3)), PHP_EOL;
// >>> #5, #6, #7
// REMOVE_START
assert($seats === ['#0', '#1', '#2', '#3', '#4']);
assert(array_slice($responses, 3) === ['#5', '#6', '#7']);
// REMOVE_END
// STEP_END

// STEP_START basic_trans
$r->transaction(function (MultiExec $tx) {
    $tx->incr('counter:1');
    $tx->incrby('counter:2', 2);
    $tx->incrby('counter:3', 3);
});

echo implode(', ', $r->mget('counter:1', 'counter:2', 'counter:3')), PHP_EOL;
// >>> 1, 2, 3
// STEP_END

// STEP_START trans_watch
$r->set('shellpath', '/usr/syscmds/');

$r->transaction(
    ['cas' => true, 'watch' => 'shellpath', 'retry' => 3],
    function (MultiExec $tx) {
        $path = $tx->get('shellpath');
        $tx->multi();
        $tx->set('shellpath', $path . ':/usr/mycmds/');
    }
);

echo $r->get('shellpath'), PHP_EOL;
// >>> /usr/syscmds/:/usr/mycmds/
// STEP_END
