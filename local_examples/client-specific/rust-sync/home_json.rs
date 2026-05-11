// EXAMPLE: rust_home_json
#[cfg(test)]
mod tests {
    // STEP_START import
    use redis::{cmd, Commands, JsonCommands};
    use serde_json::json;
    // STEP_END

    #[test]
    fn run() {
        // STEP_START create_data
        let bike = json!({
            "model": "Deimos",
            "brand": "Ergonom",
            "price": 4972,
            "specs": {
                "material": "carbon",
                "weight": 8.7
            },
            "colors": ["black", "silver"],
            "inventory": {
                "in_stock": 12,
                "warehouse": "w1"
            }
        });
        // STEP_END

        // STEP_START connect
        let client =
            redis::Client::open("redis://127.0.0.1").expect("Failed to create Redis client");
        let mut r = client.get_connection().expect("Failed to connect to Redis");
        // STEP_END

        // REMOVE_START
        let _: i32 = r.del("bike:1").expect("Failed to clean up key");
        // REMOVE_END

        // STEP_START set_get_doc
        let stored: bool = r
            .json_set("bike:1", "$", &bike)
            .expect("Failed to run JSON.SET");
        println!("{}", if stored { "OK" } else { "(nil)" }); // >>> OK

        let bike_json: String = r.json_get("bike:1", "$").expect("Failed to run JSON.GET");
        println!("{bike_json}");
        // >>> [{"model":"Deimos","brand":"Ergonom","price":4972,"specs":{"material":"carbon","weight":8.7},"colors":["black","silver"],"inventory":{"in_stock":12,"warehouse":"w1"}}]
        // STEP_END

        // REMOVE_START
        assert!(stored);
        assert_eq!(
            bike_json,
            r#"[{"brand":"Ergonom","colors":["black","silver"],"inventory":{"in_stock":12,"warehouse":"w1"},"model":"Deimos","price":4972,"specs":{"material":"carbon","weight":8.7}}]"#
        );
        // REMOVE_END

        // STEP_START get_fields
        let material: String = r
            .json_get("bike:1", "$.specs.material")
            .expect("Failed to run JSON.GET");
        println!("{material}"); // >>> ["carbon"]

        let colors: String = r
            .json_get("bike:1", "$.colors")
            .expect("Failed to run JSON.GET");
        println!("{colors}"); // >>> [["black","silver"]]

        let stock: String = r
            .json_get("bike:1", "$.inventory.in_stock")
            .expect("Failed to run JSON.GET");
        println!("{stock}"); // >>> [12]
                             // STEP_END

        // REMOVE_START
        assert_eq!(material, r#"["carbon"]"#);
        assert_eq!(colors, r#"[["black","silver"]]"#);
        assert_eq!(stock, "[12]");
        // REMOVE_END

        // STEP_START update_fields
        let stock_set: bool = r
            .json_set("bike:1", "$.inventory.in_stock", &json!(8))
            .expect("Failed to update stock");
        println!("{}", if stock_set { "OK" } else { "(nil)" }); // >>> OK

        let new_price: String = cmd("JSON.NUMINCRBY")
            .arg("bike:1")
            .arg("$.price")
            .arg(-500)
            .query(&mut r)
            .expect("Failed to run JSON.NUMINCRBY");
        println!("{new_price}"); // >>> [4472]

        let updated_fields: String = r
            .json_get("bike:1", &["$.price", "$.inventory.in_stock"])
            .expect("Failed to read updated fields");
        println!("{updated_fields}"); // >>> {"$.price":[4472],"$.inventory.in_stock":[8]}
                                      // STEP_END

        // REMOVE_START
        assert!(stock_set);
        assert_eq!(new_price, "[4472]");
        assert!(
            updated_fields == r#"{"$.price":[4472],"$.inventory.in_stock":[8]}"#
                || updated_fields == r#"{"$.inventory.in_stock":[8],"$.price":[4472]}"#
        );
        // REMOVE_END

        // STEP_START update_array
        let _: redis::Value = cmd("JSON.ARRAPPEND")
            .arg("bike:1")
            .arg("$.colors")
            .arg("\"red\"")
            .query(&mut r)
            .expect("Failed to run JSON.ARRAPPEND");

        let updated_colors: String = r
            .json_get("bike:1", "$.colors")
            .expect("Failed to read updated colors");
        println!("{updated_colors}"); // >>> [["black","silver","red"]]
                                      // STEP_END

        // REMOVE_START
        assert_eq!(updated_colors, r#"[["black","silver","red"]]"#);
        // REMOVE_END
    }
}
