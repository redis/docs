// EXAMPLE: hash_tutorial
#[cfg(test)]
mod tests {
    use redis::AsyncCommands;

    #[tokio::test]
    async fn run() {
        let mut r = match redis::Client::open("redis://127.0.0.1") {
            Ok(client) => {
                match client.get_multiplexed_async_connection().await {
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
        // REMOVE_START
        let _: () = r.flushall().await.expect("Failed to flushall");
        // REMOVE_END

        // STEP_START set_get_all
        let hash_fields = [
            ("model", "Deimos"),
            ("brand", "Ergonom"),
            ("type", "Enduro bikes"),
            ("price", "4972"),
        ];

        if let Ok(res) = r.hset_multiple("bike:1", &hash_fields).await {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        match r.hget("bike:1", "model").await {
            Ok(res) => {
                let res: String = res;
                println!("{res}");   // >>> Deimos
                // REMOVE_START
                assert_eq!(res, "Deimos");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting bike:1 model: {e}");
                return;
            }
        };

        match r.hget("bike:1", "price").await {
            Ok(res) => {
                let res: String = res;
                println!("{res}");   // >>> 4972
                // REMOVE_START
                assert_eq!(res, "4972");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting bike:1 price: {e}");
                return;
            }
        };

        match r.hgetall("bike:1").await {
            Ok(res) => {
                let res: Vec<(String, String)> = res;
                println!("{res:?}");
                // >>> [("model", "Deimos"), ("brand", "Ergonom"), ("type", "Enduro bikes"), ("price", "4972")]
                // REMOVE_START
                assert_eq!(res.len(), 4);
                assert_eq!(res[0].0, "model");
                assert_eq!(res[0].1, "Deimos");
                assert_eq!(res[1].0, "brand");
                assert_eq!(res[1].1, "Ergonom");
                assert_eq!(res[2].0, "type");
                assert_eq!(res[2].1, "Enduro bikes");
                assert_eq!(res[3].0, "price");
                assert_eq!(res[3].1, "4972");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting bike:1: {e}");
                return;
            }
        };
        // STEP_END

        // STEP_START hmget
        // Recreate the bike:1 hash so this example runs on its own.
        let _: () = r.del("bike:1").await.expect("Failed to del");
        let _: () = r.hset_multiple(
            "bike:1",
            &[("model", "Deimos"), ("brand", "Ergonom"), ("type", "Enduro bikes"), ("price", "4972")],
        ).await.expect("Failed to hset");

        match r.hmget("bike:1", &["model", "price"]).await {
            Ok(res) => {
                let res: Vec<String> = res;
                println!("{res:?}");   // >>> ["Deimos", "4972"]
                // REMOVE_START
                assert_eq!(res.len(), 2);
                assert_eq!(res[0], "Deimos");
                assert_eq!(res[1], "4972");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting bike:1: {e}");
                return;
            }
        };
        // STEP_END

        // STEP_START hincrby
        // Recreate the bike:1 hash so this example runs on its own.
        let _: () = r.del("bike:1").await.expect("Failed to del");
        let _: () = r.hset_multiple(
            "bike:1",
            &[("model", "Deimos"), ("brand", "Ergonom"), ("type", "Enduro bikes"), ("price", "4972")],
        ).await.expect("Failed to hset");

        if let Ok(res) = r.hincr("bike:1", "price", 100).await {
            let res: i32 = res;
            println!("{res}");    // >>> 5072
            // REMOVE_START
            assert_eq!(res, 5072);
            // REMOVE_END
        }

        if let Ok(res) = r.hincr("bike:1", "price", -100).await {
            let res: i32 = res;
            println!("{res}");    // >>> 4972
            // REMOVE_START
            assert_eq!(res, 4972);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START incrby_get_mget
        if let Ok(res) = r.hincr("bike:1:stats", "rides", 1).await {
            let res: i32 = res;
            println!("{res}");    // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.hincr("bike:1:stats", "rides", 1).await {
            let res: i32 = res;
            println!("{res}");    // >>> 2
            // REMOVE_START
            assert_eq!(res, 2);
            // REMOVE_END
        }

        if let Ok(res) = r.hincr("bike:1:stats", "rides", 1).await {
            let res: i32 = res;
            println!("{res}");    // >>> 3
            // REMOVE_START
            assert_eq!(res, 3);
            // REMOVE_END
        }

        if let Ok(res) = r.hincr("bike:1:stats", "crashes", 1).await {
            let res: i32 = res;
            println!("{res}");    // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.hincr("bike:1:stats", "owners", 1).await {
            let res: i32 = res;
            println!("{res}");    // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        match r.hget("bike:1:stats", "rides").await {
            Ok(res) => {
                let res: i32 = res;
                println!("{res}");   // >>> 3
                // REMOVE_START
                assert_eq!(res, 3);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting bike:1:stats rides: {e}");
                return;
            }
        };

        match r.hmget("bike:1:stats", &["crashes", "owners"]).await {
            Ok(res) => {
                let res: Vec<i32> = res;
                println!("{res:?}");   // >>> [1, 1]
                // REMOVE_START
                assert_eq!(res.len(), 2);
                assert_eq!(res[0], 1);
                assert_eq!(res[1], 1);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting bike:1:stats crashes and owners: {e}");
                return;
            }
        };
        // STEP_END

        // STEP_START hexpire
        let _: () = r.del("sensor:sensor1").await.expect("Failed to del");
        let _: () = r.hset_multiple(
            "sensor:sensor1",
            &[("air_quality", "256"), ("battery_level", "89")],
        ).await.expect("Failed to hset");

        // Set a TTL of 60 seconds on two fields of the hash.
        match r.hexpire("sensor:sensor1", 60, redis::ExpireOption::NONE, &["air_quality", "battery_level"]).await {
            Ok(res18) => {
                let res18: Vec<i64> = res18;
                println!("{:?}", res18);    // >>> [1, 1]
                // REMOVE_START
                assert_eq!(res18, vec![1, 1]);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting expiration: {e}");
                return;
            }
        }

        // Retrieve the remaining TTL for those fields.
        match r.httl("sensor:sensor1", &["air_quality", "battery_level"]).await {
            Ok(res19) => {
                let res19: Vec<i64> = res19;
                println!("{}", res19.len());    // >>> 2
                // REMOVE_START
                assert_eq!(res19.len(), 2);
                assert!(res19.iter().all(|&ttl| ttl > 0 && ttl <= 60));
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting TTL: {e}");
                return;
            }
        }
        // STEP_END

        // STEP_START hpexpire
        let _: () = r.del("sensor:sensor1").await.expect("Failed to del");
        let _: () = r.hset_multiple(
            "sensor:sensor1",
            &[("air_quality", "256"), ("battery_level", "89")],
        ).await.expect("Failed to hset");

        // Set the TTL of the 'air_quality' field in milliseconds.
        match r.hpexpire("sensor:sensor1", 60000, redis::ExpireOption::NONE, &["air_quality"]).await {
            Ok(res20) => {
                let res20: Vec<i64> = res20;
                println!("{:?}", res20);    // >>> [1]
                // REMOVE_START
                assert_eq!(res20, vec![1]);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting expiration: {e}");
                return;
            }
        }

        // Retrieve the remaining TTL in milliseconds.
        match r.hpttl("sensor:sensor1", &["air_quality"]).await {
            Ok(res21) => {
                let res21: Vec<i64> = res21;
                println!("{}", res21.len());    // >>> 1
                // REMOVE_START
                assert_eq!(res21.len(), 1);
                assert!(res21.iter().all(|&pttl| pttl > 0 && pttl <= 60000));
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting PTTL: {e}");
                return;
            }
        }
        // STEP_END

        // STEP_START hexpireat
        let _: () = r.del("sensor:sensor1").await.expect("Failed to del");
        let _: () = r.hset_multiple(
            "sensor:sensor1",
            &[("air_quality", "256"), ("battery_level", "89")],
        ).await.expect("Failed to hset");

        // Set the expiration of 'air_quality' to a Unix time 24 hours from now.
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs() as i64;

        match r.hexpire_at("sensor:sensor1", now + 24 * 60 * 60, redis::ExpireOption::NONE, &["air_quality"]).await {
            Ok(res22) => {
                let res22: Vec<i64> = res22;
                println!("{:?}", res22);    // >>> [1]
                // REMOVE_START
                assert_eq!(res22, vec![1]);
                // REMOVE_END
            },
            Err(e) => {
                println!("Error setting expiration: {e}");
                return;
            }
        }

        // Retrieve the expiration time as a Unix timestamp in seconds.
        match r.hexpire_time("sensor:sensor1", &["air_quality"]).await {
            Ok(res23) => {
                let res23: Vec<i64> = res23;
                println!("{}", res23.len());    // >>> 1
                // REMOVE_START
                assert_eq!(res23.len(), 1);
                assert!(res23.iter().all(|&ts| ts > now));
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting expiration time: {e}");
                return;
            }
        }
        // STEP_END
    }
}