// EXAMPLE: sets_tutorial
#[cfg(test)]
mod sets_tests {
    use redis::Commands;
    use std::collections::HashSet;

    fn sorted(mut values: Vec<String>) -> Vec<String> {
        values.sort();
        values
    }

    fn sorted_set(values: HashSet<String>) -> Vec<String> {
        sorted(values.into_iter().collect())
    }

    fn strings(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| value.to_string()).collect()
    }

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
            }
            Err(e) => {
                println!("Failed to create Redis client: {e}");
                return;
            }
        };
        // REMOVE_START
        let _: () = r.flushall().expect("Failed to flushall");
        // REMOVE_END

        // STEP_START sadd
        if let Ok(res) = r.sadd("bikes:racing:france", "bike:1") {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.sadd("bikes:racing:france", "bike:1") {
            let res: usize = res;
            println!("{res}"); // >>> 0
            // REMOVE_START
            assert_eq!(res, 0);
            // REMOVE_END
        }

        if let Ok(res) = r.sadd("bikes:racing:france", &["bike:2", "bike:3"]) {
            let res: usize = res;
            println!("{res}"); // >>> 2
            // REMOVE_START
            assert_eq!(res, 2);
            // REMOVE_END
        }

        if let Ok(res) = r.sadd("bikes:racing:usa", &["bike:1", "bike:4"]) {
            let res: usize = res;
            println!("{res}"); // >>> 2
            // REMOVE_START
            assert_eq!(res, 2);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START sismember
        if let Ok(res) = r.sismember("bikes:racing:usa", "bike:1") {
            let res: bool = res;
            println!("{}", i32::from(res)); // >>> 1
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r.sismember("bikes:racing:usa", "bike:2") {
            let res: bool = res;
            println!("{}", i32::from(res)); // >>> 0
            // REMOVE_START
            assert!(!res);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START sinter
        if let Ok(res) = r.sinter(&["bikes:racing:france", "bikes:racing:usa"]) {
            let res: HashSet<String> = res;
            let res = sorted_set(res);
            println!("{res:?}"); // >>> ["bike:1"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:1"]));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START scard
        if let Ok(res) = r.scard("bikes:racing:france") {
            let res: usize = res;
            println!("{res}"); // >>> 3
            // REMOVE_START
            assert_eq!(res, 3);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START sadd_smembers
        let _: usize = r.del("bikes:racing:france").unwrap_or(0);

        if let Ok(res) = r.sadd("bikes:racing:france", &["bike:1", "bike:2", "bike:3"]) {
            let res: usize = res;
            println!("{res}"); // >>> 3
            // REMOVE_START
            assert_eq!(res, 3);
            // REMOVE_END
        }

        if let Ok(res) = r.smembers("bikes:racing:france") {
            let res: HashSet<String> = res;
            let res = sorted_set(res);
            println!("{res:?}"); // >>> ["bike:1", "bike:2", "bike:3"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:1", "bike:2", "bike:3"]));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START smismember
        if let Ok(res) = r.sismember("bikes:racing:france", "bike:1") {
            let res: bool = res;
            println!("{}", i32::from(res)); // >>> 1
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r.smismember("bikes:racing:france", &["bike:2", "bike:3", "bike:4"]) {
            let res: Vec<bool> = res;
            let res: Vec<i32> = res.into_iter().map(i32::from).collect();
            println!("{res:?}"); // >>> [1, 1, 0]
            // REMOVE_START
            assert_eq!(res, vec![1, 1, 0]);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START sdiff
        let _: usize = r.del("bikes:racing:france").unwrap_or(0);
        let _: usize = r.del("bikes:racing:usa").unwrap_or(0);
        let _: usize = r.sadd("bikes:racing:france", &["bike:1", "bike:2", "bike:3"]).unwrap_or(0);
        let _: usize = r.sadd("bikes:racing:usa", &["bike:1", "bike:4"]).unwrap_or(0);

        if let Ok(res) = r.sdiff(&["bikes:racing:france", "bikes:racing:usa"]) {
            let res: HashSet<String> = res;
            let res = sorted_set(res);
            println!("{res:?}"); // >>> ["bike:2", "bike:3"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:2", "bike:3"]));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START multisets
        let _: usize = r.del(&["bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy"]).unwrap_or(0);
        let _: usize = r.sadd("bikes:racing:france", &["bike:1", "bike:2", "bike:3"]).unwrap_or(0);
        let _: usize = r.sadd("bikes:racing:usa", &["bike:1", "bike:4"]).unwrap_or(0);
        let _: usize = r.sadd("bikes:racing:italy", &["bike:1", "bike:2", "bike:3", "bike:4"]).unwrap_or(0);

        if let Ok(res) =
            r.sinter(&["bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy"])
        {
            let res: HashSet<String> = res;
            let res = sorted_set(res);
            println!("{res:?}"); // >>> ["bike:1"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:1"]));
            // REMOVE_END
        }

        if let Ok(res) =
            r.sunion(&["bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy"])
        {
            let res: HashSet<String> = res;
            let res = sorted_set(res);
            println!("{res:?}"); // >>> ["bike:1", "bike:2", "bike:3", "bike:4"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:1", "bike:2", "bike:3", "bike:4"]));
            // REMOVE_END
        }

        if let Ok(res) =
            r.sdiff(&["bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy"])
        {
            let res: HashSet<String> = res;
            let res = sorted_set(res);
            println!("{res:?}"); // >>> []
            // REMOVE_START
            assert!(res.is_empty());
            // REMOVE_END
        }

        if let Ok(res) = r.sdiff(&["bikes:racing:france", "bikes:racing:usa"]) {
            let res: HashSet<String> = res;
            let res = sorted_set(res);
            println!("{res:?}"); // >>> ["bike:2", "bike:3"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:2", "bike:3"]));
            // REMOVE_END
        }

        if let Ok(res) = r.sdiff(&["bikes:racing:usa", "bikes:racing:france"]) {
            let res: HashSet<String> = res;
            let res = sorted_set(res);
            println!("{res:?}"); // >>> ["bike:4"]
            // REMOVE_START
            assert_eq!(res, strings(&["bike:4"]));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START srem
        let _: usize = r.del("bikes:racing:france").unwrap_or(0);
        let _: usize = r
            .sadd(
                "bikes:racing:france",
                &["bike:1", "bike:2", "bike:3", "bike:4", "bike:5"],
            )
            .unwrap_or(0);

        if let Ok(res) = r.srem("bikes:racing:france", "bike:1") {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.spop("bikes:racing:france") {
            let res: Option<String> = res;
            match res {
                Some(res) => println!("{res}"), // >>> bike:3 (for example)
                None => println!("(nil)"),
            }
        }

        if let Ok(res) = r.smembers("bikes:racing:france") {
            let res: HashSet<String> = res;
            let res = sorted_set(res);
            println!("{res:?}"); // >>> ["bike:2", "bike:4", "bike:5"] (for example)
        }

        if let Ok(res) = r.srandmember("bikes:racing:france") {
            let res: Option<String> = res;
            match res {
                Some(res) => println!("{res}"), // >>> bike:4 (for example)
                None => println!("(nil)"),
            }
        }
        // STEP_END
    }
}
