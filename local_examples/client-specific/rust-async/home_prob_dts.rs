// EXAMPLE: home_prob_dts
#[cfg(test)]
mod home_prob_dts_tests {
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

        // STEP_START hyperloglog
        // REMOVE_START
        let _: Result<i32, _> = r.del(&["group:1", "group:2", "both_groups"]).await;
        // REMOVE_END
        let group1_added: bool = r
            .pfadd("group:1", &["andy", "cameron", "david"])
            .await
            .expect("Failed to add items to group:1");
        println!("{group1_added}"); // >>> true

        let group1: usize = r.pfcount("group:1").await.expect("Failed to count group:1");
        println!("{group1}"); // >>> 3

        let group2_added: bool = r
            .pfadd("group:2", &["kaitlyn", "michelle", "paolo", "rachel"])
            .await
            .expect("Failed to add items to group:2");
        println!("{group2_added}"); // >>> true

        let group2: usize = r.pfcount("group:2").await.expect("Failed to count group:2");
        println!("{group2}"); // >>> 4

        let _: () = r
            .pfmerge("both_groups", &["group:1", "group:2"])
            .await
            .expect("Failed to merge HyperLogLogs");
        println!("OK"); // >>> OK

        let both_groups: usize = r
            .pfcount("both_groups")
            .await
            .expect("Failed to count both_groups");
        println!("{both_groups}"); // >>> 7

        // STEP_END
        // REMOVE_START
        assert!(group1_added);
        assert_eq!(group1, 3);
        assert!(group2_added);
        assert_eq!(group2, 4);
        assert_eq!(both_groups, 7);
        // REMOVE_END
    }
}
