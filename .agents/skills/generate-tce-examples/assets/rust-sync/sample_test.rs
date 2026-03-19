// =============================================================================
// CANONICAL RUST-SYNC (redis-rs) TEST FILE TEMPLATE
// =============================================================================
// This file demonstrates the structure and conventions used for redis-rs sync
// documentation test files. These tests serve dual purposes:
// 1. Executable tests that validate code snippets
// 2. Source for documentation code examples (processed via special markers)
//
// MARKER REFERENCE:
// - EXAMPLE: <name>     - Identifies the example name (matches docs folder name)
// - BINDER_ID <id>      - Optional identifier for online code runners
// - HIDE_START/HIDE_END - Code hidden from documentation but executed in tests
// - REMOVE_START/REMOVE_END - Code removed entirely from documentation output
// - STEP_START <name>/STEP_END - Named code section for targeted doc inclusion
//
// RUN: cargo test
// =============================================================================

// EXAMPLE: sample_example
#[cfg(test)]
mod sample_tests {
    use redis::Commands;
    use std::collections::HashMap;

    #[test]
    fn run() {
        let mut r = match redis::Client::open("redis://127.0.0.1") {
            Ok(client) => match client.get_connection() {
                Ok(conn) => conn,
                Err(e) => {
                    println!("Failed to connect to Redis: {e}");
                    return;
                }
            },
            Err(e) => {
                println!("Failed to create Redis client: {e}");
                return;
            }
        };

        // REMOVE_START
        // Clean up any existing data before tests
        let _: Result<i32, _> = r.del(&["mykey", "myhash", "bike:1", "bike:1:stats"]);
        // REMOVE_END

        // STEP_START string_ops
        // Basic string SET/GET operations
        match r.set("mykey", "Hello") {
            Ok(res1) => {
                let res1: String = res1;
                println!("{res1}"); // >>> OK
                // REMOVE_START
                assert_eq!(res1, "OK");
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }

        match r.get("mykey") {
            Ok(res2) => {
                let res2: String = res2;
                println!("{res2}"); // >>> Hello
                // REMOVE_START
                assert_eq!(res2, "Hello");
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }
        // STEP_END

        // REMOVE_START
        let _: Result<i32, _> = r.del("mykey");
        // REMOVE_END

        // STEP_START hash_ops
        // Hash operations: HSET, HGET, HGETALL
        match r.hset("myhash", "field1", "value1") {
            Ok(res3) => {
                let res3: i32 = res3;
                println!("{res3}"); // >>> 1
                // REMOVE_START
                assert_eq!(res3, 1);
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }

        let hash_fields = vec![("field2", "value2"), ("field3", "value3")];
        match r.hset_multiple("myhash", &hash_fields) {
            Ok(res4) => {
                let res4: String = res4;
                println!("{res4}"); // >>> OK
                // REMOVE_START
                assert_eq!(res4, "OK");
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }

        match r.hget("myhash", "field1") {
            Ok(res5) => {
                let res5: String = res5;
                println!("{res5}"); // >>> value1
                // REMOVE_START
                assert_eq!(res5, "value1");
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }

        match r.hgetall("myhash") {
            Ok(res6) => {
                let res6: HashMap<String, String> = res6;
                println!("{:?}", res6.get("field1")); // >>> Some("value1")
                // REMOVE_START
                assert_eq!(res6.get("field1"), Some(&"value1".to_string()));
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }
        // STEP_END

        // REMOVE_START
        let _: Result<i32, _> = r.del("myhash");
        // REMOVE_END

        // STEP_START hash_tutorial
        // Tutorial-style example with bike data
        let bike_fields = vec![
            ("model", "Deimos"),
            ("brand", "Ergonom"),
            ("type", "Enduro bikes"),
            ("price", "4972"),
        ];

        match r.hset_multiple("bike:1", &bike_fields) {
            Ok(res7) => {
                let res7: String = res7;
                println!("{res7}"); // >>> OK
            }
            Err(e) => println!("Error: {e}"),
        }

        match r.hget("bike:1", "model") {
            Ok(res8) => {
                let res8: String = res8;
                println!("{res8}"); // >>> Deimos
                // REMOVE_START
                assert_eq!(res8, "Deimos");
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }

        match r.hget("bike:1", "price") {
            Ok(res9) => {
                let res9: String = res9;
                println!("{res9}"); // >>> 4972
                // REMOVE_START
                assert_eq!(res9, "4972");
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }
        // STEP_END

        // REMOVE_START
        let _: Result<i32, _> = r.del(&["bike:1", "bike:1:stats"]);
        // REMOVE_END
    }
}

