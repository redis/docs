// EXAMPLE: hash_import
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class HashImportTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testHashImport(): void
    {
        $r = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);

        // REMOVE_START
        $userKeys = array_map(fn($i) => "user:$i", range(1, 1000));
        $r->del($userKeys);
        // REMOVE_END

        // STEP_START himport_basic
        // Declare the field names once.
        $r->himport->prepare('user', ['name', 'email', 'age']);

        // Create each hash by sending only its values.
        $res1 = $r->himport->set('user:1', 'user', ['Alice', 'alice@example.com', '34']);
        echo $res1 . PHP_EOL; // >>> OK

        $r->himport->set('user:2', 'user', ['Bob', 'bob@example.com', '41']);
        $r->himport->set('user:3', 'user', ['Carol', 'carol@example.com', '29']);

        // The result is an ordinary hash.
        $res2 = $r->hgetall('user:2');
        echo json_encode($res2) . PHP_EOL;
        // >>> {"age":"41","name":"Bob","email":"bob@example.com"}
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals(['name' => 'Bob', 'email' => 'bob@example.com', 'age' => '41'], $res2);
        // REMOVE_END

        // STEP_START himport_pipeline
        // Queue many imports and send them in one round trip. The fieldset is
        // declared inside the pipeline so it runs on the same connection.
        $replies = $r->pipeline(function ($pipe) {
            $pipe->himport('PREPARE', 'user', ['name', 'email', 'age']);

            for ($i = 1; $i <= 1000; $i++) {
                $pipe->himport('SET', "user:$i", 'user', ["user$i", "user$i@example.com", (string) (20 + $i % 50)]);
            }
        });

        // The first reply is for PREPARE.
        $res3 = array_slice($replies, 1);
        $allOk = true;
        foreach ($res3 as $reply) {
            $allOk = $allOk && $reply == 'OK';
        }
        echo count($res3) . ' ' . var_export($allOk, true) . PHP_EOL; // >>> 1000 true

        $res4 = $r->hget('user:1000', 'email');
        echo $res4 . PHP_EOL; // >>> user1000@example.com
        // STEP_END

        // REMOVE_START
        $this->assertCount(1000, $res3);
        $this->assertTrue($allOk);
        $this->assertEquals('user1000@example.com', $res4);
        $r->del($userKeys);
        $r->himport->discard('user');
        // REMOVE_END
    }
}
