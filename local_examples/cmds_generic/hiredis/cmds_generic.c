// EXAMPLE: cmds_generic

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
    redisReply *del_reply = redisCommand(c, "DEL firstname lastname age");
    CHECK_REPLY(del_reply);
    freeReplyObject(del_reply);
    // REMOVE_END

    // STEP_START keys
    redisReply *reply;

    // Set up keys
    reply = redisCommand(c, "MSET %s %s %s %s %s %s",
        "firstname", "Jack", "lastname", "Stuntman", "age", "35");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("MSET firstname Jack lastname Stuntman age 35: %s\n", reply->str);
    // >>> OK
    freeReplyObject(reply);

    // Keys matching *name*
    reply = redisCommand(c, "KEYS %s", "*name*");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("KEYS *name*:\n");
    for (size_t i = 0; i < reply->elements; i++) {
        printf("  %s\n", reply->element[i]->str);
    }
    // >>> firstname
    // >>> lastname
    // REMOVE_START
    if (reply->elements != 2) {
        printf("ASSERTION FAILED: Expected 2 elements, got %zu\n", reply->elements);
        return 1;
    }
    // REMOVE_END
    freeReplyObject(reply);

    // Keys matching a??
    reply = redisCommand(c, "KEYS %s", "a??");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("KEYS a??:\n");
    for (size_t i = 0; i < reply->elements; i++) {
        printf("  %s\n", reply->element[i]->str);
    }
    // >>> age
    // REMOVE_START
    if (reply->elements != 1) {
        printf("ASSERTION FAILED: Expected 1 element, got %zu\n", reply->elements);
        return 1;
    }
    if (strcmp(reply->element[0]->str, "age") != 0) {
        printf("ASSERTION FAILED: Expected 'age', got '%s'\n", reply->element[0]->str);
        return 1;
    }
    // REMOVE_END
    freeReplyObject(reply);

    // All keys
    reply = redisCommand(c, "KEYS %s", "*");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("KEYS *:\n");
    for (size_t i = 0; i < reply->elements; i++) {
        printf("  %s\n", reply->element[i]->str);
    }
    // >>> age
    // >>> firstname
    // >>> lastname
    // REMOVE_START
    if (reply->elements != 3) {
        printf("ASSERTION FAILED: Expected 3 elements, got %zu\n", reply->elements);
        return 1;
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    // REMOVE_START
    reply = redisCommand(c, "DEL firstname lastname age");
    CHECK_REPLY(reply);
    freeReplyObject(reply);
    // REMOVE_END

    // STEP_START scan1
    reply = redisCommand(c, "SADD myset 1 2 3 foo foobar feelsgood");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 6
    freeReplyObject(reply);

    // SCAN-family replies are a two-element array: the next cursor, then the results.
    reply = redisCommand(c, "SSCAN myset 0 MATCH f*");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%zu\n", reply->element[1]->elements);
    // >>> 3
    // REMOVE_START
    if (reply->element[1]->elements != 3) {
        printf("ASSERTION FAILED: Expected 3 members, got %zu\n", reply->element[1]->elements);
        return 1;
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    // REMOVE_START
    reply = redisCommand(c, "DEL myset");
    CHECK_REPLY(reply);
    freeReplyObject(reply);

    for (int i = 1; i <= 1000; i++) {
        reply = redisCommand(c, "SET key:%d %d", i, i);
        CHECK_REPLY(reply);
        freeReplyObject(reply);
    }
    // REMOVE_END

    // STEP_START scan2
    // MATCH is applied after elements are fetched, so with the default COUNT most
    // iterations return few keys or none at all.
    char cursor[64] = "0";

    for (int i = 0; i < 4; i++) {
        reply = redisCommand(c, "SCAN %s MATCH *11*", cursor);
        // REMOVE_START
        CHECK_REPLY(reply);
        // REMOVE_END
        snprintf(cursor, sizeof(cursor), "%s", reply->element[0]->str);
        printf("%zu\n", reply->element[1]->elements);
        freeReplyObject(reply);
    }

    // A larger COUNT forces more scanning in a single iteration, so the remaining
    // matches arrive together. This continues from the cursor reached above.
    reply = redisCommand(c, "SCAN %s MATCH *11* COUNT 1000", cursor);
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%zu\n", reply->element[1]->elements);
    // >>> 18
    // REMOVE_START
    if (reply->element[1]->elements != 18) {
        printf("ASSERTION FAILED: Expected 18 keys, got %zu\n", reply->element[1]->elements);
        return 1;
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    // REMOVE_START
    reply = redisCommand(c, "FLUSHDB");
    CHECK_REPLY(reply);
    freeReplyObject(reply);
    // REMOVE_END

    // STEP_START scan3
    reply = redisCommand(c, "GEOADD geokey 0 0 value");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 1
    freeReplyObject(reply);

    reply = redisCommand(c, "ZADD zkey 1000 value");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 1
    freeReplyObject(reply);

    reply = redisCommand(c, "TYPE geokey");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%s\n", reply->str);
    // >>> zset
    freeReplyObject(reply);

    reply = redisCommand(c, "TYPE zkey");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%s\n", reply->str);
    // >>> zset
    freeReplyObject(reply);

    reply = redisCommand(c, "SCAN 0 TYPE zset");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%zu\n", reply->element[1]->elements);
    // >>> 2
    // REMOVE_START
    if (reply->element[1]->elements != 2) {
        printf("ASSERTION FAILED: Expected 2 keys, got %zu\n", reply->element[1]->elements);
        return 1;
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    // REMOVE_START
    reply = redisCommand(c, "DEL geokey zkey");
    CHECK_REPLY(reply);
    freeReplyObject(reply);
    // REMOVE_END

    // STEP_START scan4
    reply = redisCommand(c, "HSET myhash a 1 b 2");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 2
    freeReplyObject(reply);

    // Without NOVALUES the results alternate field, value, field, value.
    reply = redisCommand(c, "HSCAN myhash 0");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    for (size_t i = 0; i < reply->element[1]->elements; i += 2) {
        printf("%s=%s\n", reply->element[1]->element[i]->str,
                           reply->element[1]->element[i + 1]->str);
    }
    // >>> a=1
    // >>> b=2
    // REMOVE_START
    if (reply->element[1]->elements != 4) {
        printf("ASSERTION FAILED: Expected 4 entries, got %zu\n", reply->element[1]->elements);
        return 1;
    }
    // REMOVE_END
    freeReplyObject(reply);

    reply = redisCommand(c, "HSCAN myhash 0 NOVALUES");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    for (size_t i = 0; i < reply->element[1]->elements; i++) {
        printf("%s\n", reply->element[1]->element[i]->str);
    }
    // >>> a
    // >>> b
    // REMOVE_START
    if (reply->element[1]->elements != 2) {
        printf("ASSERTION FAILED: Expected 2 fields, got %zu\n", reply->element[1]->elements);
        return 1;
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    // REMOVE_START
    reply = redisCommand(c, "DEL myhash");
    CHECK_REPLY(reply);
    freeReplyObject(reply);
    // REMOVE_END

    // STEP_START del
    reply = redisCommand(c, "SET key1 Hello");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%s\n", reply->str);
    // >>> OK
    freeReplyObject(reply);

    reply = redisCommand(c, "SET key2 World");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%s\n", reply->str);
    // >>> OK
    freeReplyObject(reply);

    reply = redisCommand(c, "DEL key1 key2 key3");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 2
    // REMOVE_START
    if (reply->integer != 2) {
        printf("ASSERTION FAILED: Expected 2, got %lld\n", reply->integer);
        return 1;
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    // STEP_START exists
    reply = redisCommand(c, "SET key1 Hello");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%s\n", reply->str);
    // >>> OK
    freeReplyObject(reply);

    reply = redisCommand(c, "EXISTS key1");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 1
    freeReplyObject(reply);

    reply = redisCommand(c, "EXISTS nosuchkey");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 0
    freeReplyObject(reply);

    reply = redisCommand(c, "SET key2 World");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%s\n", reply->str);
    // >>> OK
    freeReplyObject(reply);

    reply = redisCommand(c, "EXISTS key1 key2 nosuchkey");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 2
    // REMOVE_START
    if (reply->integer != 2) {
        printf("ASSERTION FAILED: Expected 2, got %lld\n", reply->integer);
        return 1;
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    // REMOVE_START
    reply = redisCommand(c, "DEL key1 key2");
    CHECK_REPLY(reply);
    freeReplyObject(reply);
    // REMOVE_END

    // STEP_START expire
    reply = redisCommand(c, "SET mykey Hello");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%s\n", reply->str);
    // >>> OK
    freeReplyObject(reply);

    reply = redisCommand(c, "EXPIRE mykey 10");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 1
    freeReplyObject(reply);

    reply = redisCommand(c, "TTL mykey");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 10
    freeReplyObject(reply);

    // Overwriting a key with SET clears its expiry.
    reply = redisCommand(c, "SET mykey %s", "Hello World");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%s\n", reply->str);
    // >>> OK
    freeReplyObject(reply);

    reply = redisCommand(c, "TTL mykey");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> -1
    freeReplyObject(reply);

    // XX only sets the expiry when one already exists, so this is a no-op.
    reply = redisCommand(c, "EXPIRE mykey 10 XX");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 0
    freeReplyObject(reply);

    reply = redisCommand(c, "TTL mykey");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> -1
    freeReplyObject(reply);

    // NX only sets the expiry when there is none, so this one applies.
    reply = redisCommand(c, "EXPIRE mykey 10 NX");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 1
    freeReplyObject(reply);

    reply = redisCommand(c, "TTL mykey");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 10
    // REMOVE_START
    if (reply->integer != 10) {
        printf("ASSERTION FAILED: Expected TTL 10, got %lld\n", reply->integer);
        return 1;
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    // REMOVE_START
    reply = redisCommand(c, "DEL mykey");
    CHECK_REPLY(reply);
    freeReplyObject(reply);
    // REMOVE_END

    // STEP_START ttl
    reply = redisCommand(c, "SET mykey Hello");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%s\n", reply->str);
    // >>> OK
    freeReplyObject(reply);

    reply = redisCommand(c, "EXPIRE mykey 10");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 1
    freeReplyObject(reply);

    reply = redisCommand(c, "TTL mykey");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("%lld\n", reply->integer);
    // >>> 10
    // REMOVE_START
    if (reply->integer != 10) {
        printf("ASSERTION FAILED: Expected TTL 10, got %lld\n", reply->integer);
        return 1;
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    // REMOVE_START
    reply = redisCommand(c, "DEL mykey");
    CHECK_REPLY(reply);
    freeReplyObject(reply);
    // REMOVE_END

    // STEP_START disconnect
    redisFree(c);
    // STEP_END

    return 0;
}

