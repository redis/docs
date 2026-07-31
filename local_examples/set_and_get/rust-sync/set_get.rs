// EXAMPLE: set_and_get
#[cfg(test)]
mod set_and_get_tests {
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
        let _: Result<i32, _> = r.del("bike:1");
        // REMOVE_END

        if let Ok(res1) = r.set("bike:1", "Process 134") {
            let res1: String = res1;
            println!("{res1}"); // >>> OK
            // REMOVE_START
            assert_eq!(res1, "OK");
            // REMOVE_END
        }

        if let Ok(res2) = r.get("bike:1") {
            let res2: String = res2;
            println!("{res2}"); // >>> Process 134
            // REMOVE_START
            assert_eq!(res2, "Process 134");
            // REMOVE_END
        }

        // REMOVE_START
        let _: Result<i32, _> = r.del("bike:1");
        // REMOVE_END
    }
}
