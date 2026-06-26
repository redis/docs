// EXAMPLE: landing
// BINDER_ID php-landing
// STEP_START connect
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
// STEP_END

// STEP_START set_get_string
echo $r->set('foo', 'bar'), PHP_EOL;
// >>> OK

echo $r->get('foo'), PHP_EOL;
// >>> bar
// STEP_END

// STEP_START set_get_hash
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
// STEP_END
