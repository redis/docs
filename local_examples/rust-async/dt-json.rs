// EXAMPLE: json_tutorial
#[cfg(test)]
mod tests {
    use redis::{cmd, AsyncCommands, JsonAsyncCommands, Value};
    use serde_json::{json, Number, Value as JsonValue};

    // HIDE_START
    fn redis_value_to_json(value: &Value) -> JsonValue {
        match value {
            Value::Nil => JsonValue::Null,
            Value::Int(number) => json!(number),
            Value::BulkString(bytes) => {
                let text = String::from_utf8(bytes.clone()).expect("Redis response was not UTF-8");
                serde_json::from_str(&text).unwrap_or(JsonValue::String(text))
            }
            Value::Array(values) => {
                JsonValue::Array(values.iter().map(redis_value_to_json).collect())
            }
            Value::SimpleString(text) => JsonValue::String(text.clone()),
            Value::Okay => JsonValue::String("OK".to_string()),
            Value::Double(number) => Number::from_f64(*number)
                .map(JsonValue::Number)
                .unwrap_or(JsonValue::Null),
            Value::Boolean(flag) => JsonValue::Bool(*flag),
            _ => JsonValue::String(format!("{value:?}")),
        }
    }

    fn render_redis_value(value: &Value) -> String {
        serde_json::to_string(&redis_value_to_json(value)).expect("Failed to render Redis value")
    }

    fn print_redis_value(value: &Value) {
        println!("{}", render_redis_value(value));
    }

    fn print_set_result(result: bool) {
        println!("{}", if result { "OK" } else { "(nil)" });
    }

    fn inventory_json() -> JsonValue {
        json!({
            "inventory": {
                "mountain_bikes": [
                    {
                        "id": "bike:1",
                        "model": "Phoebe",
                        "description": "This is a mid-travel trail slayer that is a fantastic daily driver or one bike quiver. The Shimano Claris 8-speed groupset gives plenty of gear range to tackle hills and there's room for mudguards and a rack too.  This is the bike for the rider who wants trail manners with low fuss ownership.",
                        "price": 1920,
                        "specs": {"material": "carbon", "weight": 13.1},
                        "colors": ["black", "silver"]
                    },
                    {
                        "id": "bike:2",
                        "model": "Quaoar",
                        "description": "Redesigned for the 2020 model year, this bike impressed our testers and is the best all-around trail bike we've ever tested. The Shimano gear system effectively does away with an external cassette, so is super low maintenance in terms of wear and tear. All in all it's an impressive package for the price, making it very competitive.",
                        "price": 2072,
                        "specs": {"material": "aluminium", "weight": 7.9},
                        "colors": ["black", "white"]
                    },
                    {
                        "id": "bike:3",
                        "model": "Weywot",
                        "description": "This bike gives kids aged six years and older a durable and uberlight mountain bike for their first experience on tracks and easy cruising through forests and fields. A set of powerful Shimano hydraulic disc brakes provide ample stopping ability. If you're after a budget option, this is one of the best bikes you could get.",
                        "price": 3264,
                        "specs": {"material": "alloy", "weight": 13.8}
                    }
                ],
                "commuter_bikes": [
                    {
                        "id": "bike:4",
                        "model": "Salacia",
                        "description": "This bike is a great option for anyone who just wants a bike to get about on With a slick-shifting Claris gears from Shimano's, this is a bike which doesn't break the bank and delivers craved performance.  It's for the rider who wants both efficiency and capability.",
                        "price": 1475,
                        "specs": {"material": "aluminium", "weight": 16.6},
                        "colors": ["black", "silver"]
                    },
                    {
                        "id": "bike:5",
                        "model": "Mimas",
                        "description": "A real joy to ride, this bike got very high scores in last years Bike of the year report. The carefully crafted 50-34 tooth chainset and 11-32 tooth cassette give an easy-on-the-legs bottom gear for climbing, and the high-quality Vittoria Zaffiro tires give balance and grip.It includes a low-step frame , our memory foam seat, bump-resistant shocks and conveniently placed thumb throttle. Put it all together and you get a bike that helps redefine what can be done for this price.",
                        "price": 3941,
                        "specs": {"material": "alloy", "weight": 11.6}
                    }
                ]
            }
        })
    }
    // HIDE_END

