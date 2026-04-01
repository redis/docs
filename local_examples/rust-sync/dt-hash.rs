// EXAMPLE: hash_tutorial
#[cfg(test)]
mod hash_tests {
    use redis::Commands;

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
        // REMOVE_START
        let _: () = r.flushall().expect("Failed to flushall");
        // REMOVE_END

        // STEP_START set_get_all
        let hash_fields = [
            ("model", "Deimos"),
            ("brand", "Ergonom"),
            ("type", "Enduro bikes"),
            ("price", "4972"),
        ];

        if let Ok(res) = r.hset_multiple("bike:1", &hash_fields) {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        match r.hget("bike:1", "model") {
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

        match r.hget("bike:1", "price") {
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

        match r.hgetall("bike:1") {
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
        match r.hmget("bike:1", &["model", "price"]) {
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
        if let Ok(res) = r.hincr("bike:1", "price", 100) {
            let res: i32 = res;
            println!("{res}");    // >>> 5072
            // REMOVE_START
            assert_eq!(res, 5072);
            // REMOVE_END
        }

        if let Ok(res) = r.hincr("bike:1", "price", -100) {
            let res: i32 = res;
            println!("{res}");    // >>> 4972
            // REMOVE_START
            assert_eq!(res, 4972);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START incrby_get_mget
        if let Ok(res) = r.hincr("bike:1:stats", "rides", 1) {
            let res: i32 = res;
            println!("{res}");    // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.hincr("bike:1:stats", "rides", 1) {
            let res: i32 = res;
            println!("{res}");    // >>> 2
            // REMOVE_START
            assert_eq!(res, 2);
            // REMOVE_END
        }

        if let Ok(res) = r.hincr("bike:1:stats", "rides", 1) {
            let res: i32 = res;
            println!("{res}");    // >>> 3
            // REMOVE_START
            assert_eq!(res, 3);
            // REMOVE_END
        }

        if let Ok(res) = r.hincr("bike:1:stats", "crashes", 1) {
            let res: i32 = res;
            println!("{res}");    // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.hincr("bike:1:stats", "owners", 1) {
            let res: i32 = res;
            println!("{res}");    // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        match r.hget("bike:1:stats", "rides") {
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

        match r.hmget("bike:1:stats", &["crashes", "owners"]) {
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
    }
}
