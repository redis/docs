// EXAMPLE: list_tutorial
#[cfg(test)]
mod tests {
    use redis::{AsyncCommands, Direction, ValueType};

    fn strings(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| value.to_string()).collect()
    }

    fn print_optional_string(value: Option<String>) {
        match value {
            Some(value) => println!("{value}"),
            None => println!("(nil)"),
        }
    }

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
        let _: () = r.flushall().await.expect("Failed to flushall");
        // REMOVE_END

        // STEP_START queue
        if let Ok(res) = r.lpush("bikes:repairs", "bike:1").await {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.lpush("bikes:repairs", "bike:2").await {
            let res: usize = res;
            println!("{res}"); // >>> 2
            // REMOVE_START
            assert_eq!(res, 2);
            // REMOVE_END
        }

        if let Ok(res) = r.rpop("bikes:repairs", None).await {
            let res: Option<String> = res;
            print_optional_string(res.clone()); // >>> bike:1
            // REMOVE_START
            assert_eq!(res, Some("bike:1".to_string()));
            // REMOVE_END
        }

        if let Ok(res) = r.rpop("bikes:repairs", None).await {
            let res: Option<String> = res;
            print_optional_string(res.clone()); // >>> bike:2
            // REMOVE_START
            assert_eq!(res, Some("bike:2".to_string()));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START stack
        if let Ok(res) = r.lpush("bikes:repairs", "bike:1").await {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.lpush("bikes:repairs", "bike:2").await {
            let res: usize = res;
            println!("{res}"); // >>> 2
            // REMOVE_START
            assert_eq!(res, 2);
            // REMOVE_END
        }

        if let Ok(res) = r.lpop("bikes:repairs", None).await {
            let res: Option<String> = res;
            print_optional_string(res.clone()); // >>> bike:2
            // REMOVE_START
            assert_eq!(res, Some("bike:2".to_string()));
            // REMOVE_END
        }

        if let Ok(res) = r.lpop("bikes:repairs", None).await {
            let res: Option<String> = res;
            print_optional_string(res.clone()); // >>> bike:1
            // REMOVE_START
            assert_eq!(res, Some("bike:1".to_string()));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START llen
        if let Ok(res) = r.llen("bikes:repairs").await {
            let res: usize = res;
            println!("{res}"); // >>> 0
            // REMOVE_START
            assert_eq!(res, 0);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START lmove_lrange
        if let Ok(res) = r.lpush("bikes:repairs", "bike:1").await {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.lpush("bikes:repairs", "bike:2").await {
            let res: usize = res;
            println!("{res}"); // >>> 2
            // REMOVE_START
            assert_eq!(res, 2);
            // REMOVE_END
        }

        if let Ok(res) = r
            .lmove(
                "bikes:repairs",
                "bikes:finished",
                Direction::Left,
                Direction::Left,
            )
            .await
        {
            let res: String = res;
            println!("{res}"); // >>> bike:2
            // REMOVE_START
            assert_eq!(res, "bike:2");
            // REMOVE_END
        }

        if let Ok(res) = r.lrange("bikes:repairs", 0, -1).await {
            let res: Vec<String> = res;
            println!("{res:?}"); // >>> ["bike:1"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:1"]));
            // REMOVE_END
        }

        if let Ok(res) = r.lrange("bikes:finished", 0, -1).await {
            let res: Vec<String> = res;
            println!("{res:?}"); // >>> ["bike:2"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:2"]));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START ltrim.1
        if let Ok(res) = r.del("bikes:repairs").await {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r
            .rpush(
                "bikes:repairs",
                &["bike:1", "bike:2", "bike:3", "bike:4", "bike:5"],
            )
            .await
        {
            let res: usize = res;
            println!("{res}"); // >>> 5
            // REMOVE_START
            assert_eq!(res, 5);
            // REMOVE_END
        }

        if let Ok(res) = r.ltrim("bikes:repairs", 0, 2).await {
            let res: () = res;
            let _ = res;
            println!("OK"); // >>> OK
        }

        if let Ok(res) = r.lrange("bikes:repairs", 0, -1).await {
            let res: Vec<String> = res;
            println!("{res:?}"); // >>> ["bike:1", "bike:2", "bike:3"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:1", "bike:2", "bike:3"]));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START lpush_rpush
        let _: usize = r.del("bikes:repairs").await.unwrap_or(0);

        if let Ok(res) = r.rpush("bikes:repairs", "bike:1").await {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.rpush("bikes:repairs", "bike:2").await {
            let res: usize = res;
            println!("{res}"); // >>> 2
            // REMOVE_START
            assert_eq!(res, 2);
            // REMOVE_END
        }

        if let Ok(res) = r.lpush("bikes:repairs", "bike:important_bike").await {
            let res: usize = res;
            println!("{res}"); // >>> 3
            // REMOVE_START
            assert_eq!(res, 3);
            // REMOVE_END
        }

        if let Ok(res) = r.lrange("bikes:repairs", 0, -1).await {
            let res: Vec<String> = res;
            println!("{res:?}"); // >>> ["bike:important_bike", "bike:1", "bike:2"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:important_bike", "bike:1", "bike:2"]));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START variadic
        let _: usize = r.del("bikes:repairs").await.unwrap_or(0);

        if let Ok(res) = r.rpush("bikes:repairs", &["bike:1", "bike:2", "bike:3"]).await {
            let res: usize = res;
            println!("{res}"); // >>> 3
            // REMOVE_START
            assert_eq!(res, 3);
            // REMOVE_END
        }

        if let Ok(res) = r
            .lpush("bikes:repairs", &["bike:important_bike", "bike:very_important_bike"])
            .await
        {
            let res: usize = res;
            println!("{res}"); // >>> 5
            // REMOVE_START
            assert_eq!(res, 5);
            // REMOVE_END
        }

        if let Ok(res) = r.lrange("bikes:repairs", 0, -1).await {
            let res: Vec<String> = res;
            println!("{res:?}");
            // >>> ["bike:very_important_bike", "bike:important_bike", "bike:1", "bike:2", "bike:3"]
            // REMOVE_START
            assert_eq!(
                res,
                strings(&[
                    "bike:very_important_bike",
                    "bike:important_bike",
                    "bike:1",
                    "bike:2",
                    "bike:3",
                ])
            );
            // REMOVE_END
        }
        // STEP_END

        // STEP_START lpop_rpop
        let _: usize = r.del("bikes:repairs").await.unwrap_or(0);

        if let Ok(res) = r.rpush("bikes:repairs", &["bike:1", "bike:2", "bike:3"]).await {
            let res: usize = res;
            println!("{res}"); // >>> 3
            // REMOVE_START
            assert_eq!(res, 3);
            // REMOVE_END
        }

        if let Ok(res) = r.rpop("bikes:repairs", None).await {
            let res: Option<String> = res;
            print_optional_string(res.clone()); // >>> bike:3
            // REMOVE_START
            assert_eq!(res, Some("bike:3".to_string()));
            // REMOVE_END
        }

        if let Ok(res) = r.lpop("bikes:repairs", None).await {
            let res: Option<String> = res;
            print_optional_string(res.clone()); // >>> bike:1
            // REMOVE_START
            assert_eq!(res, Some("bike:1".to_string()));
            // REMOVE_END
        }

        if let Ok(res) = r.rpop("bikes:repairs", None).await {
            let res: Option<String> = res;
            print_optional_string(res.clone()); // >>> bike:2
            // REMOVE_START
            assert_eq!(res, Some("bike:2".to_string()));
            // REMOVE_END
        }

        if let Ok(res) = r.rpop("bikes:repairs", None).await {
            let res: Option<String> = res;
            print_optional_string(res.clone()); // >>> (nil)
            // REMOVE_START
            assert_eq!(res, None);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START ltrim
        if let Ok(res) = r
            .rpush(
                "bikes:repairs",
                &["bike:1", "bike:2", "bike:3", "bike:4", "bike:5"],
            )
            .await
        {
            let res: usize = res;
            println!("{res}"); // >>> 5
            // REMOVE_START
            assert_eq!(res, 5);
            // REMOVE_END
        }

        if let Ok(res) = r.ltrim("bikes:repairs", 0, 2).await {
            let res: () = res;
            let _ = res;
            println!("OK"); // >>> OK
        }

        if let Ok(res) = r.lrange("bikes:repairs", 0, -1).await {
            let res: Vec<String> = res;
            println!("{res:?}"); // >>> ["bike:1", "bike:2", "bike:3"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:1", "bike:2", "bike:3"]));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START ltrim_end_of_list
        let _: usize = r.del("bikes:repairs").await.unwrap_or(0);

        if let Ok(res) = r
            .rpush(
                "bikes:repairs",
                &["bike:1", "bike:2", "bike:3", "bike:4", "bike:5"],
            )
            .await
        {
            let res: usize = res;
            println!("{res}"); // >>> 5
            // REMOVE_START
            assert_eq!(res, 5);
            // REMOVE_END
        }

        if let Ok(res) = r.ltrim("bikes:repairs", -3, -1).await {
            let res: () = res;
            let _ = res;
            println!("OK"); // >>> OK
        }

        if let Ok(res) = r.lrange("bikes:repairs", 0, -1).await {
            let res: Vec<String> = res;
            println!("{res:?}"); // >>> ["bike:3", "bike:4", "bike:5"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:3", "bike:4", "bike:5"]));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START brpop
        let _: usize = r.del("bikes:repairs").await.unwrap_or(0);

        if let Ok(res) = r.rpush("bikes:repairs", &["bike:1", "bike:2"]).await {
            let res: usize = res;
            println!("{res}"); // >>> 2
            // REMOVE_START
            assert_eq!(res, 2);
            // REMOVE_END
        }

        if let Ok(res) = r.brpop("bikes:repairs", 1.0).await {
            let res: Option<[String; 2]> = res;
            println!("{res:?}"); // >>> Some(["bikes:repairs", "bike:2"])
            // REMOVE_START
            assert_eq!(res, Some(["bikes:repairs".to_string(), "bike:2".to_string()]));
            // REMOVE_END
        }

        if let Ok(res) = r.brpop("bikes:repairs", 1.0).await {
            let res: Option<[String; 2]> = res;
            println!("{res:?}"); // >>> Some(["bikes:repairs", "bike:1"])
            // REMOVE_START
            assert_eq!(res, Some(["bikes:repairs".to_string(), "bike:1".to_string()]));
            // REMOVE_END
        }

        if let Ok(res) = r.brpop("bikes:repairs", 1.0).await {
            let res: Option<[String; 2]> = res;
            println!("{res:?}"); // >>> None
            // REMOVE_START
            assert_eq!(res, None);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START rule_1
        if let Ok(res) = r.del("new_bikes").await {
            let res: usize = res;
            println!("{res}"); // >>> 0
            // REMOVE_START
            assert_eq!(res, 0);
            // REMOVE_END
        }

        if let Ok(res) = r.lpush("new_bikes", &["bike:1", "bike:2", "bike:3"]).await {
            let res: usize = res;
            println!("{res}"); // >>> 3
            // REMOVE_START
            assert_eq!(res, 3);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START rule_1.1
        if let Ok(res) = r.del("new_bikes").await {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.set("new_bikes", "bike:1").await {
            let res: String = res;
            println!("{res}"); // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        if let Ok(res) = r.key_type("new_bikes").await {
            let res: ValueType = res;
            let res: String = res.into();
            println!("{res}"); // >>> string
            // REMOVE_START
            assert_eq!(res, "string");
            // REMOVE_END
        }

        let res: redis::RedisResult<usize> = r.lpush("new_bikes", &["bike:2", "bike:3"]).await;
        match res {
            Ok(_) => {}
            Err(e) => {
                let msg = e.to_string();
                if let Some((_, tail)) = msg.split_once("WRONGTYPE ") {
                    println!("WRONGTYPE {tail}");
                } else {
                    println!("{msg}");
                }
                // REMOVE_START
                assert!(msg.contains("WRONGTYPE"));
                // REMOVE_END
            }
        }
        // STEP_END

        // STEP_START rule_2
        // HIDE_START
        let _: usize = r.rpush("bikes:repairs", "bike:placeholder").await.unwrap_or(0);
        // HIDE_END
        if let Ok(res) = r.del("bikes:repairs").await {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.lpush("bikes:repairs", &["bike:1", "bike:2", "bike:3"]).await {
            let res: usize = res;
            println!("{res}"); // >>> 3
            // REMOVE_START
            assert_eq!(res, 3);
            // REMOVE_END
        }

        if let Ok(res) = r.exists("bikes:repairs").await {
            let res: bool = res;
            println!("{}", i32::from(res)); // >>> 1
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r.lpop("bikes:repairs", None).await {
            let res: Option<String> = res;
            print_optional_string(res.clone()); // >>> bike:3
            // REMOVE_START
            assert_eq!(res, Some("bike:3".to_string()));
            // REMOVE_END
        }

        if let Ok(res) = r.lpop("bikes:repairs", None).await {
            let res: Option<String> = res;
            print_optional_string(res.clone()); // >>> bike:2
            // REMOVE_START
            assert_eq!(res, Some("bike:2".to_string()));
            // REMOVE_END
        }

        if let Ok(res) = r.lpop("bikes:repairs", None).await {
            let res: Option<String> = res;
            print_optional_string(res.clone()); // >>> bike:1
            // REMOVE_START
            assert_eq!(res, Some("bike:1".to_string()));
            // REMOVE_END
        }

        if let Ok(res) = r.exists("bikes:repairs").await {
            let res: bool = res;
            println!("{}", i32::from(res)); // >>> 0
            // REMOVE_START
            assert!(!res);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START rule_3
        if let Ok(res) = r.del("bikes:repairs").await {
            let res: usize = res;
            println!("{res}"); // >>> 0
            // REMOVE_START
            assert_eq!(res, 0);
            // REMOVE_END
        }

        if let Ok(res) = r.llen("bikes:repairs").await {
            let res: usize = res;
            println!("{res}"); // >>> 0
            // REMOVE_START
            assert_eq!(res, 0);
            // REMOVE_END
        }

        if let Ok(res) = r.lpop("bikes:repairs", None).await {
            let res: Option<String> = res;
            print_optional_string(res.clone()); // >>> (nil)
            // REMOVE_START
            assert_eq!(res, None);
            // REMOVE_END
        }
        // STEP_END
    }
}
