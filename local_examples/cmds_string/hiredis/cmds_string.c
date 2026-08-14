// EXAMPLE: cmds_string

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
    redisReply *cleanup = redisCommand(c, "DEL key1 key2 mykey nonexisting");
    // REMOVE_START
    CHECK_REPLY(cleanup);
    // REMOVE_END
    freeReplyObject(cleanup);
    // REMOVE_END

    // STEP_START mget
    redisReply *reply = redisCommand(c, "SET key1 Hello");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    freeReplyObject(reply);

    reply = redisCommand(c, "SET key2 World");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    freeReplyObject(reply);

    reply = redisCommand(c, "MGET key1 key2 nonexisting");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END

    for (size_t i = 0; i < reply->elements; i++) {
        if (i > 0) {
            printf(", ");
        }

        if (reply->element[i]->type == REDIS_REPLY_NIL) {
            printf("null");
        } else {
            printf("%s", reply->element[i]->str);
        }
    }
    printf("\n");
    // >>> Hello, World, null
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
        printf("ASSERTION FAILED: Expected nil for nonexisting\n");
    }
    // REMOVE_END

    freeReplyObject(reply);

    // STEP_START incr
    reply = redisCommand(c, "SET mykey 10");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%s\n", reply->str);
    // >>> OK
    freeReplyObject(reply);

    reply = redisCommand(c, "INCR mykey");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 11
    // REMOVE_START
    if (reply->integer != 11) {
        printf("ASSERTION FAILED: Expected 11, got %lld\n", reply->integer);
    }
    // REMOVE_END
    freeReplyObject(reply);

    reply = redisCommand(c, "GET mykey");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%s\n", reply->str);
    // >>> 11
    // REMOVE_START
    if (strcmp(reply->str, "11") != 0) {
        printf("ASSERTION FAILED: Expected '11', got '%s'\n", reply->str);
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    redisReply *cleanup2 = redisCommand(c, "DEL key1 key2 mykey nonexisting");
    // REMOVE_START
    CHECK_REPLY(cleanup2);
    // REMOVE_END
    freeReplyObject(cleanup2);

    // STEP_START disconnect
    redisFree(c);
    // STEP_END

    return 0;
}
