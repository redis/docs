// EXAMPLE: cmds_hotkeys
#[cfg(test)]
mod cmds_hotkeys_tests {
    use redis::{Commands, HotkeysCommands, HotkeysOptions};

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
        let _ = r.hotkeys_stop();
        let _ = r.hotkeys_reset();
        let _: Result<i32, _> = r.del(&["product:1", "product:2", "product:3"]);
        let _: Result<(), _> = r.mset(&[
            ("product:1", "Laptop"),
            ("product:2", "Phone"),
            ("product:3", "Tablet"),
        ]);
        // REMOVE_END

        // STEP_START hotkeys
        // Track the 10 hottest keys by CPU time and network bytes.
        let opts = HotkeysOptions::new_with_cpu()
            .and_net()
            .with_count(10)
            .expect("COUNT must be between 1 and 64");

        match r.hotkeys_start(opts) {
            Ok(res1) => {
                println!("{res1:?}"); // >>> ()
            }
            Err(e) => println!("Error starting hotkeys tracking: {e}"),
        }

        // Generate some traffic. In production, this is your application's workload.
        for _ in 0..100 {
            let _: Result<String, _> = r.get("product:1");
        }

        for _ in 0..10 {
            let _: Result<String, _> = r.get("product:2");
        }

        let _: Result<String, _> = r.get("product:3");

        match r.hotkeys_get() {
            Ok(Some(res2)) => {
                println!("{}", res2.tracking_active); // >>> true

                let by_net: Vec<(&str, u64)> = res2
                    .by_net_bytes
                    .iter()
                    .flatten()
                    .map(|entry| (entry.key.as_str(), entry.value))
                    .collect();
                println!("{by_net:?}");
                // >>> [("product:1", 4000), ("product:2", 390), ("product:3", 40)]
                // REMOVE_START
                assert!(res2.tracking_active);
                assert_eq!(
                    by_net,
                    vec![("product:1", 4000), ("product:2", 390), ("product:3", 40)]
                );
                // REMOVE_END
            }
            Ok(None) => {
                println!("No hotkeys tracking session");
                // REMOVE_START
                panic!("HOTKEYS GET returned no session");
                // REMOVE_END
            }
            Err(e) => println!("Error getting hotkeys: {e}"),
        }

        match r.hotkeys_stop() {
            Ok(res3) => {
                println!("{res3}"); // >>> true
                // REMOVE_START
                assert!(res3);
                // REMOVE_END
            }
            Err(e) => println!("Error stopping hotkeys tracking: {e}"),
        }

        match r.hotkeys_reset() {
            Ok(res4) => {
                println!("{res4:?}"); // >>> ()
            }
            Err(e) => println!("Error resetting hotkeys: {e}"),
        }
        // STEP_END

        // REMOVE_START
        let res5 = r.hotkeys_get().expect("HOTKEYS GET failed");
        assert!(res5.is_none());
        let _: Result<i32, _> = r.del(&["product:1", "product:2", "product:3"]);
        // REMOVE_END
    }
}
