// EXAMPLE: cmds_hash

// STEP_START includes
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <hiredis/hiredis.h>

// REMOVE_START
// Fail loudly on a NULL or error reply. hiredis returns an error REPLY (not a
// connection error) for things like a bad command, and the examples would
// otherwise print a wrong value and still exit 0 — a green harness run that
// proves nothing. Kept in a REMOVE block so the published example stays plain.
#define CHECK_REPLY(r) do { \
    if ((r) == NULL || (r)->type == REDIS_REPLY_ERROR) { \
        printf("REDIS ERROR: %s\n", (r) ? (r)->str : "no reply from server"); \
        return 1; \
    } \
} while (0)
// REMOVE_END
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
    redisReply *cleanup1 = redisCommand(c, "DEL myhash");
    CHECK_REPLY(cleanup1);
    freeReplyObject(cleanup1);
    // REMOVE_END

    // STEP_START hmget
    redisReply *reply;

    // Set up hash with fields
    reply = redisCommand(c, "HSET %s %s %s %s %s",
        "myhash", "field1", "Hello", "field2", "World");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    freeReplyObject(reply);

    // Get multiple fields at once
    reply = redisCommand(c, "HMGET %s %s %s %s",
        "myhash", "field1", "field2", "nofield");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END

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
    redisReply *cleanup2 = redisCommand(c, "DEL myhash");
    CHECK_REPLY(cleanup2);
    freeReplyObject(cleanup2);
    // REMOVE_END

    // STEP_START hlen
    // Add two new fields to the hash
    reply = redisCommand(c, "HSET %s %s %s", "myhash", "field1", "Hello");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("HSET myhash field1 Hello: %lld\n", reply->integer); // >>> 1
    // REMOVE_START
    if (reply->integer != 1) {
        printf("ASSERTION FAILED: Expected 1, got %lld\n", reply->integer);
    }
    // REMOVE_END
    freeReplyObject(reply);

    reply = redisCommand(c, "HSET %s %s %s", "myhash", "field2", "World");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("HSET myhash field2 World: %lld\n", reply->integer); // >>> 1
    // REMOVE_START
    if (reply->integer != 1) {
        printf("ASSERTION FAILED: Expected 1, got %lld\n", reply->integer);
    }
    // REMOVE_END
    freeReplyObject(reply);

    // Count the fields in the hash
    reply = redisCommand(c, "HLEN %s", "myhash");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
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
    // REMOVE_START
    CHECK_REPLY(del_reply);
    // REMOVE_END
    freeReplyObject(del_reply);
    // REMOVE_END

    // STEP_START disconnect
    redisFree(c);
    // STEP_END

    return 0;
}

