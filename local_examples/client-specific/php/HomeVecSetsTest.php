// EXAMPLE: home_vecsets
// STEP_START import
<?php

require 'vendor/autoload.php';

use function Codewithkyrian\Transformers\Pipelines\pipeline;

use Predis\Client as PredisClient;
// STEP_END

// STEP_START model
$extractor = pipeline('embeddings', 'Xenova/all-MiniLM-L6-v2');
// STEP_END

// STEP_START data
$peopleData = [
    'Marie Curie' => [
        'born' => 1867,
        'died' => 1934,
        'description' => 'Polish-French chemist and physicist. The only person ever to win two Nobel prizes for two different sciences.',
    ],
    'Linus Pauling' => [
        'born' => 1901,
        'died' => 1994,
        'description' => 'American chemist and peace activist. One of only two people to win two Nobel prizes in different fields (chemistry and peace).',
    ],
    'Freddie Mercury' => [
        'born' => 1946,
        'died' => 1991,
        'description' => 'British musician, best known as the lead singer of the rock band Queen.',
    ],
    'Marie Fredriksson' => [
        'born' => 1958,
        'died' => 2019,
        'description' => 'Swedish multi-instrumentalist, mainly known as the lead singer and keyboardist of the band Roxette.',
    ],
    'Paul Erdos' => [
        'born' => 1913,
        'died' => 1996,
        'description' => 'Hungarian mathematician, known for his eccentric personality almost as much as his contributions to many different fields of mathematics.',
    ],
    'Maryam Mirzakhani' => [
        'born' => 1977,
        'died' => 2017,
        'description' => 'Iranian mathematician. The first woman ever to win the Fields medal for her contributions to mathematics.',
    ],
    'Masako Natsume' => [
        'born' => 1957,
        'died' => 1985,
        'description' => 'Japanese actress. She was very famous in Japan but was primarily known elsewhere in the world for her portrayal of Tripitaka in the TV series Monkey.',
    ],
    'Chaim Topol' => [
        'born' => 1935,
        'died' => 2023,
        'description' => "Israeli actor and singer, usually credited simply as 'Topol'. He was best known for his many appearances as Tevye in the musical Fiddler on the Roof.",
    ],
];
// STEP_END

$r = new PredisClient([
    'scheme' => 'tcp',
    'host' => '127.0.0.1',
    'port' => 6379,
    'password' => '',
    'database' => 0,
]);

// STEP_START add_data
$r->del('famousPeople');

foreach ($peopleData as $name => $details) {
    $embedding = $extractor($details['description'], normalize: true, pooling: 'mean');

    $r->vadd('famousPeople', $embedding[0], $name);
    $r->vsetattr('famousPeople', $name, [
        'born' => $details['born'],
        'died' => $details['died'],
    ]);
}
// STEP_END

// STEP_START basic_query
$actorsEmbedding = $extractor('actors', normalize: true, pooling: 'mean');
$actorsResults = $r->vsim('famousPeople', $actorsEmbedding[0]);

echo "'actors': " . json_encode($actorsResults), PHP_EOL;
// >>> 'actors': ["Masako Natsume","Chaim Topol","Linus Pauling","Marie Fredriksson","Maryam Mirzakhani","Freddie Mercury","Marie Curie","Paul Erdos"]
// STEP_END

// STEP_START limited_query
$twoActorsResults = $r->vsim('famousPeople', $actorsEmbedding[0], false, false, 2);

echo "'actors (2)': " . json_encode($twoActorsResults), PHP_EOL;
// >>> 'actors (2)': ["Masako Natsume","Chaim Topol"]
// STEP_END

// STEP_START entertainer_query
$entertainerEmbedding = $extractor('entertainer', normalize: true, pooling: 'mean');
$entertainerResults = $r->vsim('famousPeople', $entertainerEmbedding[0]);

echo "'entertainer': " . json_encode($entertainerResults), PHP_EOL;
// >>> 'entertainer': ["Chaim Topol","Freddie Mercury","Linus Pauling","Marie Fredriksson","Masako Natsume","Paul Erdos","Maryam Mirzakhani","Marie Curie"]
// STEP_END

$scienceEmbedding = $extractor('science', normalize: true, pooling: 'mean');
$scienceResults = $r->vsim('famousPeople', $scienceEmbedding[0]);

echo "'science': " . json_encode($scienceResults), PHP_EOL;
// >>> 'science': ["Linus Pauling","Marie Curie","Maryam Mirzakhani","Paul Erdos","Marie Fredriksson","Masako Natsume","Freddie Mercury","Chaim Topol"]

// STEP_START filtered_query
$science2000Results = $r->vsim('famousPeople', $scienceEmbedding[0], false, false, null, null, null, '.died < 2000');

echo "'science2000': " . json_encode($science2000Results), PHP_EOL;
// >>> 'science2000': ["Linus Pauling","Marie Curie","Paul Erdos","Masako Natsume","Freddie Mercury"]
// STEP_END
