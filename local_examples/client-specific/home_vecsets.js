// EXAMPLE: home_vecsets
// STEP_START import
import * as transformers from '@xenova/transformers';
import { createClient } from 'redis';
// STEP_END

// STEP_START model
const pipe = await transformers.pipeline(
    'feature-extraction', 'Xenova/all-MiniLM-L6-v2'
);

const pipeOptions = {
    pooling: 'mean',
    normalize: true,
};
// STEP_END

// STEP_START data
const peopleData = {
    "Marie Curie": {
        "born": 1867, "died": 1934,
        "description": `
        Polish-French chemist and physicist. The only person ever to win
        two Nobel prizes for two different sciences.
        `
    },
    "Linus Pauling": {
        "born": 1901, "died": 1994,
        "description": `
        American chemist and peace activist. One of only two people to win two
        Nobel prizes in different fields (chemistry and peace).
        `
    },
    "Freddie Mercury": {
        "born": 1946, "died": 1991,
        "description": `
        British musician, best known as the lead singer of the rock band
        Queen.
        `
    },
    "Marie Fredriksson": {
        "born": 1958, "died": 2019,
        "description": `
        Swedish multi-instrumentalist, mainly known as the lead singer and
        keyboardist of the band Roxette.
        `
    },
    "Paul Erdos": {
        "born": 1913, "died": 1996,
        "description": `
        Hungarian mathematician, known for his eccentric personality almost
        as much as his contributions to many different fields of mathematics.
        `
    },
    "Maryam Mirzakhani": {
        "born": 1977, "died": 2017,
        "description": `
        Iranian mathematician. The first woman ever to win the Fields medal
        for her contributions to mathematics.
        `
    },
    "Masako Natsume": {
        "born": 1957, "died": 1985,
        "description": `
        Japanese actress. She was very famous in Japan but was primarily
        known elsewhere in the world for her portrayal of Tripitaka in the
        TV series Monkey.
        `
    },
    "Chaim Topol": {
        "born": 1935, "died": 2023,
        "description": `
        Israeli actor and singer, usually credited simply as 'Topol'. He was
        best known for his many appearances as Tevye in the musical Fiddler
        on the Roof.
        `
    }
};
// STEP_END

// STEP_START add_data
const client = createClient({ url: 'redis://localhost:6379' });

client.on('error', err => console.log('Redis Client Error', err));
await client.connect();

for (const [name, details] of Object.entries(peopleData)) {
    const embedding = await pipe(details.description, pipeOptions);
    const embeddingArray = Array.from(embedding.data);

    await client.vAdd('famousPeople', embeddingArray, name);
    await client.vSetAttr('famousPeople', name, JSON.stringify({
        born: details.born,
        died: details.died
    }));
}
// STEP_END

// STEP_START basic_query
const queryValue = "actors";

const queryEmbedding = await pipe(queryValue, pipeOptions);
const queryArray = Array.from(queryEmbedding.data);

const actorsResults = await client.vSim('famousPeople', queryArray);

console.log(`'actors': ${JSON.stringify(actorsResults)}`);
// >>> 'actors': ["Masako Natsume","Chaim Topol","Linus Pauling",
// "Marie Fredriksson","Maryam Mirzakhani","Freddie Mercury",
// "Marie Curie","Paul Erdos"]
// STEP_END

// STEP_START limited_query
const queryValue2 = "actors";

const queryEmbedding2 = await pipe(queryValue2, pipeOptions);
const queryArray2 = Array.from(queryEmbedding2.data);

const twoActorsResults = await client.vSim('famousPeople', queryArray2, {
    COUNT: 2
});

console.log(`'actors (2)': ${JSON.stringify(twoActorsResults)}`);
// >>> 'actors (2)': ["Masako Natsume","Chaim Topol"]
// STEP_END

// STEP_START entertainer_query
const queryValue3 = "entertainer";

const queryEmbedding3 = await pipe(queryValue3, pipeOptions);
const queryArray3 = Array.from(queryEmbedding3.data);

const entertainerResults = await client.vSim('famousPeople', queryArray3);

console.log(`'entertainer': ${JSON.stringify(entertainerResults)}`);
// >>> 'actors': ["Masako Natsume","Chaim Topol","Linus Pauling",
// "Marie Fredriksson","Maryam Mirzakhani","Freddie Mercury",
// "Marie Curie","Paul Erdos"]
// STEP_END

const queryValue4 = "science";

const queryEmbedding4 = await pipe(queryValue4, pipeOptions);
const queryArray4 = Array.from(queryEmbedding4.data);

const scienceResults = await client.vSim('famousPeople', queryArray4);

console.log(`'science': ${JSON.stringify(scienceResults)}`);
// >>> 'science': ["Linus Pauling","Marie Curie","Maryam Mirzakhani",
// "Paul Erdos","Marie Fredriksson","Masako Natsume","Freddie Mercury",
// "Chaim Topol"]

// STEP_START filtered_query
const queryValue5 = "science";

const queryEmbedding5 = await pipe(queryValue5, pipeOptions);
const queryArray5 = Array.from(queryEmbedding5.data);

const science2000Results = await client.vSim('famousPeople', queryArray5, {
    FILTER: '.died < 2000'
});

console.log(`'science2000': ${JSON.stringify(science2000Results)}`);
// >>> 'science2000': ["Linus Pauling","Marie Curie","Paul Erdos",
// "Masako Natsume","Freddie Mercury"]
// STEP_END

await client.quit();
