// EXAMPLE: ss_tutorial
#[cfg(test)]
mod tests {
    use redis::AsyncCommands;

    fn strings(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| value.to_string()).collect()
    }

    fn score_pairs(values: &[(&str, f64)]) -> Vec<(String, f64)> {
        values
            .iter()
            .map(|(member, score)| (member.to_string(), *score))
            .collect()
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

        // STEP_START zadd
        if let Ok(res) = r.zadd("racer_scores", "Norem", 10).await {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.zadd("racer_scores", "Castilla", 12).await {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r
            .zadd_multiple(
                "racer_scores",
                &[
                    (8, "Sam-Bodden"),
                    (10, "Royce"),
                    (6, "Ford"),
                    (14, "Prickett"),
                    (12, "Castilla"),
                ],
            )
            .await
        {
            let res: usize = res;
            println!("{res}"); // >>> 4
            // REMOVE_START
            assert_eq!(res, 4);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START zrange
        if let Ok(res) = r.zrange("racer_scores", 0, -1).await {
            let res: Vec<String> = res;
            println!("{res:?}");
            // >>> ["Ford", "Sam-Bodden", "Norem", "Royce", "Castilla", "Prickett"]
            // REMOVE_START
            assert_eq!(
                res,
                strings(&["Ford", "Sam-Bodden", "Norem", "Royce", "Castilla", "Prickett"])
            );
            // REMOVE_END
        }

        if let Ok(res) = r.zrevrange("racer_scores", 0, -1).await {
            let res: Vec<String> = res;
            println!("{res:?}");
            // >>> ["Prickett", "Castilla", "Royce", "Norem", "Sam-Bodden", "Ford"]
            // REMOVE_START
            assert_eq!(
                res,
                strings(&["Prickett", "Castilla", "Royce", "Norem", "Sam-Bodden", "Ford"])
            );
            // REMOVE_END
        }
        // STEP_END

        // STEP_START zrange_withscores
        if let Ok(res) = r.zrange_withscores("racer_scores", 0, -1).await {
            let res: Vec<(String, f64)> = res;
            println!("{res:?}");
            // >>> [("Ford", 6.0), ("Sam-Bodden", 8.0), ("Norem", 10.0), ("Royce", 10.0), ("Castilla", 12.0), ("Prickett", 14.0)]
            // REMOVE_START
            assert_eq!(
                res,
                score_pairs(&[
                    ("Ford", 6.0),
                    ("Sam-Bodden", 8.0),
                    ("Norem", 10.0),
                    ("Royce", 10.0),
                    ("Castilla", 12.0),
                    ("Prickett", 14.0),
                ])
            );
            // REMOVE_END
        }
        // STEP_END

        // STEP_START zrangebyscore
        if let Ok(res) = r.zrangebyscore("racer_scores", "-inf", 10).await {
            let res: Vec<String> = res;
            println!("{res:?}"); // >>> ["Ford", "Sam-Bodden", "Norem", "Royce"]
            // REMOVE_START
            assert_eq!(res, strings(&["Ford", "Sam-Bodden", "Norem", "Royce"]));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START zremrangebyscore
        if let Ok(res) = r.zrem("racer_scores", "Castilla").await {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.zrembyscore("racer_scores", "-inf", 9).await {
            let res: usize = res;
            println!("{res}"); // >>> 2
            // REMOVE_START
            assert_eq!(res, 2);
            // REMOVE_END
        }

        if let Ok(res) = r.zrange("racer_scores", 0, -1).await {
            let res: Vec<String> = res;
            println!("{res:?}"); // >>> ["Norem", "Royce", "Prickett"]
            // REMOVE_START
            assert_eq!(res, strings(&["Norem", "Royce", "Prickett"]));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START zrank
        if let Ok(res) = r.zrank("racer_scores", "Norem").await {
            let res: Option<usize> = res;
            if let Some(res) = res {
                println!("{res}"); // >>> 0
                // REMOVE_START
                assert_eq!(res, 0);
                // REMOVE_END
            }
        }

        if let Ok(res) = r.zrevrank("racer_scores", "Norem").await {
            let res: Option<usize> = res;
            if let Some(res) = res {
                println!("{res}"); // >>> 2
                // REMOVE_START
                assert_eq!(res, 2);
                // REMOVE_END
            }
        }
        // STEP_END

        // STEP_START zadd_lex
        if let Ok(res) = r
            .zadd_multiple(
                "racer_scores",
                &[
                    (0, "Norem"),
                    (0, "Sam-Bodden"),
                    (0, "Royce"),
                    (0, "Ford"),
                    (0, "Prickett"),
                    (0, "Castilla"),
                ],
            )
            .await
        {
            let res: usize = res;
            println!("{res}"); // >>> 3
            // REMOVE_START
            assert_eq!(res, 3);
            // REMOVE_END
        }

        if let Ok(res) = r.zrange("racer_scores", 0, -1).await {
            let res: Vec<String> = res;
            println!("{res:?}");
            // >>> ["Castilla", "Ford", "Norem", "Prickett", "Royce", "Sam-Bodden"]
            // REMOVE_START
            assert_eq!(
                res,
                strings(&["Castilla", "Ford", "Norem", "Prickett", "Royce", "Sam-Bodden"])
            );
            // REMOVE_END
        }

        if let Ok(res) = r.zrangebylex("racer_scores", "[A", "[L").await {
            let res: Vec<String> = res;
            println!("{res:?}"); // >>> ["Castilla", "Ford"]
            // REMOVE_START
            assert_eq!(res, strings(&["Castilla", "Ford"]));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START leaderboard
        if let Ok(res) = r.zadd("racer_scores", "Wood", 100).await {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.zadd("racer_scores", "Henshaw", 100).await {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.zadd("racer_scores", "Henshaw", 150).await {
            let res: usize = res;
            println!("{res}"); // >>> 0
            // REMOVE_START
            assert_eq!(res, 0);
            // REMOVE_END
        }

        if let Ok(res) = r.zincr("racer_scores", "Wood", 50).await {
            let res: f64 = res;
            println!("{res}"); // >>> 150
            // REMOVE_START
            assert_eq!(res, 150.0);
            // REMOVE_END
        }

        if let Ok(res) = r.zincr("racer_scores", "Henshaw", 50).await {
            let res: f64 = res;
            println!("{res}"); // >>> 200
            // REMOVE_START
            assert_eq!(res, 200.0);
            // REMOVE_END
        }
        // STEP_END
    }
}
