// EXAMPLE: sample_example
// BINDER_ID php-sample
<?php
// =============================================================================
// CANONICAL PREDIS TEST FILE TEMPLATE
// =============================================================================
// This file demonstrates the structure and conventions used for Predis
// documentation test files. These tests serve dual purposes:
// 1. Executable tests that validate code snippets
// 2. Source for documentation code examples (processed via special markers)
//
// MARKER REFERENCE:
// - EXAMPLE: <name>     - Identifies the example name (matches docs folder name)
// - BINDER_ID <id>      - Optional identifier for online code runners
// - HIDE_START/HIDE_END - Code hidden from documentation but executed in tests
// - REMOVE_START/REMOVE_END - Code removed entirely from documentation output
// - STEP_START <name>/STEP_END - Named code section for targeted doc inclusion
//
// RUN: phpunit SampleTest.php
// =============================================================================

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class SampleTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testSampleExample(): void
    {
        $r = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);

        // REMOVE_START
        // Clean up any existing data before tests
        $r->del('mykey', 'myhash', 'bike:1', 'bike:1:stats');
        // REMOVE_END

        // STEP_START string_ops
        // Basic string SET/GET operations
        $res1 = $r->set('mykey', 'Hello');
        echo $res1 . PHP_EOL; // >>> OK

        $res2 = $r->get('mykey');
        echo $res2 . PHP_EOL; // >>> Hello
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals('Hello', $res2);
        $r->del('mykey');
        // REMOVE_END

        // STEP_START hash_ops
        // Hash operations: HSET, HGET, HGETALL
        $res3 = $r->hset('myhash', 'field1', 'value1');
        echo $res3 . PHP_EOL; // >>> 1

        $res4 = $r->hmset('myhash', [
            'field2' => 'value2',
            'field3' => 'value3'
        ]);
        echo $res4 . PHP_EOL; // >>> OK

        $res5 = $r->hget('myhash', 'field1');
        echo $res5 . PHP_EOL; // >>> value1

        $res6 = $r->hgetall('myhash');
        echo json_encode($res6) . PHP_EOL;
        // >>> {"field1":"value1","field2":"value2","field3":"value3"}
        // STEP_END

        // REMOVE_START
        $this->assertEquals(1, $res3);
        $this->assertEquals('OK', $res4);
        $this->assertEquals('value1', $res5);
        $this->assertEquals('value1', $res6['field1']);
        $r->del('myhash');
        // REMOVE_END

        // STEP_START hash_tutorial
        // Tutorial-style example with bike data
        $bike1 = [
            'model' => 'Deimos',
            'brand' => 'Ergonom',
            'type'  => 'Enduro bikes',
            'price' => '4972'
        ];

        $res7 = $r->hmset('bike:1', $bike1);
        echo $res7 . PHP_EOL; // >>> OK

        $res8 = $r->hget('bike:1', 'model');
        echo $res8 . PHP_EOL; // >>> Deimos

        $res9 = $r->hget('bike:1', 'price');
        echo $res9 . PHP_EOL; // >>> 4972

        $res10 = $r->hgetall('bike:1');
        echo json_encode($res10) . PHP_EOL;
        // >>> {"model":"Deimos","brand":"Ergonom","type":"Enduro bikes","price":"4972"}
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res7);
        $this->assertEquals('Deimos', $res8);
        $this->assertEquals('4972', $res9);
        $this->assertEquals('Deimos', $res10['model']);
        $r->del('bike:1');
        // REMOVE_END

        // STEP_START hincrby
        // Numeric operations on hash fields
        $r->hset('bike:1:stats', 'rides', 0);

        $res11 = $r->hincrby('bike:1:stats', 'rides', 1);
        echo $res11 . PHP_EOL; // >>> 1

        $res12 = $r->hincrby('bike:1:stats', 'rides', 1);
        echo $res12 . PHP_EOL; // >>> 2

        $res13 = $r->hincrby('bike:1:stats', 'crashes', 1);
        echo $res13 . PHP_EOL; // >>> 1
        // STEP_END

        // REMOVE_START
        $this->assertEquals(1, $res11);
        $this->assertEquals(2, $res12);
        $this->assertEquals(1, $res13);
        $r->del('bike:1:stats');
        // REMOVE_END
    }
}

