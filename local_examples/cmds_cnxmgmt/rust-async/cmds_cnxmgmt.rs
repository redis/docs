// EXAMPLE: cmds_cnxmgmt
#[cfg(test)]
mod cmds_cnxmgmt_tests {
    #[tokio::test]
    async fn run() {
        let mut r = match redis::Client::open("redis://127.0.0.1") {
            Ok(client) => match client.get_multiplexed_async_connection().await {
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
        if let Ok(res1) = redis::cmd("AUTH").arg("temp_pass").query_async::<String>(&mut r).await {
            println!("{res1}"); // >>> OK
        }

        if let Ok(res2) = redis::cmd("AUTH").arg("default").arg("temp_pass").query_async::<String>(&mut r).await {
            println!("{res2}"); // >>> OK
        }
        // STEP_END

        // STEP_START auth2
        if let Ok(res3) = redis::cmd("AUTH").arg("test-user").arg("strong_password").query_async::<String>(&mut r).await {
            println!("{res3}"); // >>> OK
        }
        // STEP_END
    }
}
