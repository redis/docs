// EXAMPLE: set_tutorial
#[cfg(test)]
mod strings_tests {
    // STEP_START import
    use redis::{Commands, ExistenceCheck};
    // STEP_END

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

        // STEP_START set_get
        if let Ok(res) = r.set("bike:1", "Deimos") {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        match r.get("bike:1") {
            Ok(res) => {
                let res: String = res;
                println!("{res}");   // >>> Deimos
                // REMOVE_START
                assert_eq!(res, "Deimos");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting bike:1: {e}");
                return;
            }
        };
        // STEP_END

        // STEP_START setnx_xx
        if let Ok(res) = r.set_options("bike:1", "bike", redis::SetOptions::default().conditional_set(ExistenceCheck::NX)) {
            let res: bool = res;
            println!("{res}");    // >>> false
            // REMOVE_START
            assert!(!res);
            // REMOVE_END
        }

        match r.get("bike:1") {
            Ok(res) => {
                let res: String = res;
                println!("{res}");   // >>> Deimos
                // REMOVE_START
                assert_eq!(res, "Deimos");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting bike:1: {e}");
                return;
            }
        };

        if let Ok(res) = r.set_options("bike:1", "bike", redis::SetOptions::default().conditional_set(ExistenceCheck::XX)) {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }
        
        match r.get("bike:1") {
            Ok(res) => {
                let res: String = res;
                println!("{res}");   // >>> bike
                // REMOVE_START
                assert_eq!(res, "bike");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting bike:1: {e}");
                return;
            }
        };
        // STEP_END

        // STEP_START mset
        if let Ok(res) = r.mset(&[("bike:1", "Deimos"), ("bike:2", "Ares"), ("bike:3", "Vanth")]) {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        match r.mget(&["bike:1", "bike:2", "bike:3"]) {
            Ok(res) => {
                let res: Vec<String> = res;
                println!("{res:?}");   // >>> ["Deimos", "Ares", "Vanth"]
                // REMOVE_START
                assert_eq!(res.len(), 3);
                assert_eq!(res[0], "Deimos");
                assert_eq!(res[1], "Ares");
                assert_eq!(res[2], "Vanth");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting values: {e}");
                return;
            }
        };
        // STEP_END

        // STEP_START incr
        if let Ok(res) = r.set("total_crashes", 0) {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        }

        if let Ok(res) = r.incr("total_crashes", 1) {
            let res: i32 = res;
            println!("{res}");    // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.incr("total_crashes", 10) {
            let res: i32 = res;
            println!("{res}");    // >>> 11
            // REMOVE_START
            assert_eq!(res, 11);
            // REMOVE_END
        }
        // STEP_END
    }
}