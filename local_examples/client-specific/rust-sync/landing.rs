// EXAMPLE: landing
#[cfg(test)]
mod landing_tests {
    // STEP_START import
    use redis::Commands;
    // STEP_END

    #[test]
    fn run() {
        // STEP_START connect
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
        // STEP_END

        // STEP_START set_get_string
        if let Ok(res) = r.set("foo", "bar") {
            let res: String = res;
            println!("{res}");    // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        } else {
            println!("Error setting foo");
        }
        
        match r.get("foo") {
            Ok(res) => {
                let res: String = res;
                println!("{res}");   // >>> bar
                // REMOVE_START
                assert_eq!(res, "bar");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting foo: {e}");
                return;
            }
        };
        // STEP_END
    
        // STEP_START set_get_hash
        let hash_fields = [
            ("model", "Deimos"),
            ("brand", "Ergonom"),
            ("type", "Enduro bikes"),
            ("price", "4972"),
        ];
    
        if let Ok(res) = r.hset_multiple("bike:1", &hash_fields) {
            let res: String = res;
            println!("{res}"); // >>> OK
            // REMOVE_START
            assert_eq!(res, "OK");
            // REMOVE_END
        } else {
            println!("Error setting bike:1");
        }
    
        match r.hget("bike:1", "model") {
            Ok(res) => {
                let res: String = res;
                println!("{res}"); // >>> Deimos
                // REMOVE_START
                assert_eq!(res, "Deimos");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting bike:1 model: {e}");
                return;
            }   
        }
    
        match r.hget("bike:1", "price") {
            Ok(res) => {
                let res: String = res;
                println!("{res}"); // >>> 4972
                // REMOVE_START
                assert_eq!(res, "4972");
                // REMOVE_END
            },
            Err(e) => {
                println!("Error getting bike:1 price: {e}");
                return;
            }   
        }
    
        match r.hgetall("bike:1") {
            Ok(res) => {
                let res: Vec<(String, String)> = res;
                // REMOVE_START
                assert_eq!(res.len(), 4);
                assert_eq!(res[0].0, "model");
                assert_eq!(res[0].1, "Deimos");
                assert_eq!(res[1].0, "brand");
                assert_eq!(res[1].1, "Ergonom");
                // REMOVE_END
                
                for (key, value) in res {
                    println!("{key}: {value}");
                }
                // >>> model: Deimos
                // >>> brand: Ergonom
                // >>> type: Enduro bikes
                // >>> price: 4972
            },
            Err(e) => {
                println!("Error getting bike:1: {e}");
                return;
            }   
        }
        // STEP_END
    }
}
