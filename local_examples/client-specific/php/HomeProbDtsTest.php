// EXAMPLE: home_prob_dts
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

$r = new PredisClient([
    'scheme' => 'tcp',
    'host' => '127.0.0.1',
    'port' => 6379,
    'password' => '',
    'database' => 0,
]);

// STEP_START bloom
$r->del('recorded_users');
$r->bfreserve('recorded_users', 0.01, 1000);

$added = $r->bfmadd('recorded_users', 'andy', 'cameron', 'david', 'michelle');
echo json_encode($added), PHP_EOL;
// >>> [1,1,1,1]

$known = $r->bfexists('recorded_users', 'cameron');
echo $known, PHP_EOL;
// >>> 1

$unknown = $r->bfexists('recorded_users', 'kaitlyn');
echo $unknown, PHP_EOL;
// >>> 0
// STEP_END

// STEP_START cuckoo
$r->del('other_users');
$r->cfreserve('other_users', 1000);

$r->cfadd('other_users', 'paolo');
$r->cfadd('other_users', 'kaitlyn');
$r->cfadd('other_users', 'rachel');

$beforeDelete = [
    $r->cfexists('other_users', 'paolo'),
    $r->cfexists('other_users', 'kaitlyn'),
    $r->cfexists('other_users', 'rachel'),
    $r->cfexists('other_users', 'andy'),
];
echo json_encode($beforeDelete), PHP_EOL;
// >>> [1,1,1,0]

$r->cfdel('other_users', 'paolo');
$afterDelete = $r->cfexists('other_users', 'paolo');
echo $afterDelete, PHP_EOL;
// >>> 0
// STEP_END

// STEP_START hyperloglog
$r->del('group:1', 'group:2', 'both_groups');

$r->pfadd('group:1', ['andy', 'cameron', 'david']);
$group1 = $r->pfcount('group:1');
echo $group1, PHP_EOL;
// >>> 3

$r->pfadd('group:2', ['kaitlyn', 'michelle', 'paolo', 'rachel']);
$group2 = $r->pfcount('group:2');
echo $group2, PHP_EOL;
// >>> 4

$r->pfmerge('both_groups', 'group:1', 'group:2');
$bothGroups = $r->pfcount('both_groups');
echo $bothGroups, PHP_EOL;
// >>> 7
// STEP_END

// STEP_START cms
$r->del('items_sold');
$r->cmsinitbyprob('items_sold', 0.01, 0.005);

$firstCounts = $r->cmsincrby(
    'items_sold',
    'bread', 300,
    'tea', 200,
    'coffee', 200,
    'beer', 100
);
echo json_encode($firstCounts), PHP_EOL;
// >>> [300,200,200,100]

$secondCounts = $r->cmsincrby(
    'items_sold',
    'bread', 100,
    'coffee', 150
);
echo json_encode($secondCounts), PHP_EOL;
// >>> [400,350]

$queriedCounts = $r->cmsquery('items_sold', 'bread', 'tea', 'coffee', 'beer');
echo json_encode($queriedCounts), PHP_EOL;
// >>> [400,200,350,100]
// STEP_END

// STEP_START tdigest
$r->del('male_heights', 'female_heights', 'all_heights');

$r->tdigestcreate('male_heights');
$r->tdigestadd('male_heights', 175.5, 181, 160.8, 152, 177, 196, 164);

$maleMin = $r->tdigestmin('male_heights');
echo $maleMin, PHP_EOL;
// >>> 152

$maleMax = $r->tdigestmax('male_heights');
echo $maleMax, PHP_EOL;
// >>> 196

$maleQuantile = $r->tdigestquantile('male_heights', 0.75);
echo json_encode($maleQuantile), PHP_EOL;
// >>> ["181"]

$maleCdf = $r->tdigestcdf('male_heights', 181);
echo json_encode($maleCdf), PHP_EOL;
// >>> ["0.7857142857142857"]

$r->tdigestcreate('female_heights');
$r->tdigestadd('female_heights', 155.5, 161, 168.5, 170, 157.5, 163, 171);

$femaleQuantile = $r->tdigestquantile('female_heights', 0.75);
echo json_encode($femaleQuantile), PHP_EOL;
// >>> ["170"]

$r->tdigestmerge('all_heights', ['male_heights', 'female_heights']);
$allQuantile = $r->tdigestquantile('all_heights', 0.75);
echo json_encode($allQuantile), PHP_EOL;
// >>> ["175.5"]
// STEP_END

// STEP_START topk
$r->del('top_3_songs');
$r->topkreserve('top_3_songs', 3, 7, 8, 0.9);

$evicted = $r->topkadd(
    'top_3_songs',
    'Starfish Trooper',
    'Only one more time',
    'Rock me, Handel',
    'How will anyone know?',
    'Average lover',
    'Road to everywhere'
);
echo json_encode($evicted), PHP_EOL;
// >>> [null,null,null,"Rock me, Handel","Only one more time",null]

$leaders = $r->topklist('top_3_songs');
echo json_encode($leaders), PHP_EOL;
// >>> ["Average lover","How will anyone know?","Starfish Trooper"]

$membership = $r->topkquery('top_3_songs', 'Starfish Trooper', 'Road to everywhere');
echo json_encode($membership), PHP_EOL;
// >>> [1,0]
// STEP_END