    #[tokio::test]
    async fn run() {
        let client =
            redis::Client::open("redis://127.0.0.1").expect("Failed to create Redis client");
        let mut r = client
            .get_multiplexed_async_connection()
            .await
            .expect("Failed to connect to Redis");

        // REMOVE_START
        let _: () = r.flushall().await.expect("Failed to flush Redis");
        // REMOVE_END

        // STEP_START set_get
        let res1: bool = r
            .json_set("bike", "$", &json!("Hyperion"))
            .await
            .expect("Failed to run JSON.SET");
        print_set_result(res1); // >>> OK

        let res2: String = r
            .json_get("bike", "$")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res2}"); // >>> ["Hyperion"]

        let res3: Value = r
            .json_type("bike", "$")
            .await
            .expect("Failed to run JSON.TYPE");
        print_redis_value(&res3); // >>> ["string"]
                                  // STEP_END

        // REMOVE_START
        assert!(res1);
        assert_eq!(res2, r#"["Hyperion"]"#);
        let rendered_type = render_redis_value(&res3);
        assert!(rendered_type == r#"["string"]"# || rendered_type == r#"[["string"]]"#);
        // REMOVE_END

        // STEP_START str
        let res4: Value = r
            .json_str_len("bike", "$")
            .await
            .expect("Failed to run JSON.STRLEN");
        print_redis_value(&res4); // >>> [8]

        let res5: Value = r
            .json_str_append("bike", "$", "\" (Enduro bikes)\"")
            .await
            .expect("Failed to run JSON.STRAPPEND");
        print_redis_value(&res5); // >>> [23]

        let res6: String = r
            .json_get("bike", "$")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res6}"); // >>> ["Hyperion (Enduro bikes)"]
                            // STEP_END

        // REMOVE_START
        assert_eq!(render_redis_value(&res4), "[8]");
        assert_eq!(render_redis_value(&res5), "[23]");
        assert_eq!(res6, r#"["Hyperion (Enduro bikes)"]"#);
        // REMOVE_END

        // STEP_START num
        let res7: bool = r
            .json_set("crashes", "$", &json!(0))
            .await
            .expect("Failed to run JSON.SET");
        print_set_result(res7); // >>> OK

        let res8: String = cmd("JSON.NUMINCRBY")
            .arg("crashes")
            .arg("$")
            .arg(1)
            .query_async(&mut r)
            .await
            .expect("Failed to run JSON.NUMINCRBY");
        println!("{res8}"); // >>> [1]

        let res9: String = cmd("JSON.NUMINCRBY")
            .arg("crashes")
            .arg("$")
            .arg(1.5)
            .query_async(&mut r)
            .await
            .expect("Failed to run JSON.NUMINCRBY");
        println!("{res9}"); // >>> [2.5]

        let res10: String = cmd("JSON.NUMINCRBY")
            .arg("crashes")
            .arg("$")
            .arg(-0.75)
            .query_async(&mut r)
            .await
            .expect("Failed to run JSON.NUMINCRBY");
        println!("{res10}"); // >>> [1.75]

        let res11: String = cmd("JSON.NUMMULTBY")
            .arg("crashes")
            .arg("$")
            .arg(24)
            .query_async(&mut r)
            .await
            .expect("Failed to run JSON.NUMMULTBY");
        println!("{res11}"); // >>> [42.0]
                             // STEP_END

        // REMOVE_START
        assert!(res7);
        assert_eq!(res8, "[1]");
        assert_eq!(res9, "[2.5]");
        assert_eq!(res10, "[1.75]");
        assert_eq!(res11, "[42.0]");
        // REMOVE_END

        // STEP_START arr
        let res12: bool = r
            .json_set("newbike", "$", &json!(["Deimos", {"crashes": 0}, null]))
            .await
            .expect("Failed to run JSON.SET");
        print_set_result(res12); // >>> OK

        let res13: String = r
            .json_get("newbike", "$")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res13}"); // >>> [["Deimos",{"crashes":0},null]]

        let res14: String = r
            .json_get("newbike", "$[1].crashes")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res14}"); // >>> [0]

