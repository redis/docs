// EXAMPLE: cmds_hash

// STEP_START includes
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <hiredis/hiredis.h>
// STEP_END

int main(int argc, char **argv) {
    // STEP_START connect
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
    // STEP_END

    // REMOVE_START
    redisCommand(c, "DEL myhash");
    // REMOVE_END

    // STEP_START hmget
    redisReply *reply;

    // Set up hash with fields
    reply = redisCommand(c, "HSET %s %s %s %s %s",
        "myhash", "field1", "Hello", "field2", "World");
    freeReplyObject(reply);

    // Get multiple fields at once
    reply = redisCommand(c, "HMGET %s %s %s %s",
        "myhash", "field1", "field2", "nofield");

    printf("HMGET myhash field1 field2 nofield:\n");
    for (size_t i = 0; i < reply->elements; i++) {
        if (reply->element[i]->type == REDIS_REPLY_NIL) {
            printf("  [%zu]: null\n", i);
        } else {
            printf("  [%zu]: %s\n", i, reply->element[i]->str);
        }
    }
    // >>> [0]: Hello
    // >>> [1]: World
    // >>> [2]: null
    // STEP_END

    // REMOVE_START
    if (reply->elements != 3) {
        printf("ASSERTION FAILED: Expected 3 elements, got %zu\n", reply->elements);
    }
    if (strcmp(reply->element[0]->str, "Hello") != 0) {
        printf("ASSERTION FAILED: Expected 'Hello', got '%s'\n", reply->element[0]->str);
    }
    if (strcmp(reply->element[1]->str, "World") != 0) {
        printf("ASSERTION FAILED: Expected 'World', got '%s'\n", reply->element[1]->str);
    }
    if (reply->element[2]->type != REDIS_REPLY_NIL) {
        printf("ASSERTION FAILED: Expected nil for nofield\n");
    }
    // REMOVE_END

    freeReplyObject(reply);

    // REMOVE_START
    redisCommand(c, "DEL myhash");
    // REMOVE_END

    // STEP_START hlen
    // Add two new fields to the hash
    reply = redisCommand(c, "HSET %s %s %s", "myhash", "field1", "Hello");
    printf("HSET myhash field1 Hello: %lld\n", reply->integer); // >>> 1
    // REMOVE_START
    if (reply->integer != 1) {
        printf("ASSERTION FAILED: Expected 1, got %lld\n", reply->integer);
    }
    // REMOVE_END
    freeReplyObject(reply);

    reply = redisCommand(c, "HSET %s %s %s", "myhash", "field2", "World");
    printf("HSET myhash field2 World: %lld\n", reply->integer); // >>> 1
    // REMOVE_START
    if (reply->integer != 1) {
        printf("ASSERTION FAILED: Expected 1, got %lld\n", reply->integer);
    }
    // REMOVE_END
    freeReplyObject(reply);

    // Count the fields in the hash
    reply = redisCommand(c, "HLEN %s", "myhash");
    printf("HLEN myhash: %lld\n", reply->integer); // >>> 2
    // REMOVE_START
    if (reply->type != REDIS_REPLY_INTEGER) {
        printf("ASSERTION FAILED: Expected an integer reply for HLEN\n");
    }
    if (reply->integer != 2) {
        printf("ASSERTION FAILED: Expected 2, got %lld\n", reply->integer);
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    // REMOVE_START
    redisReply *del_reply = redisCommand(c, "DEL myhash");
    freeReplyObject(del_reply);
    // REMOVE_END

    // STEP_START disconnect
    redisFree(c);
    // STEP_END

    return 0;
}

