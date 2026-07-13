// EXAMPLE: cmds_sorted_set
#[cfg(test)]
mod cmds_sorted_set_tests {
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

        // STEP_START zadd
        // REMOVE_START
        let _: Result<i32, _> = r.del("myzset");
        // REMOVE_END
        if let Ok(res1) = r.zadd("myzset", "one", 1) {
            let res1: i32 = res1;
            println!("{res1}"); // >>> 1
            // REMOVE_START
            assert_eq!(res1, 1);
            // REMOVE_END
        }

        if let Ok(res2) = r.zadd("myzset", "uno", 1) {
            let res2: i32 = res2;
            println!("{res2}"); // >>> 1
            // REMOVE_START
            assert_eq!(res2, 1);
            // REMOVE_END
        }

        if let Ok(res3) = r.zadd_multiple("myzset", &[(2, "two"), (3, "three")]) {
            let res3: i32 = res3;
            println!("{res3}"); // >>> 2
            // REMOVE_START
            assert_eq!(res3, 2);
            // REMOVE_END
        }

        if let Ok(res4) = r.zrange_withscores("myzset", 0, -1) {
            let res4: Vec<(String, f64)> = res4;
            println!("{res4:?}");
            // >>> [("one", 1.0), ("uno", 1.0), ("two", 2.0), ("three", 3.0)]
            // REMOVE_START
            assert_eq!(
                res4,
                vec![
                    ("one".to_string(), 1.0),
                    ("uno".to_string(), 1.0),
                    ("two".to_string(), 2.0),
                    ("three".to_string(), 3.0),
                ]
            );
            // REMOVE_END
        }
        // REMOVE_START
        let _: Result<i32, _> = r.del("myzset");
        // REMOVE_END
        // STEP_END

        // STEP_START zrange1
        if let Ok(res5) = r.zadd_multiple("myzset", &[(1, "one"), (2, "two"), (3, "three")]) {
            let res5: i32 = res5;
            println!("{res5}"); // >>> 3
            // REMOVE_START
            assert_eq!(res5, 3);
            // REMOVE_END
        }

        if let Ok(res6) = r.zrange("myzset", 0, -1) {
            let res6: Vec<String> = res6;
            println!("{res6:?}"); // >>> ["one", "two", "three"]
            // REMOVE_START
            assert_eq!(res6, vec!["one", "two", "three"]);
            // REMOVE_END
        }

        if let Ok(res7) = r.zrange("myzset", 2, 3) {
            let res7: Vec<String> = res7;
            println!("{res7:?}"); // >>> ["three"]
            // REMOVE_START
            assert_eq!(res7, vec!["three"]);
            // REMOVE_END
        }

        if let Ok(res8) = r.zrange("myzset", -2, -1) {
            let res8: Vec<String> = res8;
            println!("{res8:?}"); // >>> ["two", "three"]
            // REMOVE_START
            assert_eq!(res8, vec!["two", "three"]);
            // REMOVE_END
        }
        // REMOVE_START
        let _: Result<i32, _> = r.del("myzset");
        // REMOVE_END
        // STEP_END

        // STEP_START zrange2
        let _: Result<i32, _> = r.zadd_multiple("myzset", &[(1, "one"), (2, "two"), (3, "three")]);

        if let Ok(res9) = r.zrange_withscores("myzset", 0, 1) {
            let res9: Vec<(String, f64)> = res9;
            println!("{res9:?}"); // >>> [("one", 1.0), ("two", 2.0)]
            // REMOVE_START
            assert_eq!(
                res9,
                vec![("one".to_string(), 1.0), ("two".to_string(), 2.0)]
            );
            // REMOVE_END
        }
        // REMOVE_START
        let _: Result<i32, _> = r.del("myzset");
        // REMOVE_END
        // STEP_END

        // STEP_START zrange3
        let _: Result<i32, _> = r.zadd_multiple("myzset", &[(1, "one"), (2, "two"), (3, "three")]);

        if let Ok(res10) = r.zrangebyscore_limit("myzset", "(1", "+inf", 1, 1) {
            let res10: Vec<String> = res10;
            println!("{res10:?}"); // >>> ["three"]
            // REMOVE_START
            assert_eq!(res10, vec!["three"]);
            // REMOVE_END
        }
        // REMOVE_START
        let _: Result<i32, _> = r.del("myzset");
        // REMOVE_END
        // STEP_END
    }
}