        let res15: i64 = r
            .json_del("newbike", "$[-1]")
            .await
            .expect("Failed to run JSON.DEL");
        println!("{res15}"); // >>> 1

        let res16: String = r
            .json_get("newbike", "$")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res16}"); // >>> [["Deimos",{"crashes":0}]]
                             // STEP_END

        // REMOVE_START
        assert!(res12);
        assert_eq!(res13, r#"[["Deimos",{"crashes":0},null]]"#);
        assert_eq!(res14, "[0]");
        assert_eq!(res15, 1);
        assert_eq!(res16, r#"[["Deimos",{"crashes":0}]]"#);
        // REMOVE_END

        // STEP_START arr2
        let res17: bool = r
            .json_set("riders", "$", &json!([]))
            .await
            .expect("Failed to run JSON.SET");
        print_set_result(res17); // >>> OK

        let res18: Value = r
            .json_arr_append("riders", "$", &json!("Norem"))
            .await
            .expect("Failed to run JSON.ARRAPPEND");
        print_redis_value(&res18); // >>> [1]

        let res19: String = r
            .json_get("riders", "$")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res19}"); // >>> [["Norem"]]

        let res20: Value = cmd("JSON.ARRINSERT")
            .arg("riders")
            .arg("$")
            .arg(1)
            .arg("\"Prickett\"")
            .arg("\"Royce\"")
            .arg("\"Castilla\"")
            .query_async(&mut r)
            .await
            .expect("Failed to run JSON.ARRINSERT");
        print_redis_value(&res20); // >>> [4]

        let res21: String = r
            .json_get("riders", "$")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res21}"); // >>> [["Norem","Prickett","Royce","Castilla"]]

        let res22: Value = r
            .json_arr_trim("riders", "$", 1, 1)
            .await
            .expect("Failed to run JSON.ARRTRIM");
        print_redis_value(&res22); // >>> [1]

        let res23: String = r
            .json_get("riders", "$")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res23}"); // >>> [["Prickett"]]

        let res24: Value = r
            .json_arr_pop("riders", "$", -1)
            .await
            .expect("Failed to run JSON.ARRPOP");
        print_redis_value(&res24); // >>> ["Prickett"]

        let res25: Value = r
            .json_arr_pop("riders", "$", -1)
            .await
            .expect("Failed to run JSON.ARRPOP");
        print_redis_value(&res25); // >>> [null]
                                   // STEP_END

        // REMOVE_START
        assert!(res17);
        assert_eq!(render_redis_value(&res18), "[1]");
        assert_eq!(res19, r#"[["Norem"]]"#);
        assert_eq!(render_redis_value(&res20), "[4]");
        assert_eq!(res21, r#"[["Norem","Prickett","Royce","Castilla"]]"#);
        assert_eq!(render_redis_value(&res22), "[1]");
        assert_eq!(res23, r#"[["Prickett"]]"#);
        assert_eq!(render_redis_value(&res24), r#"["Prickett"]"#);
        assert_eq!(render_redis_value(&res25), "[null]");
        // REMOVE_END

        // STEP_START obj
        let res26: bool = r
            .json_set(
                "bike:1",
                "$",
                &json!({"model": "Deimos", "brand": "Ergonom", "price": 4972}),
            )
            .await
            .expect("Failed to run JSON.SET");
        print_set_result(res26); // >>> OK

        let res27: Value = r
            .json_obj_len("bike:1", "$")
            .await
            .expect("Failed to run JSON.OBJLEN");
        print_redis_value(&res27); // >>> [3]

        let res28: Value = r
            .json_obj_keys("bike:1", "$")
            .await
            .expect("Failed to run JSON.OBJKEYS");
        print_redis_value(&res28); // >>> [["brand","model","price"]]
                                   // STEP_END

        // REMOVE_START
        assert!(res26);
        assert_eq!(render_redis_value(&res27), "[3]");
        assert_eq!(render_redis_value(&res28), r#"[["brand","model","price"]]"#);
        // REMOVE_END

        // STEP_START set_bikes
        let res29: bool = r
            .json_set("bikes:inventory", "$", &inventory_json())
            .await
            .expect("Failed to run JSON.SET");
        print_set_result(res29); // >>> OK
                                 // STEP_END

        // REMOVE_START
        assert!(res29);
        // REMOVE_END

        // STEP_START get_bikes
        let res30: String = r
            .json_get("bikes:inventory", "$.inventory.*")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res30}");
        // >>> [[{"id":"bike:1","model":"Phoebe","description":"This is a mid-travel trail slayer...
        // STEP_END

        // STEP_START get_mtnbikes
        let res31: String = r
            .json_get("bikes:inventory", "$.inventory.mountain_bikes[*].model")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res31}"); // >>> [["Phoebe","Quaoar","Weywot"]]

        let res32: String = r
            .json_get(
                "bikes:inventory",
                r#"$.inventory["mountain_bikes"][*].model"#,
            )
            .await
            .expect("Failed to run JSON.GET");
        println!("{res32}"); // >>> [["Phoebe","Quaoar","Weywot"]]

        let res33: String = r
            .json_get("bikes:inventory", "$..mountain_bikes[*].model")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res33}"); // >>> [["Phoebe","Quaoar","Weywot"]]
                             // STEP_END

        // REMOVE_START
        assert_eq!(res31, r#"["Phoebe","Quaoar","Weywot"]"#);
        assert_eq!(res32, r#"["Phoebe","Quaoar","Weywot"]"#);
        assert_eq!(res33, r#"["Phoebe","Quaoar","Weywot"]"#);
        // REMOVE_END

        // STEP_START get_models
        let res34: String = r
            .json_get("bikes:inventory", "$..model")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res34}"); // >>> [["Phoebe","Quaoar","Weywot","Salacia","Mimas"]]
                             // STEP_END

        // REMOVE_START
        assert_eq!(res34, r#"["Salacia","Mimas","Phoebe","Quaoar","Weywot"]"#);
        // REMOVE_END

        // STEP_START get2mtnbikes
        let res35: String = r
            .json_get("bikes:inventory", "$..mountain_bikes[0:2].model")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res35}"); // >>> [["Phoebe","Quaoar"]]
                             // STEP_END

        // REMOVE_START
        assert_eq!(res35, r#"["Phoebe","Quaoar"]"#);
        // REMOVE_END

        // STEP_START filter1
        let res36: String = r
            .json_get(
                "bikes:inventory",
                "$..mountain_bikes[?(@.price < 3000 && @.specs.weight < 10)]",
            )
            .await
            .expect("Failed to run JSON.GET");
        println!("{res36}");
        // >>> [[{"id":"bike:2","model":"Quaoar","description":"Redesigned for the 2020 model year...
        // STEP_END

        // STEP_START filter2
        let res37: String = r
            .json_get(
                "bikes:inventory",
                "$..[?(@.specs.material == 'alloy')].model",
            )
            .await
            .expect("Failed to run JSON.GET");
        println!("{res37}"); // >>> [["Weywot","Mimas"]]
                             // STEP_END

        // REMOVE_START
        assert_eq!(res37, r#"["Mimas","Weywot"]"#);
        // REMOVE_END

        // STEP_START filter3
        let res38: String = r
            .json_get(
                "bikes:inventory",
                "$..[?(@.specs.material =~ '(?i)al')].model",
            )
            .await
            .expect("Failed to run JSON.GET");
        println!("{res38}"); // >>> [["Quaoar","Weywot","Salacia","Mimas"]]
                             // STEP_END

        // REMOVE_START
        assert_eq!(res38, r#"["Salacia","Mimas","Quaoar","Weywot"]"#);
        // REMOVE_END

        // STEP_START filter4
        let _: bool = r
            .json_set(
                "bikes:inventory",
                "$.inventory.mountain_bikes[0].regex_pat",
                &json!("(?i)al"),
            )
            .await
            .expect("Failed to run JSON.SET");
        let _: bool = r
            .json_set(
                "bikes:inventory",
                "$.inventory.mountain_bikes[1].regex_pat",
                &json!("(?i)al"),
            )
            .await
            .expect("Failed to run JSON.SET");
        let _: bool = r
            .json_set(
                "bikes:inventory",
                "$.inventory.mountain_bikes[2].regex_pat",
                &json!("(?i)al"),
            )
            .await
            .expect("Failed to run JSON.SET");

        let res39: String = r
            .json_get(
                "bikes:inventory",
                "$.inventory.mountain_bikes[?(@.specs.material =~ @.regex_pat)].model",
            )
            .await
            .expect("Failed to run JSON.GET");
        println!("{res39}"); // >>> [["Quaoar","Weywot"]]
                             // STEP_END

        // REMOVE_START
        assert_eq!(res39, r#"["Quaoar","Weywot"]"#);
        // REMOVE_END

        // STEP_START update_bikes
        let res40: String = r
            .json_get("bikes:inventory", "$..price")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res40}"); // >>> [1920,2072,3264,1475,3941]

        let res41: String = cmd("JSON.NUMINCRBY")
            .arg("bikes:inventory")
            .arg("$..price")
            .arg(-100)
            .query_async(&mut r)
            .await
            .expect("Failed to run JSON.NUMINCRBY");
        println!("{res41}"); // >>> [1820,1972,3164,1375,3841]

        let res42: String = cmd("JSON.NUMINCRBY")
            .arg("bikes:inventory")
            .arg("$..price")
            .arg(100)
            .query_async(&mut r)
            .await
            .expect("Failed to run JSON.NUMINCRBY");
        println!("{res42}"); // >>> [1920,2072,3264,1475,3941]
                             // STEP_END

        // REMOVE_START
        assert_eq!(res40, "[1475,3941,1920,2072,3264]");
        assert_eq!(res41, "[1375,3841,1820,1972,3164]");
        assert_eq!(res42, "[1475,3941,1920,2072,3264]");
        // REMOVE_END

        // STEP_START update_filters1
        let _: bool = r
            .json_set(
                "bikes:inventory",
                "$.inventory.*[?(@.price<2000)].price",
                &json!(1500),
            )
            .await
            .expect("Failed to run JSON.SET");

        let res43: String = r
            .json_get("bikes:inventory", "$..price")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res43}"); // >>> [1500,2072,3264,1500,3941]
                             // STEP_END

        // REMOVE_START
        assert_eq!(res43, "[1500,3941,1500,2072,3264]");
        // REMOVE_END

        // STEP_START update_filters2
        let res44: Value = cmd("JSON.ARRAPPEND")
            .arg("bikes:inventory")
            .arg("$.inventory.*[?(@.price<2000)].colors")
            .arg("\"pink\"")
            .query_async(&mut r)
            .await
            .expect("Failed to run JSON.ARRAPPEND");
        print_redis_value(&res44); // >>> [3,3]

        let res45: String = r
            .json_get("bikes:inventory", "$..[*].colors")
            .await
            .expect("Failed to run JSON.GET");
        println!("{res45}");
        // >>> [["black","silver","pink"],["black","white"],["black","silver","pink"]]
        // STEP_END

        // REMOVE_START
        assert_eq!(render_redis_value(&res44), "[3,3]");
        assert_eq!(
            res45,
            r#"[["black","silver","pink"],["black","silver","pink"],["black","white"]]"#
        );
        // REMOVE_END
    }
}
