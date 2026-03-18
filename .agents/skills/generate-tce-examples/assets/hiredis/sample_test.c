// =============================================================================
// CANONICAL HIREDIS TEST FILE TEMPLATE
// =============================================================================
// This file demonstrates the structure and conventions used for hiredis
// documentation test files. These tests serve dual purposes:
// 1. Executable code that validates snippets
// 2. Source for documentation code examples (processed via special markers)
//
// MARKER REFERENCE:
// - EXAMPLE: <name>     - Identifies the example name (matches docs folder name)
// - BINDER_ID <id>      - Optional identifier for online code runners
// - HIDE_START/HIDE_END - Code hidden from documentation but executed in tests
// - REMOVE_START/REMOVE_END - Code removed entirely from documentation output
// - STEP_START <name>/STEP_END - Named code section for targeted doc inclusion
//
// BUILD: cc sample_test.c -L/usr/local/lib -lhiredis -o sample_test
// RUN: ./sample_test
// =============================================================================

// EXAMPLE: sample_example

// STEP_START includes
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <hiredis/hiredis.h>
// STEP_END

int main(int argc, char **argv) {
    // STEP_START connect
    // Connect to Redis server
    redisContext *c = redisConnect("127.0.0.1", 6379);

    if (c == NULL || c->err) {
        if (c) {
            printf("Connection error: %s\n", c->errstr);
            redisFree(c);
        } else {
            printf("Connection error: can't allocate redis context\n");
        }
        return 1;
    }

    printf("Connected to Redis\n");
    // STEP_END

    // REMOVE_START
    // Clean up any existing data before tests
    redisCommand(c, "DEL mykey myhash bike:1 bike:1:stats");
    // REMOVE_END

    // STEP_START string_ops
    // Basic string SET/GET operations
    redisReply *reply;

    reply = redisCommand(c, "SET %s %s", "mykey", "Hello");
    printf("SET mykey Hello: %s\n", reply->str); // >>> OK
    freeReplyObject(reply);

    reply = redisCommand(c, "GET %s", "mykey");
    printf("GET mykey: %s\n", reply->str); // >>> Hello
    // REMOVE_START
    if (strcmp(reply->str, "Hello") != 0) {
        printf("ASSERTION FAILED: Expected 'Hello', got '%s'\n", reply->str);
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    // REMOVE_START
    redisCommand(c, "DEL mykey");
    // REMOVE_END

    // STEP_START hash_ops
    // Hash operations: HSET, HGET, HGETALL
    reply = redisCommand(c, "HSET %s %s %s", "myhash", "field1", "value1");
    printf("HSET myhash field1 value1: %lld\n", reply->integer); // >>> 1
    freeReplyObject(reply);

    reply = redisCommand(c, "HSET %s %s %s %s %s", 
        "myhash", "field2", "value2", "field3", "value3");
    printf("HSET myhash field2 value2 field3 value3: %lld\n", reply->integer); // >>> 2
    freeReplyObject(reply);

    reply = redisCommand(c, "HGET %s %s", "myhash", "field1");
    printf("HGET myhash field1: %s\n", reply->str); // >>> value1
    // REMOVE_START
    if (strcmp(reply->str, "value1") != 0) {
        printf("ASSERTION FAILED: Expected 'value1', got '%s'\n", reply->str);
    }
    // REMOVE_END
    freeReplyObject(reply);

    reply = redisCommand(c, "HGETALL %s", "myhash");
    printf("HGETALL myhash:\n");
    for (size_t i = 0; i < reply->elements; i += 2) {
        printf("  %s: %s\n", reply->element[i]->str, reply->element[i+1]->str);
    }
    // >>> field1: value1
    // >>> field2: value2
    // >>> field3: value3
    freeReplyObject(reply);
    // STEP_END

    // REMOVE_START
    redisCommand(c, "DEL myhash");
    // REMOVE_END

    // STEP_START hash_tutorial
    // Tutorial-style example with bike data
    reply = redisCommand(c, "HSET %s %s %s %s %s %s %s %s %s",
        "bike:1",
        "model", "Deimos",
        "brand", "Ergonom",
        "type", "Enduro bikes",
        "price", "4972");
    printf("HSET bike:1 (4 fields): %lld\n", reply->integer); // >>> 4
    freeReplyObject(reply);

    reply = redisCommand(c, "HGET %s %s", "bike:1", "model");
    printf("HGET bike:1 model: %s\n", reply->str); // >>> Deimos
    // REMOVE_START
    if (strcmp(reply->str, "Deimos") != 0) {
        printf("ASSERTION FAILED: Expected 'Deimos', got '%s'\n", reply->str);
    }
    // REMOVE_END
    freeReplyObject(reply);

    reply = redisCommand(c, "HGET %s %s", "bike:1", "price");
    printf("HGET bike:1 price: %s\n", reply->str); // >>> 4972
    freeReplyObject(reply);
    // STEP_END

    // STEP_START hincrby
    // Numeric operations on hash fields
    reply = redisCommand(c, "HINCRBY %s %s %d", "bike:1:stats", "rides", 1);
    printf("HINCRBY bike:1:stats rides 1: %lld\n", reply->integer); // >>> 1
    freeReplyObject(reply);

    reply = redisCommand(c, "HINCRBY %s %s %d", "bike:1:stats", "rides", 1);
    printf("HINCRBY bike:1:stats rides 1: %lld\n", reply->integer); // >>> 2
    freeReplyObject(reply);

    reply = redisCommand(c, "HINCRBY %s %s %d", "bike:1:stats", "crashes", 1);
    printf("HINCRBY bike:1:stats crashes 1: %lld\n", reply->integer); // >>> 1
    freeReplyObject(reply);
    // STEP_END

    // REMOVE_START
    redisCommand(c, "DEL bike:1 bike:1:stats");
    // REMOVE_END

    // STEP_START disconnect
    // Disconnect from Redis
    redisFree(c);
    printf("Disconnected from Redis\n");
    // STEP_END

    return 0;
}

