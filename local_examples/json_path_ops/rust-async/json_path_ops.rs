// EXAMPLE: json_path_ops
#[cfg(test)]
mod json_path_ops_tests {
    use redis::{AsyncCommands, JsonAsyncCommands};
    use serde_json::json;

    #[tokio::test]
    async fn run() {
        let mut r = match redis::Client::open("redis://127.0.0.1") {
            Ok(client) => {
                match client.get_multiplexed_async_connection().await {
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
        let _: Result<i32, _> = r.del("doc").await;

        // STEP_START filter_negation
        let _: bool = match r.json_set("doc", "$", &json!([{"a":1,"b":1},{"b":2},{"a":1},{"c":3}])).await {
            Ok(v) => v,
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        };

        match r.json_get("doc", "$[?!@.a]").await {
            Ok(res1) => {
                let res1: String = res1;
                println!("{res1}");    // >>> [{"b":2},{"c":3}]
                // REMOVE_START
                assert_eq!(res1, r#"[{"b":2},{"c":3}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$[?!(@.a==1)]").await {
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

        match r.json_get("doc", "$[?!@.a && @.b]").await {
            Ok(res3) => {
                let res3: String = res3;
                println!("{res3}");    // >>> [{"b":2}]
                // REMOVE_START
                assert_eq!(res3, r#"[{"b":2}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc").await;
        // REMOVE_END
        // STEP_END

        // STEP_START filter_literal_eq
        let _: bool = match r.json_set(
            "doc",
            "$",
            &json!({"arrs":[[1],[2],[1,2],[1,[2]]],"objs":[{"x":1},{"x":2},{"y":1}]}),
        ).await {
            Ok(v) => v,
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        };

        match r.json_get("doc", "$.arrs[?(@ == [1])]").await {
            Ok(res4) => {
                let res4: String = res4;
                println!("{res4}");    // >>> [[1]]
                // REMOVE_START
                assert_eq!(res4, "[[1]]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.arrs[?(@ == [1,[2]])]").await {
            Ok(res5) => {
                let res5: String = res5;
                println!("{res5}");    // >>> [[1,[2]]]
                // REMOVE_START
                assert_eq!(res5, "[[1,[2]]]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", r#"$.objs[?(@ == {"x":1})]"#).await {
            Ok(res6) => {
                let res6: String = res6;
                println!("{res6}");    // >>> [{"x":1}]
                // REMOVE_START
                assert_eq!(res6, r#"[{"x":1}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc").await;
        // REMOVE_END
        // STEP_END

        // STEP_START filter_arithmetic
        let _: bool = match r.json_set("doc", "$", &json!([{"a":2,"b":3},{"a":5,"b":2}])).await {
            Ok(v) => v,
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        };

        match r.json_get("doc", "$[?@.a + 1 == 3]").await {
            Ok(res7) => {
                let res7: String = res7;
                println!("{res7}");    // >>> [{"a":2,"b":3}]
                // REMOVE_START
                assert_eq!(res7, r#"[{"a":2,"b":3}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$[?@.a + @.b * 2 == 8]").await {
            Ok(res8) => {
                let res8: String = res8;
                println!("{res8}");    // >>> [{"a":2,"b":3}]
                // REMOVE_START
                assert_eq!(res8, r#"[{"a":2,"b":3}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$[?(@.a + @.b) * 2 == 10]").await {
            Ok(res9) => {
                let res9: String = res9;
                println!("{res9}");    // >>> [{"a":2,"b":3}]
                // REMOVE_START
                assert_eq!(res9, r#"[{"a":2,"b":3}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc").await;
        // REMOVE_END
        // STEP_END

        // STEP_START filter_membership
        let _: bool = match r.json_set("doc", "$", &json!({"a":[1,2,3,4],"allow":[2,3]})).await {
            Ok(v) => v,
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        };

        match r.json_get("doc", "$.a[?@ in [2,4]]").await {
            Ok(res10) => {
                let res10: String = res10;
                println!("{res10}");    // >>> [2,4]
                // REMOVE_START
                assert_eq!(res10, "[2,4]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?@ nin [2,4]]").await {
            Ok(res11) => {
                let res11: String = res11;
                println!("{res11}");    // >>> [1,3]
                // REMOVE_START
                assert_eq!(res11, "[1,3]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?@ in $.allow]").await {
            Ok(res12) => {
                let res12: String = res12;
                println!("{res12}");    // >>> [2,3]
                // REMOVE_START
                assert_eq!(res12, "[2,3]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc").await;
        // REMOVE_END
        // STEP_END

        // STEP_START filter_set_relations
        let _: bool = match r.json_set("doc", "$", &json!({"a":[[1,2],[1,5],[]]})).await {
            Ok(v) => v,
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        };

        match r.json_get("doc", "$.a[?@ subsetof [1,2,3]]").await {
            Ok(res13) => {
                let res13: String = res13;
                println!("{res13}");    // >>> [[1,2],[]]
                // REMOVE_START
                assert_eq!(res13, "[[1,2],[]]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        let _: bool = match r.json_set("doc", "$", &json!({"a":[[1,9],[8,9],[]]})).await {
            Ok(v) => v,
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        };

        match r.json_get("doc", "$.a[?@ anyof [1,2,3]]").await {
            Ok(res14) => {
                let res14: String = res14;
                println!("{res14}");    // >>> [[1,9]]
                // REMOVE_START
                assert_eq!(res14, "[[1,9]]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        let _: bool = match r.json_set("doc", "$", &json!({"a":[[4,5],[1,9],[]]})).await {
            Ok(v) => v,
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        };

        match r.json_get("doc", "$.a[?@ noneof [1,2,3]]").await {
            Ok(res15) => {
                let res15: String = res15;
                println!("{res15}");    // >>> [[4,5],[]]
                // REMOVE_START
                assert_eq!(res15, "[[4,5],[]]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc").await;
        // REMOVE_END
        // STEP_END

        // STEP_START filter_size_empty
        let _: bool = match r.json_set("doc", "$", &json!({"a":[[4,5],[1],[7,8,9]]})).await {
            Ok(v) => v,
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        };

        match r.json_get("doc", "$.a[?@ sizeof 2]").await {
            Ok(res16) => {
                let res16: String = res16;
                println!("{res16}");    // >>> [[4,5]]
                // REMOVE_START
                assert_eq!(res16, "[[4,5]]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        let _: bool = match r.json_set("doc", "$", &json!({"a":[[],[1],"",[2,3],{},{"k":1}]})).await {
            Ok(v) => v,
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        };

        match r.json_get("doc", "$.a[?@ empty true]").await {
            Ok(res17) => {
                let res17: String = res17;
                println!("{res17}");    // >>> [[],"",{}]
                // REMOVE_START
                assert_eq!(res17, r#"[[],"",{}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.a[?@ empty false]").await {
            Ok(res18) => {
                let res18: String = res18;
                println!("{res18}");    // >>> [[1],[2,3],{"k":1}]
                // REMOVE_START
                assert_eq!(res18, r#"[[1],[2,3],{"k":1}]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc").await;
        // REMOVE_END
        // STEP_END

        // STEP_START filter_getkeys
        let _: bool = match r.json_set(
            "doc",
            "$",
            &json!({"obj":{"x":1,"y":2},"books":[{"t":"a"},{"t":"b"}]}),
        ).await {
            Ok(v) => v,
            Err(e) => {
                println!("Error setting doc: {e}");
                return;
            }
        };

        match r.json_get("doc", "$.obj~").await {
            Ok(res19) => {
                let res19: String = res19;
                println!("{res19}");    // >>> ["x","y"]
                // REMOVE_START
                assert_eq!(res19, r#"["x","y"]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$~").await {
            Ok(res20) => {
                let res20: String = res20;
                println!("{res20}");    // >>> ["obj","books"]
                // REMOVE_START
                assert_eq!(res20, r#"["obj","books"]"#);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        match r.json_get("doc", "$.books~").await {
            Ok(res21) => {
                let res21: String = res21;
                println!("{res21}");    // >>> []
                // REMOVE_START
                assert_eq!(res21, "[]");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting doc: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("doc").await;
        // REMOVE_END
        // STEP_END

    }
}
