// EXAMPLE: landing
// BINDER_ID c-landing
// KERNEL_NAME c
// STEP_START connect
// The following comment is required to make the example interactive.
//%cflags:-lhiredis
#include <stdio.h>
#include <stdlib.h>

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

int main() {
    // The `redisContext` type represents the connection
    // to the Redis server. Here, we connect to the
    // default host and port.
    redisContext *c = redisConnect("127.0.0.1", 6379);

    // Check if the context is null or if a specific
    // error occurred.
    if (c == NULL || c->err) {
        if (c != NULL) {
            printf("Error: %s\n", c->errstr);
            // handle error
        } else {
            printf("Can't allocate redis context\n");
        }

        exit(1);
    }

    // Set a string key.
    redisReply *reply = redisCommand(c, "SET foo bar");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("Reply: %s\n", reply->str);
    freeReplyObject(reply);

    // Get the key we have just stored.
    reply = redisCommand(c, "GET foo");
    // REMOVE_START
    CHECK_REPLY(reply);
    // REMOVE_END
    printf("Reply: %s\n", reply->str);
    freeReplyObject(reply);

    // Close the connection.
    redisFree(c);
}
// STEP_END
