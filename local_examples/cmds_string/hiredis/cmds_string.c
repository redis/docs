// EXAMPLE: cmds_string

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
    redisReply *cleanup = redisCommand(c, "DEL key1 key2 nonexisting");
    freeReplyObject(cleanup);
    // REMOVE_END

    // STEP_START mget
    redisReply *reply = redisCommand(c, "SET key1 Hello");
    freeReplyObject(reply);

    reply = redisCommand(c, "SET key2 World");
    freeReplyObject(reply);

    reply = redisCommand(c, "MGET key1 key2 nonexisting");

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
    freeReplyObject(reply);

    cleanup = redisCommand(c, "DEL key1 key2 nonexisting");
    freeReplyObject(cleanup);
    // REMOVE_END

    // STEP_START disconnect
    redisFree(c);
    // STEP_END

    return 0;
}
