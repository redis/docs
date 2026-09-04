// EXAMPLE: json_path_ops
package io.redis.examples.async;

import io.lettuce.core.*;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.json.JsonPath;
import io.lettuce.core.json.JsonParser;
import io.lettuce.core.json.JsonObject;

import java.util.concurrent.CompletableFuture;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class JsonPathOpsExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // REMOVE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
        // REMOVE_END

            JsonParser parser = asyncCommands.getJsonParser();

            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START filter_negation
            CompletableFuture<Void> filterNegationExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("[{\"a\":1,\"b\":1},{\"b\":2},{\"a\":1},{\"c\":3}]"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$[?!@.a]"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [[{"b":2},{"c":3}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"b\":2},{\"c\":3}]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$[?!(@.a==1)]"));
                    }).thenCompose(res3 -> {
                        System.out.println(res3); // >>> [[{"b":2},{"c":3}]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[{\"b\":2},{\"c\":3}]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$[?!@.a && @.b]"));
                    }).thenAccept(res4 -> {
                        System.out.println(res4); // >>> [[{"b":2}]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[{\"b\":2}]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            filterNegationExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START filter_literal_eq
            CompletableFuture<Void> filterLiteralEqExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue(
                                    "{\"arrs\":[[1],[2],[1,2],[1,[2]]],\"objs\":[{\"x\":1},{\"x\":2},{\"y\":1}]}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.arrs[?(@ == [1])]"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [[[1]]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[[1]]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.arrs[?(@ == [1,[2]])]"));
                    }).thenCompose(res3 -> {
                        System.out.println(res3); // >>> [[[1,[2]]]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[[1,[2]]]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.objs[?(@ == {\"x\":1})]"));
                    }).thenAccept(res4 -> {
                        System.out.println(res4); // >>> [[{"x":1}]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[{\"x\":1}]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            filterLiteralEqExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START filter_arithmetic
            CompletableFuture<Void> filterArithmeticExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("[{\"a\":2,\"b\":3},{\"a\":5,\"b\":2}]"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$[?@.a + 1 == 3]"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [[{"a":2,"b":3}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"a\":2,\"b\":3}]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$[?@.a + @.b * 2 == 8]"));
                    }).thenCompose(res3 -> {
                        System.out.println(res3); // >>> [[{"a":2,"b":3}]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[{\"a\":2,\"b\":3}]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$[?(@.a + @.b) * 2 == 10]"));
                    }).thenAccept(res4 -> {
                        System.out.println(res4); // >>> [[{"a":2,"b":3}]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[{\"a\":2,\"b\":3}]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            filterArithmeticExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START filter_membership
            CompletableFuture<Void> filterMembershipExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[1,2,3,4],\"allow\":[2,3]}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?@ in [2,4]]"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [[2,4]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[2,4]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?@ nin [2,4]]"));
                    }).thenCompose(res3 -> {
                        System.out.println(res3); // >>> [[1,3]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[1,3]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?@ in $.allow]"));
                    }).thenAccept(res4 -> {
                        System.out.println(res4); // >>> [[2,3]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[2,3]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            filterMembershipExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START filter_set_relations
            CompletableFuture<Void> filterSetRelationsExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"a\":[[1,2],[1,5],[]]}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?@ subsetof [1,2,3]]"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [[[1,2],[]]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[[1,2],[]]]");
                        // REMOVE_END
                        return asyncCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                                parser.createJsonValue("{\"a\":[[1,9],[8,9],[]]}"));
                    }).thenCompose(res3 -> {
                        System.out.println(res3); // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?@ anyof [1,2,3]]"));
                    }).thenCompose(res4 -> {
                        System.out.println(res4); // >>> [[[1,9]]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[[1,9]]]");
                        // REMOVE_END
                        return asyncCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                                parser.createJsonValue("{\"a\":[[4,5],[1,9],[]]}"));
                    }).thenCompose(res5 -> {
                        System.out.println(res5); // >>> OK
                        // REMOVE_START
                        assertThat(res5).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?@ noneof [1,2,3]]"));
                    }).thenAccept(res6 -> {
                        System.out.println(res6); // >>> [[[4,5],[]]]
                        // REMOVE_START
                        assertThat(res6.toString()).isEqualTo("[[[4,5],[]]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            filterSetRelationsExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START filter_size_empty
            CompletableFuture<Void> filterSizeEmptyExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"a\":[[4,5],[1],[7,8,9]]}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?@ sizeof 2]"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [[[4,5]]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[[4,5]]]");
                        // REMOVE_END
                        return asyncCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                                parser.createJsonValue("{\"a\":[[],[1],\"\",[2,3],{},{\"k\":1}]}"));
                    }).thenCompose(res3 -> {
                        System.out.println(res3); // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?@ empty true]"));
                    }).thenCompose(res4 -> {
                        System.out.println(res4); // >>> [[[],"",{}]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[[],\"\",{}]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?@ empty false]"));
                    }).thenAccept(res5 -> {
                        System.out.println(res5); // >>> [[[1],[2,3],{"k":1}]]
                        // REMOVE_START
                        assertThat(res5.toString()).isEqualTo("[[[1],[2,3],{\"k\":1}]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            filterSizeEmptyExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START filter_getkeys
            CompletableFuture<Void> filterGetkeysExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue(
                                    "{\"obj\":{\"x\":1,\"y\":2},\"books\":[{\"t\":\"a\"},{\"t\":\"b\"}]}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.obj~"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [["x","y"]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[\"x\",\"y\"]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$~"));
                    }).thenCompose(res3 -> {
                        System.out.println(res3); // >>> [["obj","books"]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[\"obj\",\"books\"]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.books~"));
                    }).thenAccept(res4 -> {
                        System.out.println(res4); // >>> [[]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            filterGetkeysExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START func_length
            CompletableFuture<Void> funcLengthExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[[1,2,3],[1],\"abcd\",\"x\"]}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?length(@) > 2]"));
                    }).thenAccept(res2 -> {
                        System.out.println(res2); // >>> [[[1,2,3],"abcd"]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[[1,2,3],\"abcd\"]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            funcLengthExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START func_count
            CompletableFuture<Void> funcCountExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("[{\"a\":1,\"b\":2,\"c\":3},{\"a\":1}]"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$[?count(@.*) == 3]"));
                    }).thenAccept(res2 -> {
                        System.out.println(res2); // >>> [[{"a":1,"b":2,"c":3}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"a\":1,\"b\":2,\"c\":3}]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            funcCountExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START func_value
            CompletableFuture<Void> funcValueExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("[{\"a\":1},{\"a\":2}]"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$[?value(@.a) == 1]"));
                    }).thenAccept(res2 -> {
                        System.out.println(res2); // >>> [[{"a":1}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"a\":1}]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            funcValueExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START func_keys
            CompletableFuture<Void> funcKeysExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"obj\":{\"x\":1,\"y\":2}}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.obj.keys()"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [["x","y"]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[\"x\",\"y\"]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.obj.keys().count()"));
                    }).thenAccept(res3 -> {
                        System.out.println(res3); // >>> [[2]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[2]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            funcKeysExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START func_match_search
            CompletableFuture<Void> funcMatchSearchExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[\"abc\",\"xabc\",\"a\",\"b\"]}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?match(@, \"a.*\")]"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [["abc","a"]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[\"abc\",\"a\"]]");
                        // REMOVE_END
                        return asyncCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                                parser.createJsonValue("{\"a\":[\"abc\",\"xyz\",\"b\"]}"));
                    }).thenCompose(res3 -> {
                        System.out.println(res3); // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?search(@, \"b\")]"));
                    }).thenAccept(res4 -> {
                        System.out.println(res4); // >>> [["abc","b"]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[\"abc\",\"b\"]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            funcMatchSearchExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START func_concat
            CompletableFuture<Void> funcConcatExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[{\"x\":\"a\",\"y\":\"b\"},{\"x\":\"a\",\"y\":\"c\"}]}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?concat(@.x, @.y) == \"ab\"]"));
                    }).thenAccept(res2 -> {
                        System.out.println(res2); // >>> [[{"x":"a","y":"b"}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"x\":\"a\",\"y\":\"b\"}]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            funcConcatExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START func_math
            CompletableFuture<Void> funcMathExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"a\":[2.1,3.9,1.0]}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?ceiling(@) == 3]"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [[2.1]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[2.1]]");
                        // REMOVE_END
                        return asyncCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                                parser.createJsonValue("{\"a\":[2.1,2.9,3.5]}"));
                    }).thenCompose(res3 -> {
                        System.out.println(res3); // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?floor(@) == 2]"));
                    }).thenCompose(res4 -> {
                        System.out.println(res4); // >>> [[2.1,2.9]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[2.1,2.9]]");
                        // REMOVE_END
                        return asyncCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                                parser.createJsonValue("{\"a\":[{\"n\":-5},{\"n\":5},{\"n\":-3}]}"));
                    }).thenCompose(res5 -> {
                        System.out.println(res5); // >>> OK
                        // REMOVE_START
                        assertThat(res5).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?abs(@.n) == 5]"));
                    }).thenAccept(res6 -> {
                        System.out.println(res6); // >>> [[{"n":-5},{"n":5}]]
                        // REMOVE_START
                        assertThat(res6.toString()).isEqualTo("[[{\"n\":-5},{\"n\":5}]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            funcMathExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START func_array_access
            CompletableFuture<Void> funcArrayAccessExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[{\"n\":[1,2]},{\"n\":[9,8]}]}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?first(@.n) == 1]"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [[{"n":[1,2]}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"n\":[1,2]}]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?last(@.n) == 8]"));
                    }).thenCompose(res3 -> {
                        System.out.println(res3); // >>> [[{"n":[9,8]}]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[{\"n\":[9,8]}]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?index(@.n, -1) == 2]"));
                    }).thenAccept(res4 -> {
                        System.out.println(res4); // >>> [[{"n":[1,2]}]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[{\"n\":[1,2]}]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            funcArrayAccessExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START func_aggregate
            CompletableFuture<Void> funcAggregateExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[{\"n\":[3,1,2]},{\"n\":[5,6]}]}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?sum(@.n) == 6]"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [[{"n":[3,1,2]}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"n\":[3,1,2]}]]");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.a[?avg(@.n) == 2]"));
                    }).thenAccept(res3 -> {
                        System.out.println(res3); // >>> [[{"n":[3,1,2]}]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[{\"n\":[3,1,2]}]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            funcAggregateExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START func_append
            CompletableFuture<Void> funcAppendExample = asyncCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"arr\":[1,2,3]}"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc", JsonPath.of("$.arr.append(9)"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> [[1,2,3,9]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[1,2,3,9]]");
                        // REMOVE_END
                        return asyncCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                                parser.createJsonValue(
                                        "{\"books\":[{\"t\":\"a\",\"price\":30},{\"t\":\"b\",\"price\":5}]}"));
                    }).thenCompose(res3 -> {
                        System.out.println(res3); // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.jsonGet("doc",
                                JsonPath.of("$.books[?(@.price >= 10)].append({\"t\":\"X\"})"));
                    }).thenAccept(res4 -> {
                        System.out.println(res4); // >>> [[{"t":"a","price":30},{"t":"X"}]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[{\"t\":\"a\",\"price\":30},{\"t\":\"X\"}]]");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            funcAppendExample.join();
            // REMOVE_START
            asyncCommands.del("doc").toCompletableFuture().join();
            // REMOVE_END

        } finally {
            redisClient.shutdown();
        }
    }

}
