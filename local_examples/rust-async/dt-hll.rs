// EXAMPLE: hll_tutorial
#[cfg(test)]
mod hll_tests {
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
        let _: Result<i32, _> = r.del(&["bikes", "commuter_bikes", "all_bikes"]).await;
        // REMOVE_END
        // STEP_START pfadd
        let res1: bool = r
            .pfadd("bikes", &["Hyperion", "Deimos", "Phoebe", "Quaoar"])
            .await
            .expect("Failed to add bikes");
        println!("{res1}"); // >>> true

        let res2: usize = r.pfcount("bikes").await.expect("Failed to count bikes");
        println!("{res2}"); // >>> 4

        let res3: bool = r
            .pfadd("commuter_bikes", &["Salacia", "Mimas", "Quaoar"])
            .await
            .expect("Failed to add commuter bikes");
        println!("{res3}"); // >>> true

        let _: () = r
            .pfmerge("all_bikes", &["bikes", "commuter_bikes"])
            .await
            .expect("Failed to merge HyperLogLogs");
        println!("OK"); // >>> OK

        let res5: usize = r
            .pfcount("all_bikes")
            .await
            .expect("Failed to count all bikes");
        println!("{res5}"); // >>> 6

        // STEP_END
        // REMOVE_START
        assert!(res1);
        assert_eq!(res2, 4);
        assert!(res3);
        assert_eq!(res5, 6);
        // REMOVE_END
    }
}
