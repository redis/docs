// EXAMPLE: cmds_servermgmt
#[cfg(test)]
mod cmds_servermgmt_tests {
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

        // STEP_START flushall
        let _: () = r.flushall().await.expect("Failed to flushall");

        match r.keys("*").await {
            Ok(res2) => {
                let res2: Vec<String> = res2;
                println!("{res2:?}"); // >>> []
                // REMOVE_START
                assert!(res2.is_empty());
                // REMOVE_END
            }
            Err(e) => println!("Error getting keys: {e}"),
        }
        // STEP_END

        // STEP_START info
        match redis::cmd("INFO").query_async::<String>(&mut r).await {
            Ok(res3) => {
                println!("{res3}");
                // >>> # Server
                // >>> redis_version:7.4.0
                // >>> ...
                // REMOVE_START
                assert!(res3.contains("redis_version"));
                // REMOVE_END
            }
            Err(e) => println!("Error getting info: {e}"),
        }
        // STEP_END
    }
}
