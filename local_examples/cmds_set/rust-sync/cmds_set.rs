// EXAMPLE: cmds_set
#[cfg(test)]
mod cmds_set_tests {
    use redis::Commands;
    use std::collections::HashSet;

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

        // STEP_START sadd
        // REMOVE_START
        let _: Result<i32, _> = r.del("myset");
        // REMOVE_END
        if let Ok(res1) = r.sadd("myset", &["Hello", "World"]) {
            let res1: i32 = res1;
            println!("{res1}"); // >>> 2
            // REMOVE_START
            assert_eq!(res1, 2);
            // REMOVE_END
        }

        if let Ok(res2) = r.sadd("myset", "World") {
            let res2: i32 = res2;
            println!("{res2}"); // >>> 0
            // REMOVE_START
            assert_eq!(res2, 0);
            // REMOVE_END
        }

        if let Ok(res3) = r.smembers("myset") {
            let res3: HashSet<String> = res3;
            println!("{res3:?}"); // >>> {"Hello", "World"}
            // REMOVE_START
            assert_eq!(
                res3,
                HashSet::from(["Hello".to_string(), "World".to_string()])
            );
            // REMOVE_END
        }
        // REMOVE_START
        let _: Result<i32, _> = r.del("myset");
        // REMOVE_END
        // STEP_END

        // STEP_START smembers
        // REMOVE_START
        let _: Result<i32, _> = r.del("myset");
        // REMOVE_END
        if let Ok(res4) = r.sadd("myset", &["Hello", "World"]) {
            let res4: i32 = res4;
            println!("{res4}"); // >>> 2
            // REMOVE_START
            assert_eq!(res4, 2);
            // REMOVE_END
        }

        if let Ok(res5) = r.smembers("myset") {
            let res5: HashSet<String> = res5;
            println!("{res5:?}"); // >>> {"Hello", "World"}
            // REMOVE_START
            assert_eq!(
                res5,
                HashSet::from(["Hello".to_string(), "World".to_string()])
            );
            // REMOVE_END
        }
        // REMOVE_START
        let _: Result<i32, _> = r.del("myset");
        // REMOVE_END
        // STEP_END
    }
}
