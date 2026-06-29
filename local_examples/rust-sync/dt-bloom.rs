// EXAMPLE: bf_tutorial
#[cfg(test)]
mod bloom_tests {
    use redis::Commands;

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
        let _: Result<i32, _> = r.del("bikes:models");
        // REMOVE_END
        // STEP_START bloom
        let _: () = r
            .bf_reserve("bikes:models", 0.001, 1_000_000)
            .expect("Failed to reserve Bloom filter");
        println!("OK"); // >>> OK

        let res1: bool = r
            .bf_add("bikes:models", "Smoky Mountain Striker")
            .expect("Failed to add item to Bloom filter");
        println!("{res1}"); // >>> true

        let res2: bool = r
            .bf_exists("bikes:models", "Smoky Mountain Striker")
            .expect("Failed to check item in Bloom filter");
        println!("{res2}"); // >>> true

        let res3: Vec<bool> = r
            .bf_madd(
                "bikes:models",
                &[
                    "Rocky Mountain Racer",
                    "Cloudy City Cruiser",
                    "Windy City Wippet",
                ],
            )
            .expect("Failed to add items to Bloom filter");
        println!("{res3:?}"); // >>> [true, true, true]

        let res4: Vec<bool> = r
            .bf_mexists(
                "bikes:models",
                &[
                    "Rocky Mountain Racer",
                    "Cloudy City Cruiser",
                    "Windy City Wippet",
                ],
            )
            .expect("Failed to check items in Bloom filter");
        println!("{res4:?}"); // >>> [true, true, true]
        // STEP_END
        // REMOVE_START
        assert!(res1);
        assert!(res2);
        assert_eq!(res3, vec![true, true, true]);
        assert_eq!(res4, vec![true, true, true]);
        // REMOVE_END
    }
}
