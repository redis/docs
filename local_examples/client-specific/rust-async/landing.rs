// EXAMPLE: landing
// STEP_START import
use redis::AsyncCommands;
// STEP_END

#[tokio::main]
async fn main() {
    // STEP_START connect
    let mut r = match redis::Client::open("redis://127.0.0.1") {
        Ok(client) => {
            match client.get_multiplexed_async_connection().await {
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
    if let Ok(res) = r.set("foo", "bar").await {
        let res: String = res;
        println!("{res}"); // >>> OK
    } else {
        println!("Error setting foo");
    }

    match r.get("foo").await {
        Ok(res) => {
            let res: String = res;
            println!("{res}"); // >>> bar
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

    if let Ok(res) = r.hset_multiple("bike:1", &hash_fields).await {
        let res: String = res;
        println!("{res}"); // >>> OK
    } else {
        println!("Error setting bike:1");
    }

    match r.hget("bike:1", "model").await {
        Ok(res) => {
            let res: String = res;
            println!("{res}"); // >>> Deimos
        },
        Err(e) => {
            println!("Error getting bike:1 model: {e}");
            return;
        }
    }

    match r.hget("bike:1", "price").await {
        Ok(res) => {
            let res: String = res;
            println!("{res}"); // >>> 4972
        },
        Err(e) => {
            println!("Error getting bike:1 price: {e}");
            return;
        }
    }

    match r.hgetall("bike:1").await {
        Ok(res) => {
            let res: Vec<(String, String)> = res;
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
        // STEP_END
    }
}
