// EXAMPLE: pipe_trans_tutorial
#[cfg(test)]
mod pipe_trans_tests {
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

        for i in 0..8 {
            let key = format!("seat:{}", i);
            let _: () = r.del(&key).expect("Failed to delete key");
        }

        for i in 1..4 {
            let key = format!("counter:{}", i);
            let _: () = r.del(&key).expect("Failed to delete key");
        }

        // STEP_START basic_pipe
        // Check the success of the pipeline without checking the results
        // individually.
        match redis::pipe()
            .set("seat:0", "#0")
            .set("seat:1", "#1")
            .set("seat:2", "#2")
            .set("seat:3", "#3")
            .set("seat:4", "#4")
            .exec(&mut r)
        {
            Ok(_) => {
                println!("Pipe executed successfully");
            },
            Err(e) => {
                println!("Error executing pipe: {e}");
                return;
            }
        };
        
        // Check the success of the pipeline and the results individually.
        let (seat_0, seat_1, seat_2, seat_3, seat_4) :
        (String, String, String, String, String) = match redis::pipe()
            .get("seat:0")
            .get("seat:1")
            .get("seat:2")
            .get("seat:3")
            .get("seat:4")
            .query(&mut r) {
                Ok(res) => res,
                Err(e) => {
                    println!("Error executing pipe: {e}");
                    return;
                }
            };

        println!("{seat_0}, {seat_1}, {seat_2}, {seat_3}, {seat_4}");
        // >>> #0, #1, #2, #3, #4

        // Use `ignore()` to ignore the result of specific commands.
        let (seat_5, seat_6, seat_7) :
            (String, String, String) = match redis::pipe()
            .set("seat:5", "#5").ignore()
            .set("seat:6", "#6").ignore()
            .set("seat:7", "#7").ignore()
            .get("seat:5")
            .get("seat:6")
            .get("seat:7")
            .query(&mut r) {
                Ok(res) => res,
                Err(e) => {
                    println!("Error executing pipe: {e}");
                    return;
                }
            };

        println!("{seat_5}, {seat_6}, {seat_7}");
        // >>> #5, #6, #7
        // REMOVE_START
        assert_eq!(seat_0, "#0");
        assert_eq!(seat_1, "#1");
        assert_eq!(seat_2, "#2");
        assert_eq!(seat_3, "#3");
        assert_eq!(seat_4, "#4");
        assert_eq!(seat_5, "#5");
        assert_eq!(seat_6, "#6");
        assert_eq!(seat_7, "#7");
        // REMOVE_END
        // STEP_END

        // STEP_START basic_trans
        match redis::pipe()
            .atomic()
            .incr("counter:1", 1)
            .incr("counter:2", 2)
            .incr("counter:3", 3)
            .exec(&mut r)
        {
            Ok(_) => {
                println!("Transaction executed successfully");
            },
            Err(e) => {
                println!("Error executing transaction: {e}");
                return;
            }
        };
        // STEP_END

        // STEP_START trans_watch
        let key = "shellpath";
        let _: () = r.set(key, "/usr/syscmds/").unwrap();
        
        let Ok(_,): Result<((),), _> = redis::transaction(&mut r, &[key], |r, pipe| {
            let mut path: String = r.get(key).unwrap();
            path.push_str(":/usr/mycmds/");
            pipe.set(key, path).query(r)
        }) else {
            println!("Error executing transaction");
            return;
        };

        match r.get("shellpath") {
            Ok(res) => {
                let res: String = res;
                println!("{res}");
                // >>> /usr/syscmds/:/usr/mycmds/
            },
            Err(e) => {
                println!("Error getting shellpath: {e}");
                return;
            }
        };
        // STEP_END
    }
}
