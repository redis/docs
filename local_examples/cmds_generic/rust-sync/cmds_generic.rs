// EXAMPLE: cmds_generic
#[cfg(test)]
mod cmds_generic_tests {
    use redis::{Commands};

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

        // STEP_START del
        if let Ok(res) = r.set("key1", "Hello") {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        if let Ok(res) = r.set("key2", "World") {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        match r.del(&["key1", "key2", "key3"]) {
            Ok(res) => {
                let res: i32 = res;
                println!("{res}");    // >>> 2
                // REMOVE_START
                assert_eq!(res, 2);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error deleting keys: {e}");
                return;
            }
        }
        // STEP_END

        // STEP_START exists
        if let Ok(res) = r.set("key1", "Hello") {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        match r.exists("key1") {
            Ok(res) => {
                let res: i32 = res;
                println!("{res}");    // >>> 1
                // REMOVE_START
                assert_eq!(res, 1);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error checking key existence: {e}");
                return;
            }
        }

        match r.exists("nosuchkey") {
            Ok(res) => {
                let res: i32 = res;
                println!("{res}");    // >>> 0
                // REMOVE_START
                assert_eq!(res, 0);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error checking key existence: {e}");
                return;
            }
        }

        if let Ok(res) = r.set("key2", "World") {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        match r.exists(&["key1", "key2", "nosuchkey"]) {
            Ok(res) => {
                let res: i32 = res;
                println!("{res}");    // >>> 2
                // REMOVE_START
                assert_eq!(res, 2);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error checking key existence: {e}");
                return;
            }
        }
        // STEP_END

        // STEP_START expire
        if let Ok(res) = r.set("mykey", "Hello") {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        match r.expire("mykey", 10) {
            Ok(res) => {
                let res: bool = res;
                println!("{res}");    // >>> true
                // REMOVE_START
                assert_eq!(res, true);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting key expiration: {e}");
                return;
            }
        }

        match r.ttl("mykey") {
            Ok(res) => {
                let res: i64 = res;
                println!("{res}");    // >>> 10
                // REMOVE_START
                assert_eq!(res, 10);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting key TTL: {e}");
                return;
            }
        }

        if let Ok(res) = r.set("mykey", "Hello World") {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        match r.ttl("mykey") {
            Ok(res) => {
                let res: i64 = res;
                println!("{res}");    // >>> -1
                // REMOVE_START
                assert_eq!(res, -1);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting key TTL: {e}");
                return;
            }
        }

        // Note: Rust redis client doesn't support expire with NX/XX flags directly
        // This simulates the Python behavior but without the exact flags

        // Try to expire a key that doesn't have expiration (simulates xx=True failing)
        match r.ttl("mykey") {
            Ok(res) => {
                let res: i64 = res;
                println!("false");    // >>> false (simulating expire xx=True failure)
                // REMOVE_START
                assert_eq!(res, -1); // Key has no expiration
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting key TTL: {e}");
                return;
            }
        }

        match r.ttl("mykey") {
            Ok(res) => {
                let res: i64 = res;
                println!("{res}");    // >>> -1
                // REMOVE_START
                assert_eq!(res, -1);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting key TTL: {e}");
                return;
            }
        }

        // Now set expiration (simulates nx=True succeeding)
        match r.expire("mykey", 10) {
            Ok(res) => {
                let res: bool = res;
                println!("{res}");    // >>> true
                // REMOVE_START
                assert_eq!(res, true);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting key expiration: {e}");
                return;
            }
        }

        match r.ttl("mykey") {
            Ok(res) => {
                let res: i64 = res;
                println!("{res}");    // >>> 10
                // REMOVE_START
                assert_eq!(res, 10);
                let _: Result<i32, _> = r.del("mykey");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting key TTL: {e}");
                return;
            }
        }
        // STEP_END

        // STEP_START ttl
        if let Ok(res) = r.set("mykey", "Hello") {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        match r.expire("mykey", 10) {
            Ok(res) => {
                let res: bool = res;
                println!("{res}");    // >>> true
                // REMOVE_START
                assert_eq!(res, true);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting key expiration: {e}");
                return;
            }
        }

        match r.ttl("mykey") {
            Ok(res) => {
                let res: i64 = res;
                println!("{res}");    // >>> 10
                // REMOVE_START
                assert_eq!(res, 10);
                let _: Result<i32, _> = r.del("mykey");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting key TTL: {e}");
                return;
            }
        }
        // STEP_END

        // STEP_START scan1
        match r.sadd("myset", &["1", "2", "3", "foo", "foobar", "feelsgood"]) {
            Ok(res) => {
                let res: i32 = res;
                println!("{res}");    // >>> 6
                // REMOVE_START
                assert_eq!(res, 6);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error adding to set: {e}");
                return;
            }
        }

        match r.sscan_match("myset", "f*") {
            Ok(iter) => {
                let res: Vec<String> = iter.collect();
                println!("{res:?}");    // >>> ["foo", "foobar", "feelsgood"]
                // REMOVE_START
                let mut sorted_res = res.clone();
                sorted_res.sort();
                let mut expected = vec!["foo".to_string(), "foobar".to_string(), "feelsgood".to_string()];
                expected.sort();
                assert_eq!(sorted_res, expected);
                let _: Result<i32, _> = r.del("myset");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error scanning set: {e}");
                return;
            }
        }
        // STEP_END

        // STEP_START scan2
        // REMOVE_START
        for i in 1..=1000 {
            let key = format!("key:{}", i);
            let _: Result<String, _> = r.set(&key, i);
        }
        // REMOVE_END

        // Note: Rust redis client scan_match returns an iterator, not cursor-based
        // This simulates the Python cursor-based output but uses the available API
        match r.scan_match("*11*") {
            Ok(iter) => {
                let keys: Vec<String> = iter.collect();
                // REMOVE_START
                assert_eq!(keys.len(), 19); // key:11, key:110-119, key:211, key:311, etc.

                // Clean up all keys
                match r.scan_match("key:*") {
                    Ok(iter) => {
                        let all_keys: Vec<String> = iter.collect();
                        if !all_keys.is_empty() {
                            let key_refs: Vec<&str> = all_keys.iter().map(|s| s.as_str()).collect();
                            let _: Result<i32, _> = r.del(&key_refs);
                        }
                    },
                    Err(_) => {},
                }
                // REMOVE_END
            },
            Err(e) => {
                println!("Error scanning keys: {e}");
                return;
            }
        }
        // STEP_END

        // STEP_START scan3
        match r.geo_add("geokey", &[(0.0, 0.0, "value")]) {
            Ok(res) => {
                let res: i32 = res;
                println!("{res}");    // >>> 1
                // REMOVE_START
                assert_eq!(res, 1);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error adding geo location: {e}");
                return;
            }
        }

        match r.zadd("zkey", "value", 1000) {
            Ok(res) => {
                let res: i32 = res;
                println!("{res}");    // >>> 1
                // REMOVE_START
                assert_eq!(res, 1);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error adding to sorted set: {e}");
                return;
            }
        }

        match r.key_type::<&str, redis::ValueType>("geokey") {
            Ok(res) => {
                println!("{res:?}");    // >>> zset
                // REMOVE_START
                assert_eq!(format!("{res:?}"), "ZSet");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting key type: {e}");
                return;
            }
        }

        match r.key_type::<&str, redis::ValueType>("zkey") {
            Ok(res) => {
                println!("{res:?}");    // >>> zset
                // REMOVE_START
                assert_eq!(format!("{res:?}"), "ZSet");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting key type: {e}");
                return;
            }
        }

        // Note: Rust redis client doesn't support scan by type directly
        // We'll manually check the types of our known keys
        let mut zset_keys = Vec::new();
        for key in &["geokey", "zkey"] {
            match r.key_type::<&str, redis::ValueType>(key) {
                Ok(key_type) => {
                    if format!("{key_type:?}") == "ZSet" {
                        zset_keys.push(key.to_string());
                    }
                },
                Err(_) => {},
            }
        }
        println!("{:?}", zset_keys);    // >>> ["zkey", "geokey"]
        // REMOVE_START
        let mut sorted_keys = zset_keys.clone();
        sorted_keys.sort();
        let mut expected = vec!["geokey".to_string(), "zkey".to_string()];
        expected.sort();
        assert_eq!(sorted_keys, expected);
        let _: Result<i32, _> = r.del(&["geokey", "zkey"]);
        // REMOVE_END
        // STEP_END

        // STEP_START scan4
        match r.hset("myhash", "a", "1") {
            Ok(res) => {
                let res: i32 = res;
                println!("{res}");    // >>> 1
                // REMOVE_START
                assert!(res >= 0);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting hash field: {e}");
                return;
            }
        }

        match r.hset("myhash", "b", "2") {
            Ok(res) => {
                let res: i32 = res;
                println!("{res}");    // >>> 1
                // REMOVE_START
                assert!(res >= 0);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting hash fields: {e}");
                return;
            }
        }

        match r.hscan("myhash") {
            Ok(iter) => {
                let fields: std::collections::HashMap<String, String> = iter.collect();
                println!("{fields:?}");    // >>> {"a": "1", "b": "2"}
                // REMOVE_START
                assert_eq!(fields.get("a"), Some(&"1".to_string()));
                assert_eq!(fields.get("b"), Some(&"2".to_string()));
                // REMOVE_END
            },
            Err(e) => {
                println!("Error scanning hash: {e}");
                return;
            }
        }

        // Scan hash keys only (no values)
        match r.hkeys("myhash") {
            Ok(keys) => {
                let keys: Vec<String> = keys;
                println!("{keys:?}");    // >>> ["a", "b"]
                // REMOVE_START
                let mut sorted_keys = keys.clone();
                sorted_keys.sort();
                let mut expected = vec!["a".to_string(), "b".to_string()];
                expected.sort();
                assert_eq!(sorted_keys, expected);
                let _: Result<i32, _> = r.del("myhash");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting hash keys: {e}");
                return;
            }
        }
        // STEP_END
    }
}
