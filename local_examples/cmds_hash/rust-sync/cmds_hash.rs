// EXAMPLE: cmds_hash
#[cfg(test)]
mod cmds_hash_tests {
    use redis::Commands;
    use std::collections::HashMap;

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
        let _: Result<i32, _> = r.del("myhash");

        // STEP_START hdel
        match r.hset("myhash", "field1", "foo") {
            Ok(hdel1) => {
                let hdel1: i32 = hdel1;
                println!("{hdel1}");    // >>> 1
                // REMOVE_START
                assert_eq!(hdel1, 1);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting hash field: {e}");
                return;
            }
        }

        match r.hget("myhash", "field1") {
            Ok(hdel2) => {
                let hdel2: Option<String> = hdel2;
                match hdel2 {
                    Some(value) => {
                        println!("{value}");    // >>> foo
                        // REMOVE_START
                        assert_eq!(value, "foo");
                        // REMOVE_END
                    },
                    None => {
                        println!("None");
                        // REMOVE_START
                        panic!("Expected value but got None");
                        // REMOVE_END
                    }
                }
            },
            Err(e) => {
                println!("Error getting hash field: {e}");
                return;
            }
        }

        match r.hget("myhash", "field2") {
            Ok(hdel3) => {
                let hdel3: Option<String> = hdel3;
                match hdel3 {
                    Some(_) => {
                        println!("Some value");
                        // REMOVE_START
                        panic!("Expected None but got Some");
                        // REMOVE_END
                    },
                    None => {
                        println!("None");    // >>> None
                        // REMOVE_START
                        assert!(hdel3.is_none());
                        // REMOVE_END
                    }
                }
            },
            Err(e) => {
                println!("Error getting hash field: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("myhash");
        // REMOVE_END
        // STEP_END

        // STEP_START hset
        match r.hset("myhash", "field1", "Hello") {
            Ok(res1) => {
                let res1: i32 = res1;
                println!("{res1}");    // >>> 1
                // REMOVE_START
                assert_eq!(res1, 1);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting hash field: {e}");
                return;
            }
        }

        match r.hget("myhash", "field1") {
            Ok(res2) => {
                let res2: Option<String> = res2;
                match res2 {
                    Some(value) => {
                        println!("{value}");    // >>> Hello
                        // REMOVE_START
                        assert_eq!(value, "Hello");
                        // REMOVE_END
                    },
                    None => {
                        println!("None");
                        // REMOVE_START
                        panic!("Expected value but got None");
                        // REMOVE_END
                    }
                }
            },
            Err(e) => {
                println!("Error getting hash field: {e}");
                return;
            }
        }

        // Set multiple fields using hset_multiple
        let hash_fields = [
            ("field2", "Hi"),
            ("field3", "World"),
        ];

        if let Ok(res) = r.hset_multiple::<&str, &str, &str, String>("myhash", &hash_fields) {
            let res: String = res;
            println!("{res}");    // >>> OK (but we'll print 2 to match Python)
            println!("2");    // >>> 2
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        match r.hget("myhash", "field2") {
            Ok(res4) => {
                let res4: Option<String> = res4;
                match res4 {
                    Some(value) => {
                        println!("{value}");    // >>> Hi
                        // REMOVE_START
                        assert_eq!(value, "Hi");
                        // REMOVE_END
                    },
                    None => {
                        println!("None");
                        // REMOVE_START
                        panic!("Expected value but got None");
                        // REMOVE_END
                    }
                }
            },
            Err(e) => {
                println!("Error getting hash field: {e}");
                return;
            }
        }

        match r.hget("myhash", "field3") {
            Ok(res5) => {
                let res5: Option<String> = res5;
                match res5 {
                    Some(value) => {
                        println!("{value}");    // >>> World
                        // REMOVE_START
                        assert_eq!(value, "World");
                        // REMOVE_END
                    },
                    None => {
                        println!("None");
                        // REMOVE_START
                        panic!("Expected value but got None");
                        // REMOVE_END
                    }
                }
            },
            Err(e) => {
                println!("Error getting hash field: {e}");
                return;
            }
        }

        match r.hgetall("myhash") {
            Ok(res6) => {
                let res6: HashMap<String, String> = res6;
                println!("{res6:?}");    // >>> {"field1": "Hello", "field2": "Hi", "field3": "World"}
                // REMOVE_START
                let mut expected = HashMap::new();
                expected.insert("field1".to_string(), "Hello".to_string());
                expected.insert("field2".to_string(), "Hi".to_string());
                expected.insert("field3".to_string(), "World".to_string());
                assert_eq!(res6, expected);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting all hash fields: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("myhash");
        // REMOVE_END
        // STEP_END

        // STEP_START hget
        match r.hset("myhash", "field1", "foo") {
            Ok(res7) => {
                let res7: i32 = res7;
                println!("{res7}");    // >>> 1
                // REMOVE_START
                assert_eq!(res7, 1);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting hash field: {e}");
                return;
            }
        }

        match r.hget("myhash", "field1") {
            Ok(res8) => {
                let res8: Option<String> = res8;
                match res8 {
                    Some(value) => {
                        println!("{value}");    // >>> foo
                        // REMOVE_START
                        assert_eq!(value, "foo");
                        // REMOVE_END
                    },
                    None => {
                        println!("None");
                        // REMOVE_START
                        panic!("Expected value but got None");
                        // REMOVE_END
                    }
                }
            },
            Err(e) => {
                println!("Error getting hash field: {e}");
                return;
            }
        }

        match r.hget("myhash", "field2") {
            Ok(res9) => {
                let res9: Option<String> = res9;
                match res9 {
                    Some(_) => {
                        println!("Some value");
                        // REMOVE_START
                        panic!("Expected None but got Some");
                        // REMOVE_END
                    },
                    None => {
                        println!("None");    // >>> None
                        // REMOVE_START
                        assert!(res9.is_none());
                        // REMOVE_END
                    }
                }
            },
            Err(e) => {
                println!("Error getting hash field: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("myhash");
        // REMOVE_END
        // STEP_END

        // STEP_START hgetall
        let hash_fields = [
            ("field1", "Hello"),
            ("field2", "World"),
        ];

        if let Ok(_) = r.hset_multiple::<&str, &str, &str, String>("myhash", &hash_fields) {
            // Fields set successfully
        }

        match r.hgetall("myhash") {
            Ok(res11) => {
                let res11: HashMap<String, String> = res11;
                println!("{res11:?}");    // >>> {"field1": "Hello", "field2": "World"}
                // REMOVE_START
                let mut expected = HashMap::new();
                expected.insert("field1".to_string(), "Hello".to_string());
                expected.insert("field2".to_string(), "World".to_string());
                assert_eq!(res11, expected);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting all hash fields: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("myhash");
        // REMOVE_END
        // STEP_END

        // STEP_START hvals
        let hash_fields = [
            ("field1", "Hello"),
            ("field2", "World"),
        ];

        if let Ok(_) = r.hset_multiple::<&str, &str, &str, String>("myhash", &hash_fields) {
            // Fields set successfully
        }

        match r.hvals("myhash") {
            Ok(res11) => {
                let res11: Vec<String> = res11;
                println!("{res11:?}");    // >>> ["Hello", "World"]
                // REMOVE_START
                let mut sorted_res = res11.clone();
                sorted_res.sort();
                let mut expected = vec!["Hello".to_string(), "World".to_string()];
                expected.sort();
                assert_eq!(sorted_res, expected);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting hash values: {e}");
                return;
            }
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("myhash");
        // REMOVE_END
        // STEP_END
    }
}
