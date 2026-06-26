// EXAMPLE: home_query_vec
// STEP_START import
import * as transformers from '@xenova/transformers';
import {
    VectorAlgorithms,
    createClient,
    SchemaFieldTypes,
} from 'redis';
// STEP_END

// STEP_START pipeline
let pipe = await transformers.pipeline(
    'feature-extraction', 'Xenova/all-distilroberta-v1'
);

const pipeOptions = {
    pooling: 'mean',
    normalize: true,
};
// STEP_END

// STEP_START connect
const client = createClient({url: 'redis://localhost:6379'});
await client.connect();

try { 
    await client.ft.dropIndex('vector_idx'); 
} catch (e) {
    // Index doesn't exist, which is fine
}
// STEP_END

// STEP_START create_index
await client.ft.create('vector_idx', {
    'content': {
        type: SchemaFieldTypes.TEXT,
    },
    'genre': {
        type: SchemaFieldTypes.TAG,
    },
    'embedding': {
        type: SchemaFieldTypes.VECTOR,
        TYPE: 'FLOAT32',
        ALGORITHM: VectorAlgorithms.HNSW,
        DISTANCE_METRIC: 'L2',
        DIM: 768,
    }
}, {
    ON: 'HASH',
    PREFIX: 'doc:'
});
// STEP_END

// STEP_START add_data
const sentence1 = 'That is a very happy person';
const doc1 = {
    'content': sentence1, 
    'genre': 'persons', 
    'embedding': Buffer.from(
        (await pipe(sentence1, pipeOptions)).data.buffer
    ),
};

const sentence2 = 'That is a happy dog';
const doc2 = {
    'content': sentence2, 
    'genre': 'pets', 
    'embedding': Buffer.from(
        (await pipe(sentence2, pipeOptions)).data.buffer
    )
};

const sentence3 = 'Today is a sunny day';
const doc3 = {
    'content': sentence3, 
    'genre': 'weather', 
    'embedding': Buffer.from(
        (await pipe(sentence3, pipeOptions)).data.buffer
    )
};

await Promise.all([
    client.hSet('doc:1', doc1),
    client.hSet('doc:2', doc2),
    client.hSet('doc:3', doc3)
]);
// STEP_END

// STEP_START query
const similar = await client.ft.search(
    'vector_idx',
    '*=>[KNN 3 @embedding $B AS score]',
    {
        'PARAMS': {
            B: Buffer.from(
                (await pipe('That is a happy person', pipeOptions)).data.buffer
            ),
        },
        'RETURN': ['score', 'content'],
        'DIALECT': '2'
    },
);

for (const doc of similar.documents) {
    console.log(`${doc.id}: '${doc.value.content}', Score: ${doc.value.score}`);
}
// STEP_END

try { 
    await client.ft.dropIndex('vector_json_idx'); 
} catch (e) {
    // Index doesn't exist, which is fine
}

// STEP_START json_index
await client.ft.create('vector_json_idx', {
    '$.content': {
        type: SchemaFieldTypes.TEXT,
        AS: 'content',
    },
    '$.genre': {
        type: SchemaFieldTypes.TAG,
        AS: 'genre',
    },
    '$.embedding': {
        type: SchemaFieldTypes.VECTOR,
        TYPE: 'FLOAT32',
        ALGORITHM: VectorAlgorithms.HNSW,
        DISTANCE_METRIC: 'L2',
        DIM: 768,
        AS: 'embedding',
    }
}, {
    ON: 'JSON',
    PREFIX: 'jdoc:'
});
// STEP_END

// STEP_START json_data
const jSentence1 = 'That is a very happy person';
const jdoc1 = {
    'content': jSentence1,
    'genre': 'persons',
    'embedding': [...(await pipe(jSentence1, pipeOptions)).data],
};

const jSentence2 = 'That is a happy dog';
const jdoc2 = {
    'content': jSentence2,
    'genre': 'pets',
    'embedding': [...(await pipe(jSentence2, pipeOptions)).data],
};

const jSentence3 = 'Today is a sunny day';
const jdoc3 = {
    'content': jSentence3,
    'genre': 'weather',
    'embedding': [...(await pipe(jSentence3, pipeOptions)).data],
};

await Promise.all([
    client.json.set('jdoc:1', '$', jdoc1),
    client.json.set('jdoc:2', '$', jdoc2),
    client.json.set('jdoc:3', '$', jdoc3)
]);
// STEP_END

// STEP_START json_query
const jsons = await client.ft.search(
    'vector_json_idx',
    '*=>[KNN 3 @embedding $B AS score]',
    {
        "PARAMS": {
            B: Buffer.from(
                (await pipe('That is a happy person', pipeOptions)).data.buffer
            ),
        },
        'RETURN': ['score', 'content'],
        'DIALECT': '2'
    },
);
// STEP_END

await client.quit();
