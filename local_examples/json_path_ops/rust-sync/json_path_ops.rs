// EXAMPLE: json_path_ops
#[cfg(test)]
mod json_path_ops_tests {
    use redis::{Commands, JsonCommands};
    use serde_json::json;

    #[test]
    fn run() {
        let mut r = match redis::Client::open("redis://127.0.0.1") {
            Ok(client) => {
                match client.get_connection() {
                    Ok(conn) => conn,
                    Err(e) => {
                        println!("Failed to connect to Redis: {e}");
                        return;
                    }
                }
            },
            Err(e) => {
                println!("Failed to create Redis client: {e}");
                return;
            }
        };

        // Clean up any existing data
        let _: Result<i32, _> = r.del("doc");

        // STEP_START filter_negation
        match r.json_set("doc", "$", &json!([{"a":1,"b":1},{"b":2},{"a":1},{"c":3}])) {
            Ok(res1) => {
                let res1: bool = res1;
                println!("{}", if res1 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res1);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$[?!@.a]") {
            Ok(res2) => {
                let res2: String = res2;
                println!("{res2}");    // >>> [{"b":2},{"c":3}]
                // REMOVE_START
                assert_eq!(res2, r#"[{"b":2},{"c":3}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$[?!(@.a==1)]") {
            Ok(res3) => {
                let res3: String = res3;
                println!("{res3}");    // >>> [{"b":2},{"c":3}]
                // REMOVE_START
                assert_eq!(res3, r#"[{"b":2},{"c":3}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$[?!@.a && @.b]") {
            Ok(res4) => {
                let res4: String = res4;
                println!("{res4}");    // >>> [{"b":2}]
                // REMOVE_START
                assert_eq!(res4, r#"[{"b":2}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START filter_literal_eq
        match r.json_set(
            "doc",
            "$",
            &json!({"arrs":[[1],[2],[1,2],[1,[2]]],"objs":[{"x":1},{"x":2},{"y":1}]}),
        ) {
            Ok(res5) => {
                let res5: bool = res5;
                println!("{}", if res5 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res5);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.arrs[?(@ == [1])]") {
            Ok(res6) => {
                let res6: String = res6;
                println!("{res6}");    // >>> [[1]]
                // REMOVE_START
                assert_eq!(res6, "[[1]]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.arrs[?(@ == [1,[2]])]") {
            Ok(res7) => {
                let res7: String = res7;
                println!("{res7}");    // >>> [[1,[2]]]
                // REMOVE_START
                assert_eq!(res7, "[[1,[2]]]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", r#"$.objs[?(@ == {"x":1})]"#) {
            Ok(res8) => {
                let res8: String = res8;
                println!("{res8}");    // >>> [{"x":1}]
                // REMOVE_START
                assert_eq!(res8, r#"[{"x":1}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START filter_arithmetic
        match r.json_set("doc", "$", &json!([{"a":2,"b":3},{"a":5,"b":2}])) {
            Ok(res9) => {
                let res9: bool = res9;
                println!("{}", if res9 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res9);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$[?@.a + 1 == 3]") {
            Ok(res10) => {
                let res10: String = res10;
                println!("{res10}");    // >>> [{"a":2,"b":3}]
                // REMOVE_START
                assert_eq!(res10, r#"[{"a":2,"b":3}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$[?@.a + @.b * 2 == 8]") {
            Ok(res11) => {
                let res11: String = res11;
                println!("{res11}");    // >>> [{"a":2,"b":3}]
                // REMOVE_START
                assert_eq!(res11, r#"[{"a":2,"b":3}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$[?(@.a + @.b) * 2 == 10]") {
            Ok(res12) => {
                let res12: String = res12;
                println!("{res12}");    // >>> [{"a":2,"b":3}]
                // REMOVE_START
                assert_eq!(res12, r#"[{"a":2,"b":3}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START filter_membership
        match r.json_set("doc", "$", &json!({"a":[1,2,3,4],"allow":[2,3]})) {
            Ok(res13) => {
                let res13: bool = res13;
                println!("{}", if res13 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res13);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?@ in [2,4]]") {
            Ok(res14) => {
                let res14: String = res14;
                println!("{res14}");    // >>> [2,4]
                // REMOVE_START
                assert_eq!(res14, "[2,4]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?@ nin [2,4]]") {
            Ok(res15) => {
                let res15: String = res15;
                println!("{res15}");    // >>> [1,3]
                // REMOVE_START
                assert_eq!(res15, "[1,3]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?@ in $.allow]") {
            Ok(res16) => {
                let res16: String = res16;
                println!("{res16}");    // >>> [2,3]
                // REMOVE_START
                assert_eq!(res16, "[2,3]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START filter_set_relations
        match r.json_set("doc", "$", &json!({"a":[[1,2],[1,5],[]]})) {
            Ok(res17) => {
                let res17: bool = res17;
                println!("{}", if res17 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res17);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?@ subsetof [1,2,3]]") {
            Ok(res18) => {
                let res18: String = res18;
                println!("{res18}");    // >>> [[1,2],[]]
                // REMOVE_START
                assert_eq!(res18, "[[1,2],[]]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_set("doc", "$", &json!({"a":[[1,9],[8,9],[]]})) {
            Ok(res19) => {
                let res19: bool = res19;
                println!("{}", if res19 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res19);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?@ anyof [1,2,3]]") {
            Ok(res20) => {
                let res20: String = res20;
                println!("{res20}");    // >>> [[1,9]]
                // REMOVE_START
                assert_eq!(res20, "[[1,9]]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_set("doc", "$", &json!({"a":[[4,5],[1,9],[]]})) {
            Ok(res21) => {
                let res21: bool = res21;
                println!("{}", if res21 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res21);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?@ noneof [1,2,3]]") {
            Ok(res22) => {
                let res22: String = res22;
                println!("{res22}");    // >>> [[4,5],[]]
                // REMOVE_START
                assert_eq!(res22, "[[4,5],[]]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START filter_size_empty
        match r.json_set("doc", "$", &json!({"a":[[4,5],[1],[7,8,9]]})) {
            Ok(res23) => {
                let res23: bool = res23;
                println!("{}", if res23 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res23);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?@ sizeof 2]") {
            Ok(res24) => {
                let res24: String = res24;
                println!("{res24}");    // >>> [[4,5]]
                // REMOVE_START
                assert_eq!(res24, "[[4,5]]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_set("doc", "$", &json!({"a":[[],[1],"",[2,3],{},{"k":1}]})) {
            Ok(res25) => {
                let res25: bool = res25;
                println!("{}", if res25 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res25);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?@ empty true]") {
            Ok(res26) => {
                let res26: String = res26;
                println!("{res26}");    // >>> [[],"",{}]
                // REMOVE_START
                assert_eq!(res26, r#"[[],"",{}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?@ empty false]") {
            Ok(res27) => {
                let res27: String = res27;
                println!("{res27}");    // >>> [[1],[2,3],{"k":1}]
                // REMOVE_START
                assert_eq!(res27, r#"[[1],[2,3],{"k":1}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START filter_getkeys
        match r.json_set(
            "doc",
            "$",
            &json!({"obj":{"x":1,"y":2},"books":[{"t":"a"},{"t":"b"}]}),
        ) {
            Ok(res28) => {
                let res28: bool = res28;
                println!("{}", if res28 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res28);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.obj~") {
            Ok(res29) => {
                let res29: String = res29;
                println!("{res29}");    // >>> ["x","y"]
                // REMOVE_START
                assert_eq!(res29, r#"["x","y"]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$~") {
            Ok(res30) => {
                let res30: String = res30;
                println!("{res30}");    // >>> ["obj","books"]
                // REMOVE_START
                assert_eq!(res30, r#"["obj","books"]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.books~") {
            Ok(res31) => {
                let res31: String = res31;
                println!("{res31}");    // >>> []
                // REMOVE_START
                assert_eq!(res31, "[]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START func_length
        match r.json_set("doc", "$", &json!({"a":[[1,2,3],[1],"abcd","x"]})) {
            Ok(res32) => {
                let res32: bool = res32;
                println!("{}", if res32 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res32);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?length(@) > 2]") {
            Ok(res33) => {
                let res33: String = res33;
                println!("{res33}");    // >>> [[1,2,3],"abcd"]
                // REMOVE_START
                assert_eq!(res33, r#"[[1,2,3],"abcd"]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START func_count
        match r.json_set("doc", "$", &json!([{"a":1,"b":2,"c":3},{"a":1}])) {
            Ok(res34) => {
                let res34: bool = res34;
                println!("{}", if res34 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res34);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$[?count(@.*) == 3]") {
            Ok(res35) => {
                let res35: String = res35;
                println!("{res35}");    // >>> [{"a":1,"b":2,"c":3}]
                // REMOVE_START
                assert_eq!(res35, r#"[{"a":1,"b":2,"c":3}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START func_value
        match r.json_set("doc", "$", &json!([{"a":1},{"a":2}])) {
            Ok(res36) => {
                let res36: bool = res36;
                println!("{}", if res36 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res36);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$[?value(@.a) == 1]") {
            Ok(res37) => {
                let res37: String = res37;
                println!("{res37}");    // >>> [{"a":1}]
                // REMOVE_START
                assert_eq!(res37, r#"[{"a":1}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START func_keys
        match r.json_set("doc", "$", &json!({"obj":{"x":1,"y":2}})) {
            Ok(res38) => {
                let res38: bool = res38;
                println!("{}", if res38 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res38);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.obj.keys()") {
            Ok(res39) => {
                let res39: String = res39;
                println!("{res39}");    // >>> ["x","y"]
                // REMOVE_START
                assert_eq!(res39, r#"["x","y"]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.obj.keys().count()") {
            Ok(res40) => {
                let res40: String = res40;
                println!("{res40}");    // >>> [2]
                // REMOVE_START
                assert_eq!(res40, "[2]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START func_match_search
        match r.json_set("doc", "$", &json!({"a":["abc","xabc","a","b"]})) {
            Ok(res41) => {
                let res41: bool = res41;
                println!("{}", if res41 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res41);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", r#"$.a[?match(@, "a.*")]"#) {
            Ok(res42) => {
                let res42: String = res42;
                println!("{res42}");    // >>> ["abc","a"]
                // REMOVE_START
                assert_eq!(res42, r#"["abc","a"]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_set("doc", "$", &json!({"a":["abc","xyz","b"]})) {
            Ok(res43) => {
                let res43: bool = res43;
                println!("{}", if res43 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res43);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", r#"$.a[?search(@, "b")]"#) {
            Ok(res44) => {
                let res44: String = res44;
                println!("{res44}");    // >>> ["abc","b"]
                // REMOVE_START
                assert_eq!(res44, r#"["abc","b"]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START func_concat
        match r.json_set("doc", "$", &json!({"a":[{"x":"a","y":"b"},{"x":"a","y":"c"}]})) {
            Ok(res45) => {
                let res45: bool = res45;
                println!("{}", if res45 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res45);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", r#"$.a[?concat(@.x, @.y) == "ab"]"#) {
            Ok(res46) => {
                let res46: String = res46;
                println!("{res46}");    // >>> [{"x":"a","y":"b"}]
                // REMOVE_START
                assert_eq!(res46, r#"[{"x":"a","y":"b"}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START func_math
        match r.json_set("doc", "$", &json!({"a":[2.1,3.9,1.0]})) {
            Ok(res47) => {
                let res47: bool = res47;
                println!("{}", if res47 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res47);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?ceiling(@) == 3]") {
            Ok(res48) => {
                let res48: String = res48;
                println!("{res48}");    // >>> [2.1]
                // REMOVE_START
                assert_eq!(res48, "[2.1]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_set("doc", "$", &json!({"a":[2.1,2.9,3.5]})) {
            Ok(res49) => {
                let res49: bool = res49;
                println!("{}", if res49 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res49);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?floor(@) == 2]") {
            Ok(res50) => {
                let res50: String = res50;
                println!("{res50}");    // >>> [2.1,2.9]
                // REMOVE_START
                assert_eq!(res50, "[2.1,2.9]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_set("doc", "$", &json!({"a":[{"n":-5},{"n":5},{"n":-3}]})) {
            Ok(res51) => {
                let res51: bool = res51;
                println!("{}", if res51 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res51);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?abs(@.n) == 5]") {
            Ok(res52) => {
                let res52: String = res52;
                println!("{res52}");    // >>> [{"n":-5},{"n":5}]
                // REMOVE_START
                assert_eq!(res52, r#"[{"n":-5},{"n":5}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START func_array_access
        match r.json_set("doc", "$", &json!({"a":[{"n":[1,2]},{"n":[9,8]}]})) {
            Ok(res53) => {
                let res53: bool = res53;
                println!("{}", if res53 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res53);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?first(@.n) == 1]") {
            Ok(res54) => {
                let res54: String = res54;
                println!("{res54}");    // >>> [{"n":[1,2]}]
                // REMOVE_START
                assert_eq!(res54, r#"[{"n":[1,2]}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?last(@.n) == 8]") {
            Ok(res55) => {
                let res55: String = res55;
                println!("{res55}");    // >>> [{"n":[9,8]}]
                // REMOVE_START
                assert_eq!(res55, r#"[{"n":[9,8]}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?index(@.n, -1) == 2]") {
            Ok(res56) => {
                let res56: String = res56;
                println!("{res56}");    // >>> [{"n":[1,2]}]
                // REMOVE_START
                assert_eq!(res56, r#"[{"n":[1,2]}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START func_aggregate
        match r.json_set("doc", "$", &json!({"a":[{"n":[3,1,2]},{"n":[5,6]}]})) {
            Ok(res57) => {
                let res57: bool = res57;
                println!("{}", if res57 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res57);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?sum(@.n) == 6]") {
            Ok(res58) => {
                let res58: String = res58;
                println!("{res58}");    // >>> [{"n":[3,1,2]}]
                // REMOVE_START
                assert_eq!(res58, r#"[{"n":[3,1,2]}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?avg(@.n) == 2]") {
            Ok(res59) => {
                let res59: String = res59;
                println!("{res59}");    // >>> [{"n":[3,1,2]}]
                // REMOVE_START
                assert_eq!(res59, r#"[{"n":[3,1,2]}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

        // STEP_START func_append
        match r.json_set("doc", "$", &json!({"arr":[1,2,3]})) {
            Ok(res60) => {
                let res60: bool = res60;
                println!("{}", if res60 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res60);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.arr.append(9)") {
            Ok(res61) => {
                let res61: String = res61;
                println!("{res61}");    // >>> [1,2,3,9]
                // REMOVE_START
                assert_eq!(res61, "[1,2,3,9]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_set("doc", "$", &json!({"books":[{"t":"a","price":30},{"t":"b","price":5}]})) {
            Ok(res62) => {
                let res62: bool = res62;
                println!("{}", if res62 { "OK" } else { "(nil)" });    // >>> OK
                // REMOVE_START
                assert!(res62);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", r#"$.books[?(@.price >= 10)].append({"t":"X"})"#) {
            Ok(res63) => {
                let res63: String = res63;
                println!("{res63}");    // >>> [{"t":"a","price":30},{"t":"X"}]
                // REMOVE_START
                assert_eq!(res63, r#"[{"t":"a","price":30},{"t":"X"}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc");
        // REMOVE_END
        // STEP_END

    }
}
