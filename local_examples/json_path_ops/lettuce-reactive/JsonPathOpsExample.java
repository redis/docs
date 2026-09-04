// EXAMPLE: json_path_ops
package io.redis.examples.reactive;

import io.lettuce.core.*;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.json.JsonPath;
import io.lettuce.core.json.JsonParser;
import io.lettuce.core.json.JsonObject;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;

public class JsonPathOpsExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();

            JsonParser parser = reactiveCommands.getJsonParser();

            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START filter_negation
            Mono<Void> filterNegationExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("[{\"a\":1,\"b\":1},{\"b\":2},{\"a\":1},{\"c\":3}]"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$[?!@.a]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[{"b":2},{"c":3}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"b\":2},{\"c\":3}]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonGet("doc", JsonPath.of("$[?!(@.a==1)]")).collectList())
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> [[{"b":2},{"c":3}]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[{\"b\":2},{\"c\":3}]]");
                        // REMOVE_END
                    })
                    .flatMap(res3 -> reactiveCommands.jsonGet("doc", JsonPath.of("$[?!@.a && @.b]")).collectList())
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> [[{"b":2}]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[{\"b\":2}]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            filterNegationExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START filter_literal_eq
            Mono<Void> filterLiteralEqExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue(
                                    "{\"arrs\":[[1],[2],[1,2],[1,[2]]],\"objs\":[{\"x\":1},{\"x\":2},{\"y\":1}]}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.arrs[?(@ == [1])]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[[1]]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[[1]]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.arrs[?(@ == [1,[2]])]")).collectList())
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> [[[1,[2]]]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[[1,[2]]]]");
                        // REMOVE_END
                    })
                    .flatMap(res3 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.objs[?(@ == {\"x\":1})]")).collectList())
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> [[{"x":1}]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[{\"x\":1}]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            filterLiteralEqExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START filter_arithmetic
            Mono<Void> filterArithmeticExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("[{\"a\":2,\"b\":3},{\"a\":5,\"b\":2}]"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$[?@.a + 1 == 3]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[{"a":2,"b":3}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"a\":2,\"b\":3}]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonGet("doc", JsonPath.of("$[?@.a + @.b * 2 == 8]")).collectList())
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> [[{"a":2,"b":3}]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[{\"a\":2,\"b\":3}]]");
                        // REMOVE_END
                    })
                    .flatMap(res3 -> reactiveCommands.jsonGet("doc", JsonPath.of("$[?(@.a + @.b) * 2 == 10]")).collectList())
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> [[{"a":2,"b":3}]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[{\"a\":2,\"b\":3}]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            filterArithmeticExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START filter_membership
            Mono<Void> filterMembershipExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"a\":[1,2,3,4],\"allow\":[2,3]}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?@ in [2,4]]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[2,4]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[2,4]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?@ nin [2,4]]")).collectList())
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> [[1,3]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[1,3]]");
                        // REMOVE_END
                    })
                    .flatMap(res3 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?@ in $.allow]")).collectList())
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> [[2,3]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[2,3]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            filterMembershipExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START filter_set_relations
            Mono<Void> filterSetRelationsExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"a\":[[1,2],[1,5],[]]}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?@ subsetof [1,2,3]]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[[1,2],[]]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[[1,2],[]]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[[1,9],[8,9],[]]}")))
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res3 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?@ anyof [1,2,3]]")).collectList())
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> [[[1,9]]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[[1,9]]]");
                        // REMOVE_END
                    })
                    .flatMap(res4 -> reactiveCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[[4,5],[1,9],[]]}")))
                    .doOnNext(res5 -> {
                        System.out.println(res5); // >>> OK
                        // REMOVE_START
                        assertThat(res5).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res5 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?@ noneof [1,2,3]]")).collectList())
                    .doOnNext(res6 -> {
                        System.out.println(res6); // >>> [[[4,5],[]]]
                        // REMOVE_START
                        assertThat(res6.toString()).isEqualTo("[[[4,5],[]]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            filterSetRelationsExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START filter_size_empty
            Mono<Void> filterSizeEmptyExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"a\":[[4,5],[1],[7,8,9]]}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?@ sizeof 2]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[[4,5]]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[[4,5]]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[[],[1],\"\",[2,3],{},{\"k\":1}]}")))
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res3 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?@ empty true]")).collectList())
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> [[[],"",{}]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[[],\"\",{}]]");
                        // REMOVE_END
                    })
                    .flatMap(res4 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?@ empty false]")).collectList())
                    .doOnNext(res5 -> {
                        System.out.println(res5); // >>> [[[1],[2,3],{"k":1}]]
                        // REMOVE_START
                        assertThat(res5.toString()).isEqualTo("[[[1],[2,3],{\"k\":1}]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            filterSizeEmptyExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START filter_getkeys
            Mono<Void> filterGetkeysExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"obj\":{\"x\":1,\"y\":2},\"books\":[{\"t\":\"a\"},{\"t\":\"b\"}]}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.obj~")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [["x","y"]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[\"x\",\"y\"]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonGet("doc", JsonPath.of("$~")).collectList())
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> [["obj","books"]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[\"obj\",\"books\"]]");
                        // REMOVE_END
                    })
                    .flatMap(res3 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.books~")).collectList())
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> [[]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            filterGetkeysExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START func_length
            Mono<Void> funcLengthExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[[1,2,3],[1],\"abcd\",\"x\"]}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?length(@) > 2]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[[1,2,3],"abcd"]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[[1,2,3],\"abcd\"]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            funcLengthExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START func_count
            Mono<Void> funcCountExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("[{\"a\":1,\"b\":2,\"c\":3},{\"a\":1}]"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$[?count(@.*) == 3]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[{"a":1,"b":2,"c":3}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"a\":1,\"b\":2,\"c\":3}]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            funcCountExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START func_value
            Mono<Void> funcValueExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("[{\"a\":1},{\"a\":2}]"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$[?value(@.a) == 1]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[{"a":1}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"a\":1}]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            funcValueExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START func_keys
            Mono<Void> funcKeysExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"obj\":{\"x\":1,\"y\":2}}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.obj.keys()")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [["x","y"]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[\"x\",\"y\"]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.obj.keys().count()")).collectList())
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> [[2]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[2]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            funcKeysExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START func_match_search
            Mono<Void> funcMatchSearchExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"a\":[\"abc\",\"xabc\",\"a\",\"b\"]}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?match(@, \"a.*\")]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [["abc","a"]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[\"abc\",\"a\"]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[\"abc\",\"xyz\",\"b\"]}")))
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res3 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?search(@, \"b\")]")).collectList())
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> [["abc","b"]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[\"abc\",\"b\"]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            funcMatchSearchExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START func_concat
            Mono<Void> funcConcatExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[{\"x\":\"a\",\"y\":\"b\"},{\"x\":\"a\",\"y\":\"c\"}]}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?concat(@.x, @.y) == \"ab\"]"))
                            .collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[{"x":"a","y":"b"}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"x\":\"a\",\"y\":\"b\"}]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            funcConcatExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START func_math
            Mono<Void> funcMathExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"a\":[2.1,3.9,1.0]}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?ceiling(@) == 3]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[2.1]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[2.1]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[2.1,2.9,3.5]}")))
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res3 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?floor(@) == 2]")).collectList())
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> [[2.1,2.9]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[2.1,2.9]]");
                        // REMOVE_END
                    })
                    .flatMap(res4 -> reactiveCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[{\"n\":-5},{\"n\":5},{\"n\":-3}]}")))
                    .doOnNext(res5 -> {
                        System.out.println(res5); // >>> OK
                        // REMOVE_START
                        assertThat(res5).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res5 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?abs(@.n) == 5]")).collectList())
                    .doOnNext(res6 -> {
                        System.out.println(res6); // >>> [[{"n":-5},{"n":5}]]
                        // REMOVE_START
                        assertThat(res6.toString()).isEqualTo("[[{\"n\":-5},{\"n\":5}]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            funcMathExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START func_array_access
            Mono<Void> funcArrayAccessExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"a\":[{\"n\":[1,2]},{\"n\":[9,8]}]}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?first(@.n) == 1]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[{"n":[1,2]}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"n\":[1,2]}]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?last(@.n) == 8]")).collectList())
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> [[{"n":[9,8]}]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[{\"n\":[9,8]}]]");
                        // REMOVE_END
                    })
                    .flatMap(res3 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?index(@.n, -1) == 2]")).collectList())
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> [[{"n":[1,2]}]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[{\"n\":[1,2]}]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            funcArrayAccessExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START func_aggregate
            Mono<Void> funcAggregateExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue("{\"a\":[{\"n\":[3,1,2]},{\"n\":[5,6]}]}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?sum(@.n) == 6]")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[{"n":[3,1,2]}]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[{\"n\":[3,1,2]}]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.a[?avg(@.n) == 2]")).collectList())
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> [[{"n":[3,1,2]}]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[[{\"n\":[3,1,2]}]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            funcAggregateExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

            // STEP_START func_append
            Mono<Void> funcAppendExample = reactiveCommands
                    .jsonSet("doc", JsonPath.ROOT_PATH, parser.createJsonValue("{\"arr\":[1,2,3]}"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res1 -> reactiveCommands.jsonGet("doc", JsonPath.of("$.arr.append(9)")).collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> [[1,2,3,9]]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[[1,2,3,9]]");
                        // REMOVE_END
                    })
                    .flatMap(res2 -> reactiveCommands.jsonSet("doc", JsonPath.ROOT_PATH,
                            parser.createJsonValue(
                                    "{\"books\":[{\"t\":\"a\",\"price\":30},{\"t\":\"b\",\"price\":5}]}")))
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .flatMap(res3 -> reactiveCommands
                            .jsonGet("doc", JsonPath.of("$.books[?(@.price >= 10)].append({\"t\":\"X\"})"))
                            .collectList())
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> [[{"t":"a","price":30},{"t":"X"}]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[[{\"t\":\"a\",\"price\":30},{\"t\":\"X\"}]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            funcAppendExample.block();
            // REMOVE_START
            reactiveCommands.del("doc").block();
            // REMOVE_END

        } finally {
            redisClient.shutdown();
        }
    }

}
