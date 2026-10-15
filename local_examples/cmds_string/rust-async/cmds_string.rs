// EXAMPLE: cmds_string
#[cfg(test)]
mod cmds_string_tests {
    use redis::AsyncCommands;

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
        let _: Result<i32, _> = r.del(&["key1", "key2", "mykey", "nonexisting"]).await;
        // REMOVE_END

        // STEP_START mget
        if let Ok(res) = r.set("key1", "Hello").await {
            let _: String = res;
        }

        if let Ok(res) = r.set("key2", "World").await {
            let _: String = res;
        }

        match r.mget(&["key1", "key2", "nonexisting"]).await {
            Ok(mget_result) => {
                let mget_result: Vec<Option<String>> = mget_result;
                println!("{mget_result:?}");    // >>> [Some("Hello"), Some("World"), None]
                // REMOVE_START
                assert_eq!(
                    mget_result,
                    vec![Some("Hello".to_string()), Some("World".to_string()), None]
                );
                // REMOVE_END
            }
            Err(e) => {
                println!("Error getting values: {e}");
            }
        }
        // STEP_END

        // STEP_START incr
        if let Ok(res) = r.set("mykey", "10").await {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        match r.incr("mykey", 1).await {
            Ok(incr_result) => {
                let incr_result: i64 = incr_result;
                println!("{incr_result}");    // >>> 11
                // REMOVE_START
                assert_eq!(incr_result, 11);
                // REMOVE_END
            }
            Err(e) => {
                println!("Error incrementing value: {e}");
            }
        }

        match r.get("mykey").await {
            Ok(get_result) => {
                let get_result: String = get_result;
                println!("{get_result}");    // >>> 11
                // REMOVE_START
                assert_eq!(get_result, "11");
                // REMOVE_END
            }
            Err(e) => {
                println!("Error getting value: {e}");
            }
        }
        // STEP_END

        // REMOVE_START
        let _: Result<i32, _> = r.del(&["key1", "key2", "mykey", "nonexisting"]).await;
        // REMOVE_END
    }
}
