// =============================================================================
// CANONICAL RUST-ASYNC (redis-rs) TEST FILE TEMPLATE
// =============================================================================
// This file demonstrates the structure and conventions used for redis-rs async
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
// Uses #[tokio::test] for async test execution
// RUN: cargo test
// =============================================================================

// EXAMPLE: sample_example
#[cfg(test)]
mod sample_async_tests {
    use redis::AsyncCommands;
    use std::collections::HashMap;

    #[tokio::test]
    async fn run() {
        let mut r = match redis::Client::open("redis://127.0.0.1") {
            Ok(client) => match client.get_multiplexed_async_connection().await {
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
        let _: () = r.del(&["mykey", "myhash", "bike:1", "bike:1:stats"]).await.unwrap();
        // REMOVE_END

        // STEP_START string_ops
        // Basic string SET/GET operations (async)
        if let Ok(res1) = r.set("mykey", "Hello").await {
            let res1: String = res1;
            println!("{res1}"); // >>> OK
            // REMOVE_START
            assert_eq!(res1, "OK");
            // REMOVE_END
        }

        match r.get("mykey").await {
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
        let _: () = r.del("mykey").await.unwrap();
        // REMOVE_END

        // STEP_START hash_ops
        // Hash operations: HSET, HGET, HGETALL (async)
        if let Ok(res3) = r.hset("myhash", "field1", "value1").await {
            let res3: i32 = res3;
            println!("{res3}"); // >>> 1
            // REMOVE_START
            assert_eq!(res3, 1);
            // REMOVE_END
        }

        let hash_fields = vec![("field2", "value2"), ("field3", "value3")];
        if let Ok(res4) = r.hset_multiple("myhash", &hash_fields).await {
            let res4: String = res4;
            println!("{res4}"); // >>> OK
            // REMOVE_START
            assert_eq!(res4, "OK");
            // REMOVE_END
        }

        match r.hget("myhash", "field1").await {
            Ok(res5) => {
                let res5: String = res5;
                println!("{res5}"); // >>> value1
                // REMOVE_START
                assert_eq!(res5, "value1");
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }

        match r.hgetall("myhash").await {
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
        let _: () = r.del("myhash").await.unwrap();
        // REMOVE_END

        // STEP_START hash_tutorial
        // Tutorial-style example with bike data (async)
        let bike_fields = [
            ("model", "Deimos"),
            ("brand", "Ergonom"),
            ("type", "Enduro bikes"),
            ("price", "4972"),
        ];

        if let Ok(res7) = r.hset_multiple("bike:1", &bike_fields).await {
            let res7: String = res7;
            println!("{res7}"); // >>> OK
        }

        match r.hget("bike:1", "model").await {
            Ok(res8) => {
                let res8: String = res8;
                println!("{res8}"); // >>> Deimos
                // REMOVE_START
                assert_eq!(res8, "Deimos");
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }

        match r.hget("bike:1", "price").await {
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
        let _: () = r.del(&["bike:1", "bike:1:stats"]).await.unwrap();
        // REMOVE_END
    }
}

