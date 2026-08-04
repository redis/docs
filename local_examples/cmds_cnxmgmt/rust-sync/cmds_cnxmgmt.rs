// EXAMPLE: cmds_cnxmgmt
#[cfg(test)]
mod cmds_cnxmgmt_tests {
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

        // STEP_START auth1
        if let Ok(res1) = redis::cmd("AUTH").arg("temp_pass").query::<String>(&mut r) {
            println!("{res1}"); // >>> OK
        }

        if let Ok(res2) = redis::cmd("AUTH").arg("default").arg("temp_pass").query::<String>(&mut r) {
            println!("{res2}"); // >>> OK
        }
        // STEP_END

        // STEP_START auth2
        if let Ok(res3) = redis::cmd("AUTH").arg("test-user").arg("strong_password").query::<String>(&mut r) {
            println!("{res3}"); // >>> OK
        }
        // STEP_END
    }
}
