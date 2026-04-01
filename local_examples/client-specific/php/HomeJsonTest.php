// EXAMPLE: php_home_json
// BINDER_ID php-php_home_json
// STEP_START import
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

use Predis\Command\Argument\Search\AggregateArguments;
use Predis\Command\Argument\Search\CreateArguments;
use Predis\Command\Argument\Search\SearchArguments;
use Predis\Command\Argument\Search\SchemaFields\NumericField;
use Predis\Command\Argument\Search\SchemaFields\TextField;
use Predis\Command\Argument\Search\SchemaFields\TagField;
// STEP_END

class HomeJsonTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testHomeJson() {
        // STEP_START connect
        $r = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);
        // STEP_END

        // STEP_START create_data
        $user1 = json_encode([
            'name' => 'Paul John',
            'email' => 'paul.john@example.com',
            'age' => 42,
            'city' => 'London',
        ], JSON_THROW_ON_ERROR);
        
        $user2 = json_encode([
            'name' => 'Eden Zamir',
            'email' => 'eden.zamir@example.com',
            'age' => 29,
            'city' => 'Tel Aviv',
        ], JSON_THROW_ON_ERROR);
        
        $user3 = json_encode([
            'name' => 'Paul Zamir',
            'email' => 'paul.zamir@example.com',
            'age' => 35,
            'city' => 'Tel Aviv',
        ], JSON_THROW_ON_ERROR);
        // STEP_END

        // STEP_START make_index
        $schema = [
            new TextField('$.name', 'name'),
            new TagField('$.city', 'city'),
            new NumericField('$.age', "age"),
        ];
        
        try {
        $r->ftCreate("idx:users", $schema,
            (new CreateArguments())
                ->on('JSON')
                ->prefix(["user:"]));
        }
        catch (Exception $e) {
            echo $e->getMessage(), PHP_EOL;
        }
        // STEP_END

        // STEP_START add_data
        $r->jsonset('user:1', '$', $user1);
        $r->jsonset('user:2', '$', $user2);
        $r->jsonset('user:3', '$', $user3);
        // STEP_END

        // STEP_START query1
        $res = $r->ftSearch("idx:users", "Paul @age:[30 40]");
        echo json_encode($res), PHP_EOL;
        // >>> [1,"user:3",["$","{\"name\":\"Paul Zamir\",\"email\":\"paul.zamir@example.com\",\"age\":35,\"city\":\"London\"}"]]
        // STEP_END

        // STEP_START query2
        $arguments = new SearchArguments();
        $arguments->addReturn(3, '$.city', true, 'thecity');
        $arguments->dialect(2);
        $arguments->limit(0, 5);

        $res = $r->ftSearch("idx:users", "Paul", $arguments);

        echo json_encode($res), PHP_EOL;
        // >>> [2,"user:1",["thecity","London"],"user:3",["thecity","Tel Aviv"]]
        // STEP_END

        // STEP_START query3
        $ftAggregateArguments = (new AggregateArguments())
            ->groupBy('@city')
            ->reduce('COUNT', true, 'count');

        $res = $r->ftAggregate('idx:users', '*', $ftAggregateArguments);
        echo json_encode($res), PHP_EOL;
        // >>> [2,["city","London","count","1"],["city","Tel Aviv","count","2"]]
        // STEP_END
        // REMOVE_START
        $this->assertIsArray($res);
        // REMOVE_END

        // STEP_START make_hash_index
        $hashSchema = [
            new TextField('name'),
            new TagField('city'),
            new NumericField('age'),
        ];
        
        try {
        $r->ftCreate("hash-idx:users", $hashSchema,
            (new CreateArguments())
                ->on('HASH')
                ->prefix(["huser:"]));
        }
        catch (Exception $e) {
            echo $e->getMessage(), PHP_EOL;
        }
        // STEP_END

        // STEP_START add_hash_data
        $r->hmset('huser:1', [
            'name' => 'Paul John',
            'email' => 'paul.john@example.com',
            'age' => 42,
            'city' => 'London',
        ]);
        
        $r->hmset('huser:2', [
            'name' => 'Eden Zamir',
            'email' => 'eden.zamir@example.com',
            'age' => 29,
            'city' => 'Tel Aviv',
        ]);
        
        $r->hmset('huser:3', [
            'name' => 'Paul Zamir',
            'email' => 'paul.zamir@example.com',
            'age' => 35,
            'city' => 'Tel Aviv',
        ]);
        // STEP_END

        // STEP_START query1_hash
        $res = $r->ftSearch("hash-idx:users", "Paul @age:[30 40]");
        echo json_encode($res), PHP_EOL;
        // >>> [1,"huser:3",["age","35","city","Tel Aviv","email","paul.zamir@example.com","name","Paul Zamir"]]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(
            '[1,"huser:3",["name","Paul Zamir","email","paul.zamir@example.com","age","35","city","Tel Aviv"]]',
            json_encode($res)
        );
        // REMOVE_END
    }
}