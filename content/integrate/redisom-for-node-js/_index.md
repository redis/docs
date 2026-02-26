---
LinkTitle: RedisOM for Node.js
Title: RedisOM for Node.js
categories:
- docs
- integrate
- oss
- rs
- rc
description: Learn how to build with Redis Stack and Node.js
group: library
stack: true
summary: Redis OM for Node.js is an object-mapping library for Redis.
title: Redis OM Node.js
type: integration
weight: 9
---

This tutorial will show you how to build a simple, RESTful API that reads, writes, and finds data on persons (including first name, last name, and  age) using Node.js and Redis Stack. You'll also add a simple location tracking feature for a bit of extra interest. You'll be using [Express](https://expressjs.com/) and [Redis OM](https://github.com/redis/redis-om-node) to do this.

## What is Redis OM?

Redis OM is an object-mapping library that provides high-level abstractions for working with Redis as a document database. You can use Redis OM to map Redis data types,specifically Hashes and JSON documents, to objects in your preferred programming language.

Redis OM leverages the JSON and Redis Query Engine features included in Redis Stack, enabling you to:

- **Model your data** as objects with schemas and validation
- **Store and retrieve** complex data structures seamlessly
- **Search and query** your data using full-text search, numeric ranges, and geospatial queries
- **Index your data** automatically for optimal query performance

With Redis OM, you work with familiar object-oriented patterns while Redis Stack handles the underlying data storage, indexing, and querying efficiently.

{{< note >}}
Redis Stack was replaced by Redis Open Source as of version 8.0.
{{< /note >}}

## Prerequisites

Like anything software-related, you need to have some dependencies installed before you can get started:

- [Node.js 14.8+](https://nodejs.org/en/): In this tutorial, we're using JavaScript's top-level `await` feature which was introduced in Node 14.8. So, make sure you are using that version or later.
- [Redis Stack]({{< relref "/operate/oss_and_stack/install/archive/install-stack/" >}}): You need a version of Redis Stack, either running locally on your machine or [in the cloud](https://redis.com/try-free/?utm_source=redisio&utm_medium=referral&utm_campaign=2023-09-try_free&utm_content=cu-redis_cloud_users).
- [Redis Insight](https://redis.com/redis-enterprise/redis-insight/): We'll use this to look inside Redis and make sure our code is doing what we think it's doing.


## Starter code

We're not going to code this completely from scratch. Instead, we've provided some starter code for you. Go ahead and clone it to a folder of your convenience:

    git clone git@github.com:redis-developer/express-redis-om-workshop.git

Now that you have the starter code, let's explore it a bit. Opening up `server.js` in the root we see that we have a simple Express app that uses [*Dotenv*](https://www.npmjs.com/package/dotenv) for configuration and [Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express) for testing our API:

{{< highlight javascript >}}
import 'dotenv/config'

import express from 'express'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'

/* create an express app and use JSON */
const app = new express()
app.use(express.json())

/* set up swagger in the root */
const swaggerDocument = YAML.load('api.yaml')
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

/* start the server */
app.listen(8080)
{{< / highlight >}}

Alongside this is `api.yaml`, which defines the API we're going to build and provides the information Swagger UI Express needs to render its UI. You don't need to mess with it unless you want to add some additional routes.

The `persons` folder has some JSON files and a shell script. The JSON files are sample persons—all musicians because fun—that you can load into the API to test it. The shell script—`load-data.sh`—will load all the JSON files into the API using `curl`.

There are two empty folders, `om` and `routers`. The `om` folder is where all the Redis OM code will go. The `routers` folder will hold code for all of our Express routes.


## Configure and run

The starter code is perfectly runnable if a bit thin. Let's configure and run it to make sure it works before we move on to writing actual code. First, get all the dependencies:

    npm install

Then, set up a `.env` file in the root that Dotenv can make use of. There's a `sample.env` file in the root that you can copy and modify:

    cp sample.env .env

The contents of `.env` looks like this:

{{< highlight bash >}}
# Put your local Redis Stack URL here. Want to run in the
# cloud instead? Sign up at https://redis.com/try-free/.
REDIS_URL=redis://localhost:6379
{{< / highlight >}}

There's a good chance this is already correct. However, if you need to change the `REDIS_URL` for your particular environment (e.g., you're running Redis Stack in the cloud), this is the time to do it. Once done, you should be able to run the app:

    npm start

Navigate to `http://localhost:8080` and check out the client that Swagger UI Express has created. None of it *works* yet because we haven't implemented any of the routes. But, you can try them out and watch them fail!

The starter code runs. Let's add some Redis OM to it so it actually *does* something!


## Setting up a Client

First things first, let's set up a **client**. The `Client` class is the thing that knows how to talk to Redis on behalf of Redis OM. One option is to put our client in its own file and export it. This ensures that the application has one and only one instance of `Client` and thus only one connection to Redis Stack. Since Redis and JavaScript are both (more or less) single-threaded, this works neatly.

Let's create our first file. In the `om` folder add a file called `client.js` and add the following code:

{{< highlight javascript >}}
import { Client } from 'redis-om'

/* pulls the Redis URL from .env */
const url = process.env.REDIS_URL

/* create and open the Redis OM Client */
const client = await new Client().open(url)

export default client
{{< / highlight >}}

> Remember that _top-level await_ stuff we mentioned earlier? There it is!

Note that we are getting our Redis URL from an environment variable. It was put there by Dotenv and read from our `.env` file. If we didn't have the `.env` file or have a `REDIS_URL` property in our `.env` file, this code would gladly read this value from the *actual* environment variables.

Also note that the `.open()` method conveniently returns `this`. This `this` (can I say *this* again? I just did!) lets us chain the instantiation of the client with the opening of the client. If this isn't to your liking, you could always write it like this:

{{< highlight javascript >}}
/* create and open the Redis OM Client */
const client = new Client()
await client.open(url)
{{< / highlight >}}


## Entity, Schema, and Repository

Now that we have a client that's connected to Redis, we need to start mapping some persons. To do that, we need to define an `Entity` and a `Schema`. Let's start by creating a file named `person.js` in the `om` folder and importing `client` from `client.js` and the `Entity` and `Schema` classes from Redis OM:

{{< highlight javascript >}}
import { Entity, Schema } from 'redis-om'
import client from './client.js'
{{< / highlight >}}

### Entity

Next, we need to define an **entity**. An `Entity` is the class that holds you data when you work with it—the thing being mapped to. It is what you create, read, update, and delete. Any class that extends `Entity` is an entity. We'll define our `Person` entity with a single line:

{{< highlight javascript >}}
/* our entity */
class Person extends Entity {}
{{< / highlight >}}

### Schema

A **schema** defines the fields on your entity, their types, and how they are mapped internally to Redis. By default, entities map to JSON documents. Let's create our `Schema` in `person.js`:

{{< highlight javascript >}}
/* create a Schema for Person */
const personSchema = new Schema(Person, {
  firstName: { type: 'string' },
  lastName: { type: 'string' },
  age: { type: 'number' },
  verified: { type: 'boolean' },
  location: { type: 'point' },
  locationUpdated: { type: 'date' },
  skills: { type: 'string[]' },
  personalStatement: { type: 'text' }
})
{{< / highlight >}}

When you create a `Schema`, it modifies the `Entity` class you handed it (`Person` in our case) adding getters and setters for the properties you define. The type those getters and setters accept and return are defined with the type parameter as shown above. Valid values are: `string`, `number`, `boolean`, `string[]`, `date`, `point`, and `text`.

The first three do exactly what you think—they define a property that is a [`String`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String), a [`Number`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number), or a [`Boolean`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean). `string[]` does what you'd think as well, specifically defining an [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of strings.

`date` is a little different, but still more or less what you'd expect. It defines a property that returns a [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) and can be set using not only a `Date` but also a `String` containing an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date or a `Number` with the [UNIX epoch time](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#the_ecmascript_epoch_and_timestamps) in *milliseconds*.

A `point` defines a point somewhere on the globe as a longitude and a latitude. It creates a property that returns and accepts a simple object with the properties of `longitude` and `latitude`. Like this:

{{< highlight javascript >}}
let point = { longitude: 12.34, latitude: 56.78 }
{{< / highlight >}}

A `text` field is a lot like a `string`. If you're just reading and writing objects, they are identical. But if you want to *search* on them, they are very, very different. We'll talk about search more later, but the tl;dr is that `string` fields can only be matched on their whole value—no partial matches—and are best for keys while `text` fields have full-text search enabled on them and are optimized for human-readable text.

### Repository

Now we have all the pieces that we need to create a **repository**. A `Repository` is the main interface into Redis OM. It gives us the methods to read, write, and remove a specific `Entity`. Create a `Repository` in `person.js` and make sure it's exported as you'll need it when we start implementing out API:

{{< highlight javascript >}}
/* use the client to create a Repository just for Persons */
export const personRepository = new Repository(personSchema, client)
{{< / highlight >}}

We're almost done with setting up our repository. But we still need to create an index or we won't be able to search. We do that by calling `.createIndex()`. If an index already exists and it's identical, this function won't do anything. If it's different, it'll drop it and create a new one. Add a call to `.createIndex()` to `person.js`:

{{< highlight javascript >}}
/* create the index for Person */
await personRepository.createIndex()
{{< / highlight >}}

That's all we need for `person.js` and all we need to start talking to Redis using Redis OM. Here's the code in its entirety:

{{< highlight javascript >}}
import { Entity, Schema } from 'redis-om'
import client from './client.js'

/* our entity */
class Person extends Entity {}

/* create a Schema for Person */
const personSchema = new Schema(Person, {
  firstName: { type: 'string' },
  lastName: { type: 'string' },
  age: { type: 'number' },
  verified: { type: 'boolean' },
  location: { type: 'point' },
  locationUpdated: { type: 'date' },
  skills: { type: 'string[]' },
  personalStatement: { type: 'text' }
})

/* use the client to create a Repository just for Persons */
export const personRepository = client.fetchRepository(personSchema)

/* create the index for Person */
await personRepository.createIndex()
{{< / highlight >}}

Now, let's add some routes in Express.


## Set up the Person Router

Let's create a truly RESTful API with the CRUD operations mapping to PUT, GET, POST, and DELETE respectively. We're going to do this using [Express Routers](https://expressjs.com/en/4x/api.html#router) as this makes our code nice and tidy. Create a file called `person-router.js` in the `routers` folder and in it import `Router` from Express and `personRepository` from `person.js`. Then create and export a `Router`:

{{< highlight javascript >}}
import { Router } from 'express'
import { personRepository } from '../om/person.js'

export const router = Router()
{{< / highlight >}}

Imports and exports done, let's bind the router to our Express app. Open up `server.js` and import the `Router` we just created:

{{< highlight javascript >}}
/* import routers */
import { router as personRouter } from './routers/person-router.js'
{{< / highlight >}}

Then add the `personRouter` to the Express app:

{{< highlight javascript >}}
/* bring in some routers */
app.use('/person', personRouter)
{{< / highlight >}}

Your `server.js` should now look like this:

{{< highlight javascript >}}
import 'dotenv/config'

import express from 'express'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'

/* import routers */
import { router as personRouter } from './routers/person-router.js'

/* create an express app and use JSON */
const app = new express()
app.use(express.json())

/* bring in some routers */
app.use('/person', personRouter)

/* set up swagger in the root */
const swaggerDocument = YAML.load('api.yaml')
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

/* start the server */
app.listen(8080)
{{< / highlight >}}

Now we can add our routes to create, read, update, and delete persons. Head back to the `person-router.js` file so we can do just that.


### Creating a Person

We'll create a person first as you need to have persons in Redis before you can do any of the reading, writing, or removing of them. Add the PUT route below. This route will call `.createAndSave()` to create a `Person` from the request body and immediately save it to the Redis:

{{< highlight javascript >}}
router.put('/', async (req, res) => {
  const person = await personRepository.createAndSave(req.body)
  res.send(person)
})
{{< / highlight >}}

Note that we are also returning the newly created `Person`. Let's see what that looks like by actually calling our API using the Swagger UI. Go to http://localhost:8080 in your browser and try it out. The default request body in Swagger will be fine for testing. You should see a response that looks like this:

{{< highlight json >}}
{
  "entityId": "01FY9MWDTWW4XQNTPJ9XY9FPMN",
  "firstName": "Rupert",
  "lastName": "Holmes",
  "age": 75,
  "verified": false,
  "location": {
    "longitude": 45.678,
    "latitude": 45.678
  },
  "locationUpdated": "2022-03-01T12:34:56.123Z",
  "skills": [
    "singing",
    "songwriting",
    "playwriting"
  ],
  "personalStatement": "I like piña coladas and walks in the rain"
}
{{< / highlight >}}

This is exactly what we handed it with one exception: the `entityId`. Every entity in Redis OM has an entity ID which is—as you've probably guessed—the unique ID of that entity. It was randomly generated when we called `.createAndSave()`. Yours will be different, so make note of it.

You can see this newly created JSON document in Redis with Redis Insight. Go ahead and launch Redis Insight and you should see a key with a name like `Person:01FY9MWDTWW4XQNTPJ9XY9FPMN`. The `Person` bit of the key was derived from the class name of our entity and the sequence of letters and numbers is our generated entity ID. Click on it to take a look at the JSON document you've created.

You'll also see a key named `Person:index:hash`. That's a unique value that Redis OM uses to see if it needs to recreate the index or not when `.createIndex()` is called. You can safely ignore it.


### Reading a Person

Create down, let's add a GET route to read this newly created `Person`:

{{< highlight javascript >}}
router.get('/:id', async (req, res) => {
  const person = await personRepository.fetch(req.params.id)
  res.send(person)
})
{{< / highlight >}}

This code extracts a parameter from the URL used in the route—the `entityId` that we received previously. It uses the `.fetch()` method on the `personRepository` to retrieve a `Person` using that `entityId`. Then, it returns that `Person`.

Let's go ahead and test that in Swagger as well. You should get back exactly the same response. In fact, since this is a simple GET, we should be able to just load the URL into our browser. Test that out too by navigating to http://localhost:8080/person/01FY9MWDTWW4XQNTPJ9XY9FPMN, replacing the entity ID with your own.

Now that we can read and write, let's implement the *REST* of the HTTP verbs. REST... get it?


### Updating a Person

Let's add the code to update a person using a POST route:

{{< highlight javascript >}}
router.post('/:id', async (req, res) => {

  const person = await personRepository.fetch(req.params.id)

  person.firstName = req.body.firstName ?? null
  person.lastName = req.body.lastName ?? null
  person.age = req.body.age ?? null
  person.verified = req.body.verified ?? null
  person.location = req.body.location ?? null
  person.locationUpdated = req.body.locationUpdated ?? null
  person.skills = req.body.skills ?? null
  person.personalStatement = req.body.personalStatement ?? null

  await personRepository.save(person)

  res.send(person)
})
{{< / highlight >}}

This code fetches the `Person` from the `personRepository` using the `entityId` just like our previous route did. However, now we change all the properties based on the properties in the request body. If any of them are missing, we set them to `null`. Then, we call `.save()` and return the changed `Person`.

Let's test this in Swagger too, why not? Make some changes. Try removing some of the fields. What do you get back when you read it after you've changed it?

### Deleting a Person

Deletion—my favorite! Remember kids, deletion is 100% compression. The route that deletes is just as straightforward as the one that reads, but much more destructive:

{{< highlight javascript >}}
router.delete('/:id', async (req, res) => {
  await personRepository.remove(req.params.id)
  res.send({ entityId: req.params.id })
})
{{< / highlight >}}

I guess we should probably test this one out too. Load up Swagger and exercise the route. You should get back JSON with the entity ID you just removed:

{{< highlight json >}}
{
  "entityId": "01FY9MWDTWW4XQNTPJ9XY9FPMN"
}
{{< / highlight >}}

And just like that, it's gone!


### All the CRUD

Do a quick check with what you've written so far. Here's what should be the totality of your `person-router.js` file:

{{< highlight javascript >}}
import { Router } from 'express'
import { personRepository } from '../om/person.js'

export const router = Router()

router.put('/', async (req, res) => {
  const person = await personRepository.createAndSave(req.body)
  res.send(person)
})

router.get('/:id', async (req, res) => {
  const person = await personRepository.fetch(req.params.id)
  res.send(person)
})

router.post('/:id', async (req, res) => {

  const person = await personRepository.fetch(req.params.id)

  person.firstName = req.body.firstName ?? null
  person.lastName = req.body.lastName ?? null
  person.age = req.body.age ?? null
  person.verified = req.body.verified ?? null
  person.location = req.body.location ?? null
  person.locationUpdated = req.body.locationUpdated ?? null
  person.skills = req.body.skills ?? null
  person.personalStatement = req.body.personalStatement ?? null

  await personRepository.save(person)

  res.send(person)
})

router.delete('/:id', async (req, res) => {
  await personRepository.remove(req.params.id)
  res.send({ entityId: req.params.id })
})
{{< / highlight >}}


## Preparing to search

CRUD completed, let's do some searching. In order to search, we need data to search over. Remember that `persons` folder with all the JSON documents and the `load-data.sh` shell script? Its time has arrived. Go into that folder and run the script:

    cd persons
    ./load-data.sh

You should get a rather verbose response containing the JSON response from the API and the names of the files you loaded. Like this:

{{< highlight json >}}
{"entityId":"01FY9Z4RRPKF4K9H78JQ3K3CP3","firstName":"Chris","lastName":"Stapleton","age":43,"verified":true,"location":{"longitude":-84.495,"latitude":38.03},"locationUpdated":"2022-01-01T12:00:00.000Z","skills":["singing","football","coal mining"],"personalStatement":"There are days that I can walk around like I'm alright. And I pretend to wear a smile on my face. And I could keep the pain from comin' out of my eyes. But sometimes, sometimes, sometimes I cry."} <- chris-stapleton.json
{"entityId":"01FY9Z4RS2QQVN4XFYSNPKH6B2","firstName":"David","lastName":"Paich","age":67,"verified":false,"location":{"longitude":-118.25,"latitude":34.05},"locationUpdated":"2022-01-01T12:00:00.000Z","skills":["singing","keyboard","blessing"],"personalStatement":"I seek to cure what's deep inside frightened of this thing that I've become"} <- david-paich.json
{"entityId":"01FY9Z4RSD7SQMSWDFZ6S4M5MJ","firstName":"Ivan","lastName":"Doroschuk","age":64,"verified":true,"location":{"longitude":-88.273,"latitude":40.115},"locationUpdated":"2022-01-01T12:00:00.000Z","skills":["singing","dancing","friendship"],"personalStatement":"We can dance if we want to. We can leave your friends behind. 'Cause your friends don't dance and if they don't dance well they're no friends of mine."} <- ivan-doroschuk.json
{"entityId":"01FY9Z4RSRZFGQ21BMEKYHEVK6","firstName":"Joan","lastName":"Jett","age":63,"verified":false,"location":{"longitude":-75.273,"latitude":40.003},"locationUpdated":"2022-01-01T12:00:00.000Z","skills":["singing","guitar","black eyeliner"],"personalStatement":"I love rock n' roll so put another dime in the jukebox, baby."} <- joan-jett.json
{"entityId":"01FY9Z4RT25ABWYTW6ZG7R79V4","firstName":"Justin","lastName":"Timberlake","age":41,"verified":true,"location":{"longitude":-89.971,"latitude":35.118},"locationUpdated":"2022-01-01T12:00:00.000Z","skills":["singing","dancing","half-time shows"],"personalStatement":"What goes around comes all the way back around."} <- justin-timberlake.json
{"entityId":"01FY9Z4RTD9EKBDS2YN9CRMG1D","firstName":"Kerry","lastName":"Livgren","age":72,"verified":false,"location":{"longitude":-95.689,"latitude":39.056},"locationUpdated":"2022-01-01T12:00:00.000Z","skills":["poetry","philosophy","songwriting","guitar"],"personalStatement":"All we are is dust in the wind."} <- kerry-livgren.json
{"entityId":"01FY9Z4RTR73HZQXK83JP94NWR","firstName":"Marshal","lastName":"Mathers","age":49,"verified":false,"location":{"longitude":-83.046,"latitude":42.331},"locationUpdated":"2022-01-01T12:00:00.000Z","skills":["rapping","songwriting","comics"],"personalStatement":"Look, if you had, one shot, or one opportunity to seize everything you ever wanted, in one moment, would you capture it, or just let it slip?"} <- marshal-mathers.json
{"entityId":"01FY9Z4RV2QHH0Z1GJM5ND15JE","firstName":"Rupert","lastName":"Holmes","age":75,"verified":true,"location":{"longitude":-2.518,"latitude":53.259},"locationUpdated":"2022-01-01T12:00:00.000Z","skills":["singing","songwriting","playwriting"],"personalStatement":"I like piña coladas and taking walks in the rain."} <- rupert-holmes.json
{{< / highlight >}}

A little messy, but if you don't see this, then it didn't work!

Now that we have some data, let's add another router to hold the search routes we want to add. Create a file named `search-router.js` in the routers folder and set it up with imports and exports just like we did in `person-router.js`:

{{< highlight javascript >}}
import { Router } from 'express'
import { personRepository } from '../om/person.js'

export const router = Router()
{{< / highlight >}}

Import the `Router` into `server.js` the same way we did for the `personRouter`:

{{< highlight javascript >}}
/* import routers */
import { router as personRouter } from './routers/person-router.js'
import { router as searchRouter } from './routers/search-router.js'
{{< / highlight >}}

Then add the `searchRouter` to the Express app:

{{< highlight javascript >}}
/* bring in some routers */
app.use('/person', personRouter)
app.use('/persons', searchRouter)
{{< / highlight >}}

Router bound, we can now add some routes.


### Search all the things

We're going to add a plethora of searches to our new `Router`. But the first will be the easiest as it's just going to return everything. Go ahead and add the following code to `search-router.js`:

{{< highlight javascript >}}
router.get('/all', async (req, res) => {
  const persons = await personRepository.search().return.all()
  res.send(persons)
})
{{< / highlight >}}

Here we see how to start and finish a search. Searches start just like CRUD operations start—on a `Repository`. But instead of calling `.createAndSave()`, `.fetch()`, `.save()`, or `.remove()`, we call `.search()`. And unlike all those other methods, `.search()` doesn't end there. Instead, it allows you to build up a query (which you'll see in the next example) and then resolve it with a call to `.return.all()`.

With this new route in place, go into the Swagger UI and exercise the `/persons/all` route. You should see all of the folks you added with the shell script as a JSON array.

In the example above, the query is not specified—we didn't build anything up. If you do this, you'll just get everything. Which is what you want sometimes. But not most of the time. It's not really searching if you just return everything. So let's add a route that lets us find persons by their last name. Add the following code:

{{< highlight javascript >}}
router.get('/by-last-name/:lastName', async (req, res) => {
  const lastName = req.params.lastName
  const persons = await personRepository.search()
    .where('lastName').equals(lastName).return.all()
  res.send(persons)
})
{{< / highlight >}}

In this route, we're specifying a field we want to filter on and a value that it needs to equal. The field name in the call to `.where()` is the name of the field specified in our schema. This field was defined as a `string`, which matters because the type of the field determines the methods that are available query it.

In the case of a `string`, there's just `.equals()`, which will query against the value of the entire string. This is aliased as `.eq()`, `.equal()`, and `.equalTo()` for your convenience. You can even add a little more syntactic sugar with calls to `.is` and `.does` that really don't do anything but make your code pretty. Like this:

{{< highlight javascript >}}
const persons = await personRepository.search().where('lastName').is.equalTo(lastName).return.all()
const persons = await personRepository.search().where('lastName').does.equal(lastName).return.all()
{{< / highlight >}}

You can also invert the query with a call to `.not`:

{{< highlight javascript >}}
const persons = await personRepository.search().where('lastName').is.not.equalTo(lastName).return.all()
const persons = await personRepository.search().where('lastName').does.not.equal(lastName).return.all()
{{< / highlight >}}

In all these cases, the call to `.return.all()` executes the query we build between it and the call to `.search()`. We can search on other field types as well. Let's add some routes to search on a `number` and a `boolean` field:

{{< highlight javascript >}}
router.get('/old-enough-to-drink-in-america', async (req, res) => {
  const persons = await personRepository.search()
    .where('age').gte(21).return.all()
  res.send(persons)
})

router.get('/non-verified', async (req, res) => {
  const persons = await personRepository.search()
    .where('verified').is.not.true().return.all()
  res.send(persons)
})
{{< / highlight >}}

The `number` field is filtering persons by age where the age is great than or equal to 21. Again, there are aliases and syntactic sugar:

{{< highlight javascript >}}
const persons = await personRepository.search().where('age').is.greaterThanOrEqualTo(21).return.all()
{{< / highlight >}}

But there are also more ways to query:

{{< highlight javascript >}}
const persons = await personRepository.search().where('age').eq(21).return.all()
const persons = await personRepository.search().where('age').gt(21).return.all()
const persons = await personRepository.search().where('age').gte(21).return.all()
const persons = await personRepository.search().where('age').lt(21).return.all()
const persons = await personRepository.search().where('age').lte(21).return.all()
const persons = await personRepository.search().where('age').between(21, 65).return.all()
{{< / highlight >}}

The `boolean` field is searching for persons by their verification status. It already has some of our syntactic sugar in it. Note that this query will match a missing value or a false value. That's why I specified `.not.true()`. You can also call `.false()` on boolean fields as well as all the variations of `.equals`.

{{< highlight javascript >}}
const persons = await personRepository.search().where('verified').true().return.all()
const persons = await personRepository.search().where('verified').false().return.all()
const persons = await personRepository.search().where('verified').equals(true).return.all()
{{< / highlight >}}

> So, we've created a few routes and I haven't told you to test them. Maybe you have anyhow. If so, good for you, you rebel. For the rest of you, why don't you go ahead and test them now with Swagger? And, going forward, just test them when you want. Heck, create some routes of your own using the provided syntax and try those out too. Don't let me tell you how to live your life.

Of course, querying on just one field is never enough. Not a problem, Redis OM can handle `.and()` and `.or()` like in this route:

{{< highlight javascript >}}
router.get('/verified-drinkers-with-last-name/:lastName', async (req, res) => {
  const lastName = req.params.lastName
  const persons = await personRepository.search()
    .where('verified').is.true()
      .and('age').gte(21)
      .and('lastName').equals(lastName).return.all()
  res.send(persons)
})
{{< / highlight >}}

Here, I'm just showing the syntax for `.and()` but, of course, you can also use `.or()`.


### Full-text search

If you've defined a field with a type of `text` in your schema, you can perform full-text searches against it. The way a `text` field is searched is different from how a `string` is searched. A `string` can only be compared with `.equals()` and must match the entire string. With a `text` field, you can look for words within the string.

A `text` field is optimized for human-readable text, like an essay or song lyrics. It's pretty clever. It understands that certain words (like *a*, *an*, or *the*) are common and ignores them. It understands how words are grammatically similar and so if you search for *give*, it matches *gives*, *given*, *giving*, and *gave* too. And it ignores punctuation.

Let's add a route that does full-text search against our `personalStatement` field:

{{< highlight javascript >}}
router.get('/with-statement-containing/:text', async (req, res) => {
  const text = req.params.text
  const persons = await personRepository.search()
    .where('personalStatement').matches(text)
      .return.all()
  res.send(persons)
})
{{< / highlight >}}

Note the use of the `.matches()` function. This is the only one that works with `text` fields. It takes a string that can be one or more words—space-delimited—that you want to query for. Let's try it out. In Swagger, use this route to search for the word "walk". You should get the following results:

{{< highlight json >}}
[
  {
    "entityId": "01FYC7CTR027F219455PS76247",
    "firstName": "Rupert",
    "lastName": "Holmes",
    "age": 75,
    "verified": true,
    "location": {
      "longitude": -2.518,
      "latitude": 53.259
    },
    "locationUpdated": "2022-01-01T12:00:00.000Z",
    "skills": [
      "singing",
      "songwriting",
      "playwriting"
    ],
    "personalStatement": "I like piña coladas and taking walks in the rain."
  },
  {
    "entityId": "01FYC7CTNBJD9CZKKWPQEZEW14",
    "firstName": "Chris",
    "lastName": "Stapleton",
    "age": 43,
    "verified": true,
    "location": {
      "longitude": -84.495,
      "latitude": 38.03
    },
    "locationUpdated": "2022-01-01T12:00:00.000Z",
    "skills": [
      "singing",
      "football",
      "coal mining"
    ],
    "personalStatement": "There are days that I can walk around like I'm alright. And I pretend to wear a smile on my face. And I could keep the pain from comin' out of my eyes. But sometimes, sometimes, sometimes I cry."
  }
]
{{< / highlight >}}

Notice how the word "walk" is matched for Rupert Holmes' personal statement that contains "walks" *and* matched for Chris Stapleton's that contains "walk". Now search "walk raining". You'll see that this returns Rupert's entry only even though the exact text of neither of these words is found in his personal statement. But they are *grammatically* related so it matched them. This is called stemming and it's a pretty cool feature of Redis Stack that Redis OM exploits.

And if you search for "a rain walk" you'll *still* match Rupert's entry even though the word "a" is not in the text. Why? Because it's a common word that's not very helpful with searching. These common words are called stop words and this is another cool feature of Redis Stack that Redis OM just gets for free.


### Searching the globe

Redis Stack, and therefore Redis OM, both support searching by geographic location. You specify a point in the globe, a radius, and the units for that radius and it'll gleefully return all the entities therein. Let's add a route to do just that:

{{< highlight javascript >}}
router.get('/near/:lng,:lat/radius/:radius', async (req, res) => {
  const longitude = Number(req.params.lng)
  const latitude = Number(req.params.lat)
  const radius = Number(req.params.radius)

  const persons = await personRepository.search()
    .where('location')
      .inRadius(circle => circle
          .longitude(longitude)
          .latitude(latitude)
          .radius(radius)
          .miles)
        .return.all()

  res.send(persons)
})
{{< / highlight >}}

This code looks a little different than the others because the way we define the circle we want to search is done with a function that is passed into the `.inRadius` method:

{{< highlight javascript >}}
circle => circle.longitude(longitude).latitude(latitude).radius(radius).miles
{{< / highlight >}}

All this function does is accept an instance of a [`Circle`](https://github.com/redis/redis-om-node/blob/main/docs/classes/Circle.md) that has been initialized with default values. We override those values by calling various builder methods to define the origin of our search (i.e. the longitude and latitude), the radius, and the units that radius is measured in. Valid units are `miles`, `meters`, `feet`, and `kilometers`.

Let's try the route out. I know we can find Joan Jett at around longitude -75.0 and latitude 40.0, which is in eastern Pennsylvania. So use those coordinates with a radius of 20 miles. You should receive in response:

{{< highlight json >}}
[
  {
    "entityId": "01FYC7CTPKYNXQ98JSTBC37AS1",
    "firstName": "Joan",
    "lastName": "Jett",
    "age": 63,
    "verified": false,
    "location": {
      "longitude": -75.273,
      "latitude": 40.003
    },
    "locationUpdated": "2022-01-01T12:00:00.000Z",
    "skills": [
      "singing",
      "guitar",
      "black eyeliner"
    ],
    "personalStatement": "I love rock n' roll so put another dime in the jukebox, baby."
  }
]
{{< / highlight >}}

Try widening the radius and see who else you can find.


## Adding location tracking

We're getting toward the end of the tutorial here, but before we go, I'd like to add that location tracking piece that I mentioned way back in the beginning. This next bit of code should be easily understood if you've gotten this far as it's not really doing anything I haven't talked about already.

Add a new file called `location-router.js` in the `routers` folder:

{{< highlight javascript >}}
import { Router } from 'express'
import { personRepository } from '../om/person.js'

export const router = Router()

router.patch('/:id/location/:lng,:lat', async (req, res) => {

  const id = req.params.id
  const longitude = Number(req.params.lng)
  const latitude = Number(req.params.lat)

  const locationUpdated = new Date()

  const person = await personRepository.fetch(id)
  person.location = { longitude, latitude }
  person.locationUpdated = locationUpdated
  await personRepository.save(person)

  res.send({ id, locationUpdated, location: { longitude, latitude } })
})
{{< / highlight >}}

Here we're calling `.fetch()` to fetch a person, we're updating some values for that person—the `.location` property with our longitude and latitude and the `.locationUpdated` property with the current date and time. Easy stuff.

To use this `Router`, import it in `server.js`:

{{< highlight javascript >}}
/* import routers */
import { router as personRouter } from './routers/person-router.js'
import { router as searchRouter } from './routers/search-router.js'
import { router as locationRouter } from './routers/location-router.js'
{{< / highlight >}}

And bind the router to a path:

{{< highlight javascript >}}
/* bring in some routers */
app.use('/person', personRouter, locationRouter)
app.use('/persons', searchRouter)
{{< / highlight >}}

And that's that. But this just isn't enough to satisfy. It doesn't show you anything new, except maybe the usage of a `date` field. And, it's not really location *tracking*. It just shows where these people last were, no history. So let's add some!.

To add some history, we're going to use a [Redis Stream]({{< relref "/develop/data-types/streams" >}}). Streams are a big topic but don't worry if you’re not familiar with them, you can think of them as being sort of like a log file stored in a Redis key where each entry represents an event. In our case, the event would be the person moving about or checking in or whatever.

But there's a problem. Redis OM doesn’t support Streams even though Redis Stack does. So how do we take advantage of them in our application? By using [Node Redis](https://github.com/redis/node-redis). Node Redis is a low-level Redis client for Node.js that gives you access to all the Redis commands and data types. Internally, Redis OM is creating and using a Node Redis connection. You can use that connection too. Or rather, Redis OM can be *told* to use the connection you are using. Let me show you how.


## Using Node Redis

Open up `client.js` in the `om` folder. Remember how we created a Redis OM `Client` and then called `.open()` on it?

{{< highlight javascript >}}
const client = await new Client().open(url)
{{< / highlight >}}

Well, the `Client` class also has a `.use()` method that takes a Node Redis connection. Modify `client.js` to open a connection to Redis using Node Redis and then `.use()` it:

{{< highlight javascript >}}
import { Client } from 'redis-om'
import { createClient } from 'redis'

/* pulls the Redis URL from .env */
const url = process.env.REDIS_URL

/* create a connection to Redis with Node Redis */
export const connection = createClient({ url })
await connection.connect()

/* create a Client and bind it to the Node Redis connection */
const client = await new Client().use(connection)

export default client
{{< / highlight >}}

And that's it. Redis OM is now using the `connection` you created. Note that we are exporting both the `client` *and* the `connection`. Got to export the `connection` if we want to use it in our newest route.


## Storing location history with Streams

To add an event to a Stream we need to use the [XADD]({{< relref "/commands/xadd" >}}) command. Node Redis exposes that as `.xAdd()`. So, we need to add a call to `.xAdd()` in our route. Modify `location-router.js` to import our `connection`:

{{< highlight javascript >}}
import { connection } from '../om/client.js'
{{< / highlight >}}

And then in the route itself add a call to `.xAdd()`:

{{< highlight javascript >}}
  ...snip...
  const person = await personRepository.fetch(id)
  person.location = { longitude, latitude }
  person.locationUpdated = locationUpdated
  await personRepository.save(person)

  let keyName = `${person.keyName}:locationHistory`
  await connection.xAdd(keyName, '*', person.location)
  ...snip...
{{< / highlight >}}

`.xAdd()` takes a key name, an event ID, and a JavaScript object containing the keys and values that make up the event, i.e. the event data. For the key name, we're building a string using the `.keyName` property that `Person` inherited from `Entity` (which will return something like `Person:01FYC7CTPKYNXQ98JSTBC37AS1`) combined with a hard-coded value. We're passing in `*` for our event ID, which tells Redis to just generate it based on the current time and previous event ID. And we're passing in the location—with properties of longitude and latitude—as our event data.

Now, whenever this route is exercised, the longitude and latitude will be logged and the event ID will encode the time. Go ahead and use Swagger to move Joan Jett around a few times.

Now, go into Redis Insight and take a look at the Stream. You'll see it there in the list of keys but if you click on it, you'll get a message saying that "This data type is coming soon!". If you don't get this message, congratulations, you live in the future! For us here in the past, we'll just issue the raw command instead:

    XRANGE Person:01FYC7CTPKYNXQ98JSTBC37AS1:locationHistory - +

This tells Redis to get a range of values from a Stream stored in the given the key name—`Person:01FYC7CTPKYNXQ98JSTBC37AS1:locationHistory` in our example. The next values are the starting event ID and the ending event ID. `-` is the beginning of the Stream. `+` is the end. So this returns everything in the Stream:

    1) 1) "1647536562911-0"
      2) 1) "longitude"
          2) "45.678"
          3) "latitude"
          4) "45.678"
    2) 1) "1647536564189-0"
      2) 1) "longitude"
          2) "45.679"
          3) "latitude"
          4) "45.679"
    3) 1) "1647536565278-0"
      2) 1) "longitude"
          2) "45.680"
          3) "latitude"
          4) "45.680"

And just like that, we're tracking Joan Jett.


## Wrap-up

So, now you know how to use Express + Redis OM to build an API backed by Redis Stack. And, you've got yourself some pretty decent started code in the process. Good deal! If you want to learn more, you can check out the [documentation](https://github.com/redis/redis-om-node) for Redis OM. It covers the full breadth of Redis OM's features.

And thanks for taking the time to work through this. I sincerely hope you found it useful. If you have any questions, the [Redis Discord server](https://discord.gg/redis) is by far the best place to get them answered. Join the server and ask away!
