// EXAMPLE: json_tutorial
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtJsonTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtJson() {
        $r = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);
        // REMOVE_START
        $r->flushall();
        // REMOVE_END

        // STEP_START set_get
        $res1 = $r->jsonset('bike', '$', '"Hyperion"');
        echo $res1 . PHP_EOL;
        // >>> OK

        $res2 = $r->jsonget('bike', '', '', '', '$');
        echo $res2 . PHP_EOL;
        // >>> ["Hyperion"]

        $res3 = $r->jsontype('bike', '$');
        echo json_encode($res3) . PHP_EOL;
        // >>> ["string"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals('["Hyperion"]', $res2);
        $this->assertEquals(['string'], $res3);
        // REMOVE_END

        // STEP_START str
        $res4 = $r->jsonstrlen('bike', '$');
        echo json_encode($res4) . PHP_EOL;
        // >>> [8]

        $res5 = $r->jsonstrappend('bike', '$', '" (Enduro bikes)"');
        echo json_encode($res5) . PHP_EOL;
        // >>> [23]

        $res6 = $r->jsonget('bike', '', '', '', '$');
        echo $res6 . PHP_EOL;
        // >>> "Hyperion (Enduro bikes)"
        // STEP_END
        // REMOVE_START
        $this->assertEquals([8], $res4);
        $this->assertEquals([23], $res5);
        $this->assertEquals('["Hyperion (Enduro bikes)"]', $res6);
        // REMOVE_END

        // STEP_START num
        $res7 = $r->jsonset('crashes', '$', '0');
        echo $res7 . PHP_EOL;
        // >>> OK

        $res8 = $r->jsonnumincrby('crashes', '$', 1);
        echo $res8 . PHP_EOL;
        // >>> [1]

        $res9 = $r->jsonnumincrby('crashes', '$', 1.5);
        echo $res9 . PHP_EOL;
        // >>> [2.5]

        $res10 = $r->jsonnumincrby('crashes', '$', -0.75);
        echo $res10 . PHP_EOL;
        // >>> [1.75]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res7);
        $this->assertEquals('[1]', $res8);
        $this->assertEquals('[2.5]', $res9);
        $this->assertEquals('[1.75]', $res10);
        // REMOVE_END

        // STEP_START arr
        $newbike = json_encode(["Deimos", ["crashes" => 0], null], JSON_THROW_ON_ERROR);
        $res11 = $r->jsonset('newbike', '$', $newbike);
        echo $res11 . PHP_EOL;
        // >>> OK

        $res12 = $r->jsonget('newbike', '', '', '', '$');
        echo $res12 . PHP_EOL;
        // >>> [["Deimos",{"crashes":0},null]]

        $res13 = $r->jsonget('newbike', '', '', '', '$[1].crashes');
        echo $res13 . PHP_EOL;
        // >>> 0

        $res14 = $r->jsondel('newbike', '$.[-1]');
        echo $res14 . PHP_EOL;
        // >>> 1

        $res15 = $r->jsonget('newbike', '', '', '', '$');
        echo $res15 . PHP_EOL;
        // >>> ["Deimos",{"crashes":0}]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res11);
        $this->assertEquals('[["Deimos",{"crashes":0},null]]', $res12);
        $this->assertEquals('[0]', $res13);
        $this->assertEquals(1, $res14);
        $this->assertEquals('[["Deimos",{"crashes":0}]]', $res15);
        // REMOVE_END

        // STEP_START arr2
        $res16 = $r->jsonset('riders', '$', '[]');
        echo $res16 . PHP_EOL;
        // >>> OK

        $res17 = $r->jsonarrappend('riders', '$', '"Norem"');
        echo json_encode($res17) . PHP_EOL;
        // >>> [1]

        $res18 = $r->jsonget('riders', '', '', '', '$');
        echo $res18 . PHP_EOL;
        // >>> ["Norem"]

        $res19 = $r->jsonarrinsert('riders', '$', 1, '"Prickett"', '"Royce"', '"Castilla"');
        echo json_encode($res19) . PHP_EOL;
        // >>> [4]

        $res20 = $r->jsonget('riders', '', '', '', '$');
        echo $res20 . PHP_EOL;
        // >>> ["Norem","Prickett","Royce","Castilla"]

        $res21 = $r->jsonarrtrim('riders', '$', 1, 1);
        echo json_encode($res21) . PHP_EOL;
        // >>> [1]

        $res22 = $r->jsonget('riders', '', '', '', '$');
        echo $res22 . PHP_EOL;
        // >>> ["Prickett"]

        $res23 = $r->jsonarrpop('riders', '$');
        echo json_encode($res23) . PHP_EOL;
        // >>> ["\"Prickett\""]

        $res24 = $r->jsonarrpop('riders', '$');
        echo json_encode($res24) . PHP_EOL;
        // >>> [null]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res16);
        $this->assertEquals([1], $res17);
        $this->assertEquals('[["Norem"]]', $res18);
        $this->assertEquals([4], $res19);
        $this->assertEquals('[["Norem","Prickett","Royce","Castilla"]]', $res20);
        $this->assertEquals([1], $res21);
        $this->assertEquals('[["Prickett"]]', $res22);
        $this->assertEquals(['"Prickett"'], $res23);
        $this->assertEquals([null], $res24);
        // REMOVE_END

        // STEP_START obj
        $bike1 = json_encode([
            'model' => 'Deimos',
            'brand' => 'Ergonom',
            'price' => 4972,
        ], JSON_THROW_ON_ERROR);
        $res25 = $r->jsonset('bike:1', '$', $bike1);
        echo $res25 . PHP_EOL;
        // >>> OK

        $res26 = $r->jsonobjlen('bike:1', '$');
        echo json_encode($res26) . PHP_EOL;
        // >>> [3]

        $res27 = $r->jsonobjkeys('bike:1', '$');
        echo json_encode($res27) . PHP_EOL;
        // >>> [["model","brand","price"]]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res25);
        $this->assertEquals([3], $res26);
        $this->assertEquals([["model","brand","price"]], $res27);
        // REMOVE_END

        // STEP_START set_bikes
        $inventory = [
            'inventory' => [
                'mountain_bikes' => [
                    [
                        'id' => 'bike:1',
                        'model' => 'Phoebe',
                        'description' => 'This is a mid-travel trail slayer that is a fantastic daily driver or one bike quiver. The Shimano Claris 8-speed groupset gives plenty of gear range to tackle hills and there’s room for mudguards and a rack too.  This is the bike for the rider who wants trail manners with low fuss ownership.',
                        'price' => 1920,
                        'specs' => ['material' => 'carbon', 'weight' => 13.1],
                        'colors' => ['black', 'silver'],
                    ],
                    [
                        'id' => 'bike:2',
                        'model' => 'Quaoar',
                        'description' => "Redesigned for the 2020 model year, this bike impressed our testers and is the best all-around trail bike we've ever tested. The Shimano gear system effectively does away with an external cassette, so is super low maintenance in terms of wear and tear. All in all it's an impressive package for the price, making it very competitive.",
                        'price' => 2072,
                        'specs' => ['material' => 'aluminium', 'weight' => 7.9],
                        'colors' => ['black', 'white'],
                    ],
                    [
                        'id' => 'bike:3',
                        'model' => 'Weywot',
                        'description' => 'This bike gives kids aged six years and older a durable and uberlight mountain bike for their first experience on tracks and easy cruising through forests and fields. A set of powerful Shimano hydraulic disc brakes provide ample stopping ability. If you\'re after a budget option, this is one of the best bikes you could get.',
                        'price' => 3264,
                        'specs' => ['material' => 'alloy', 'weight' => 13.8],
                    ],
                ],
                'commuter_bikes' => [
                    [
                        'id' => 'bike:4',
                        'model' => 'Salacia',
                        'description' => 'This bike is a great option for anyone who just wants a bike to get about on With a slick-shifting Claris gears from Shimano’s, this is a bike which doesn’t break the bank and delivers craved performance.  It’s for the rider who wants both efficiency and capability.',
                        'price' => 1475,
                        'specs' => ['material' => 'aluminium', 'weight' => 16.6],
                        'colors' => ['black', 'silver'],
                    ],
                    [
                        'id' => 'bike:5',
                        'model' => 'Mimas',
                        'description' => 'A real joy to ride, this bike got very high scores in last years Bike of the year report. The carefully crafted 50-34 tooth chainset and 11-32 tooth cassette give an easy-on-the-legs bottom gear for climbing, and the high-quality Vittoria Zaffiro tires give balance and grip.It includes a low-step frame , our memory foam seat, bump-resistant shocks and conveniently placed thumb throttle. Put it all together and you get a bike that helps redefine what can be done for this price.',
                        'price' => 3941,
                        'specs' => ['material' => 'alloy', 'weight' => 11.6],
                    ],
                ],
            ],
        ];
        $res1b = $r->jsonset('bikes:inventory', '$', json_encode($inventory, JSON_THROW_ON_ERROR));
        echo $res1b . PHP_EOL;
        // >>> OK
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res1b);
        // REMOVE_END

        // STEP_START get_bikes
        $res2b = $r->jsonget('bikes:inventory', '', '', '', '$.inventory.*');
        echo $res2b . PHP_EOL;
        // >>> [{'id': 'bike:1', 'model': 'Phoebe',
        // STEP_END
        // REMOVE_START
        $this->assertIsString($res2b);
        $decoded2b = json_decode($res2b, true);
        $this->assertArrayHasKey('mountain_bikes', $inventory['inventory']);
        $this->assertArrayHasKey('commuter_bikes', $inventory['inventory']);
        // REMOVE_END

        // STEP_START get_mtnbikes
        $res3b = $r->jsonget('bikes:inventory', '', '', '', '$.inventory.mountain_bikes[*].model');
        echo $res3b . PHP_EOL;
        // >>> ["Phoebe","Quaoar","Weywot"]

        $res4b = $r->jsonget('bikes:inventory', '', '', '', '$.inventory["mountain_bikes"][*].model');
        echo $res4b . PHP_EOL;
        // >>> ["Phoebe","Quaoar","Weywot"]

        $res5b = $r->jsonget('bikes:inventory', '', '', '', '$..mountain_bikes[*].model');
        echo $res5b . PHP_EOL;
        // >>> ["Phoebe","Quaoar","Weywot"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('["Phoebe","Quaoar","Weywot"]', $res3b);
        $this->assertEquals('["Phoebe","Quaoar","Weywot"]', $res4b);
        $this->assertEquals('["Phoebe","Quaoar","Weywot"]', $res5b);
        // REMOVE_END

        // STEP_START get_models
        $res6b = $r->jsonget('bikes:inventory', '', '', '', '$..model');
        echo $res6b . PHP_EOL;
        // >>> ["Phoebe","Quaoar","Weywot","Salacia","Mimas"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('["Phoebe","Quaoar","Weywot","Salacia","Mimas"]', $res6b);
        // REMOVE_END

        // STEP_START get2mtnbikes
        $res7b = $r->jsonget('bikes:inventory', '', '', '', '$..mountain_bikes[0:2].model');
        echo $res7b . PHP_EOL;
        // >>> ["Phoebe","Quaoar"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('["Phoebe","Quaoar"]', $res7b);
        // REMOVE_END

        // STEP_START filter1
        $res8b = $r->jsonget(
            'bikes:inventory',
            '',
            '',
            '',
            '$..mountain_bikes[?(@.price < 3000 && @.specs.weight < 10)]'
        );
        echo $res8b . PHP_EOL;
        // >>> [{"id":"bike:2","model":"Quaoar",...}]
        // STEP_END
        // REMOVE_START
        $this->assertIsString($res8b);
        $decoded8b = json_decode($res8b, true);
        $this->assertNotEmpty($decoded8b);
        $this->assertEquals('Quaoar', $decoded8b[0]['model']);
        $this->assertEquals('aluminium', $decoded8b[0]['specs']['material']);
        // REMOVE_END

        // STEP_START filter2
        $res9b = $r->jsonget('bikes:inventory', '', '', '', "$..[?(@.specs.material == 'alloy')].model");
        echo $res9b . PHP_EOL;
        // >>> ["Weywot","Mimas"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('["Weywot","Mimas"]', $res9b);
        // REMOVE_END

        // STEP_START filter3
        $res10b = $r->jsonget('bikes:inventory', '', '', '', "$..[?(@.specs.material =~ '(?i)al')].model");
        echo $res10b . PHP_EOL;
        // >>> ["Quaoar","Weywot","Salacia","Mimas"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('["Quaoar","Weywot","Salacia","Mimas"]', $res10b);
        // REMOVE_END

        // STEP_START filter4
        $r->jsonset('bikes:inventory', '$.inventory.mountain_bikes[0].regex_pat', '"(?i)al"');
        $r->jsonset('bikes:inventory', '$.inventory.mountain_bikes[1].regex_pat', '"(?i)al"');
        $r->jsonset('bikes:inventory', '$.inventory.mountain_bikes[2].regex_pat', '"(?i)al"');

        $res14b = $r->jsonget(
            'bikes:inventory',
            '',
            '',
            '',
            '$.inventory.mountain_bikes[?(@.specs.material =~ @.regex_pat)].model'
        );
        echo $res14b . PHP_EOL;
        // >>> ["Quaoar","Weywot"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('["Quaoar","Weywot"]', $res14b);
        // REMOVE_END

        // STEP_START update_bikes
        $res15b = $r->jsonget('bikes:inventory', '', '', '', '$..price');
        echo $res15b . PHP_EOL;
        // >>> [1920,2072,3264,1475,3941]

        $res16b = $r->jsonnumincrby('bikes:inventory', '$..price', -100);
        echo json_encode($res16b) . PHP_EOL;
        // >>> [1820,1972,3164,1375,3841]

        $res17b = $r->jsonnumincrby('bikes:inventory', '$..price', 100);
        echo json_encode($res17b) . PHP_EOL;
        // >>> [1920,2072,3264,1475,3941]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('[1920,2072,3264,1475,3941]', $res15b);
        $this->assertEquals('[1820,1972,3164,1375,3841]', $res16b);
        $this->assertEquals('[1920,2072,3264,1475,3941]', $res17b);
        // REMOVE_END

        // STEP_START update_filters1
        $res18b = $r->jsonset('bikes:inventory', '$.inventory.*[?(@.price<2000)].price', '1500');
        $res19b = $r->jsonget('bikes:inventory', '', '', '', '$..price');
        echo $res19b . PHP_EOL;
        // >>> [1500,2072,3264,1500,3941]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res18b);
        $this->assertEquals('[1500,2072,3264,1500,3941]', $res19b);
        // REMOVE_END

        // STEP_START update_filters2
        $res20b = $r->jsonarrappend('bikes:inventory', '$.inventory.*[?(@.price<2000)].colors', '"pink"');
        echo json_encode($res20b) . PHP_EOL;
        // >>> [3,3]

        $res21b = $r->jsonget('bikes:inventory', '', '', '', '$..[*].colors');
        echo $res21b . PHP_EOL;
        // >>> [["black","silver","pink"],["black","white"],["black","silver","pink"]]
        // STEP_END
        // REMOVE_START
        $this->assertEquals([3,3], $res20b);
        $this->assertEquals('[["black","silver","pink"],["black","white"],["black","silver","pink"]]', $res21b);
        // REMOVE_END
    }
}

