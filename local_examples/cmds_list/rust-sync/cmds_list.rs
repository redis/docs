// EXAMPLE: cmds_list
#[cfg(test)]
mod cmds_list_tests {
    use redis::Commands;
    use std::num::NonZeroUsize;

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

        // STEP_START lpush
        // REMOVE_START
        let _: Result<i32, _> = r.del("mylist");
        // REMOVE_END
        if let Ok(res1) = r.lpush("mylist", "world") {
            let res1: i32 = res1;
            println!("{res1}"); // >>> 1
            // REMOVE_START
            assert_eq!(res1, 1);
            // REMOVE_END
        }

        if let Ok(res2) = r.lpush("mylist", "hello") {
            let res2: i32 = res2;
            println!("{res2}"); // >>> 2
            // REMOVE_START
            assert_eq!(res2, 2);
            // REMOVE_END
        }

        if let Ok(res3) = r.lrange("mylist", 0, -1) {
            let res3: Vec<String> = res3;
            println!("{res3:?}"); // >>> ["hello", "world"]
            // REMOVE_START
            assert_eq!(res3, vec!["hello", "world"]);
            // REMOVE_END
        }
        // REMOVE_START
        let _: Result<i32, _> = r.del("mylist");
        // REMOVE_END
        // STEP_END

        // STEP_START lrange
        // REMOVE_START
        let _: Result<i32, _> = r.del("mylist");
        // REMOVE_END
        let _: Result<i32, _> = r.rpush("mylist", "one");
        let _: Result<i32, _> = r.rpush("mylist", "two");
        let _: Result<i32, _> = r.rpush("mylist", "three");

        if let Ok(res7) = r.lrange("mylist", 0, 0) {
            let res7: Vec<String> = res7;
            println!("{res7:?}"); // >>> ["one"]
            // REMOVE_START
            assert_eq!(res7, vec!["one"]);
            // REMOVE_END
        }

        if let Ok(res8) = r.lrange("mylist", -3, 2) {
            let res8: Vec<String> = res8;
            println!("{res8:?}"); // >>> ["one", "two", "three"]
            // REMOVE_START
            assert_eq!(res8, vec!["one", "two", "three"]);
            // REMOVE_END
        }

        if let Ok(res9) = r.lrange("mylist", -100, 100) {
            let res9: Vec<String> = res9;
            println!("{res9:?}"); // >>> ["one", "two", "three"]
            // REMOVE_START
            assert_eq!(res9, vec!["one", "two", "three"]);
            // REMOVE_END
        }

        if let Ok(res10) = r.lrange("mylist", 5, 10) {
            let res10: Vec<String> = res10;
            println!("{res10:?}"); // >>> []
            // REMOVE_START
            assert!(res10.is_empty());
            // REMOVE_END
        }
        // REMOVE_START
        let _: Result<i32, _> = r.del("mylist");
        // REMOVE_END
        // STEP_END

        // STEP_START llen
        // REMOVE_START
        let _: Result<i32, _> = r.del("mylist");
        // REMOVE_END
        if let Ok(res11) = r.lpush("mylist", "World") {
            let res11: i32 = res11;
            println!("{res11}"); // >>> 1
            // REMOVE_START
            assert_eq!(res11, 1);
            // REMOVE_END
        }

        if let Ok(res12) = r.lpush("mylist", "Hello") {
            let res12: i32 = res12;
            println!("{res12}"); // >>> 2
            // REMOVE_START
            assert_eq!(res12, 2);
            // REMOVE_END
        }

        if let Ok(res13) = r.llen("mylist") {
            let res13: i32 = res13;
            println!("{res13}"); // >>> 2
            // REMOVE_START
            assert_eq!(res13, 2);
            // REMOVE_END
        }
        // REMOVE_START
        let _: Result<i32, _> = r.del("mylist");
        // REMOVE_END
        // STEP_END

        // STEP_START rpush
        // REMOVE_START
        let _: Result<i32, _> = r.del("mylist");
        // REMOVE_END
        if let Ok(res14) = r.rpush("mylist", "hello") {
            let res14: i32 = res14;
            println!("{res14}"); // >>> 1
            // REMOVE_START
            assert_eq!(res14, 1);
            // REMOVE_END
        }

        if let Ok(res15) = r.rpush("mylist", "world") {
            let res15: i32 = res15;
            println!("{res15}"); // >>> 2
            // REMOVE_START
            assert_eq!(res15, 2);
            // REMOVE_END
        }

        if let Ok(res16) = r.lrange("mylist", 0, -1) {
            let res16: Vec<String> = res16;
            println!("{res16:?}"); // >>> ["hello", "world"]
            // REMOVE_START
            assert_eq!(res16, vec!["hello", "world"]);
            // REMOVE_END
        }
        // REMOVE_START
        let _: Result<i32, _> = r.del("mylist");
        // REMOVE_END
        // STEP_END

        // STEP_START lpop
        // REMOVE_START
        let _: Result<i32, _> = r.del("mylist");
        // REMOVE_END
        if let Ok(res17) = r.rpush("mylist", &["one", "two", "three", "four", "five"]) {
            let res17: i32 = res17;
            println!("{res17}"); // >>> 5
            // REMOVE_START
            assert_eq!(res17, 5);
            // REMOVE_END
        }

        if let Ok(res18) = r.lpop("mylist", None) {
            let res18: String = res18;
            println!("{res18}"); // >>> one
            // REMOVE_START
            assert_eq!(res18, "one");
            // REMOVE_END
        }

        if let Ok(res19) = r.lpop("mylist", NonZeroUsize::new(2)) {
            let res19: Vec<String> = res19;
            println!("{res19:?}"); // >>> ["two", "three"]
            // REMOVE_START
            assert_eq!(res19, vec!["two", "three"]);
            // REMOVE_END
        }

        if let Ok(res20) = r.lrange("mylist", 0, -1) {
            let res20: Vec<String> = res20;
            println!("{res20:?}"); // >>> ["four", "five"]
            // REMOVE_START
            assert_eq!(res20, vec!["four", "five"]);
            // REMOVE_END
        }
        // REMOVE_START
        let _: Result<i32, _> = r.del("mylist");
        // REMOVE_END
        // STEP_END

        // STEP_START rpop
        // REMOVE_START
        let _: Result<i32, _> = r.del("mylist");
        // REMOVE_END
        if let Ok(res21) = r.rpush("mylist", &["one", "two", "three", "four", "five"]) {
            let res21: i32 = res21;
            println!("{res21}"); // >>> 5
            // REMOVE_START
            assert_eq!(res21, 5);
            // REMOVE_END
        }

        if let Ok(res22) = r.rpop("mylist", None) {
            let res22: String = res22;
            println!("{res22}"); // >>> five
            // REMOVE_START
            assert_eq!(res22, "five");
            // REMOVE_END
        }

        if let Ok(res23) = r.rpop("mylist", NonZeroUsize::new(2)) {
            let res23: Vec<String> = res23;
            println!("{res23:?}"); // >>> ["four", "three"]
            // REMOVE_START
            assert_eq!(res23, vec!["four", "three"]);
            // REMOVE_END
        }

        if let Ok(res24) = r.lrange("mylist", 0, -1) {
            let res24: Vec<String> = res24;
            println!("{res24:?}"); // >>> ["one", "two"]
            // REMOVE_START
            assert_eq!(res24, vec!["one", "two"]);
            // REMOVE_END
        }
        // REMOVE_START
        let _: Result<i32, _> = r.del("mylist");
        // REMOVE_END
        // STEP_END
    }
}
