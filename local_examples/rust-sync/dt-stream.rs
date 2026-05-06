// EXAMPLE: stream_tutorial
#[cfg(test)]
mod stream_tests {
    use redis::{
        streams::{
            StreamAutoClaimOptions, StreamInfoConsumersReply, StreamInfoGroupsReply,
            StreamInfoStreamReply, StreamMaxlen, StreamPendingCountReply, StreamPendingReply,
            StreamRangeReply, StreamReadOptions, StreamReadReply, StreamTrimmingMode,
            StreamTrimOptions,
        },
        Commands,
    };
    use std::{thread::sleep, time::Duration};

    fn delete_keys(r: &mut redis::Connection, keys: &[&str]) {
        let _: usize = r.del(keys).unwrap_or(0);
    }

    fn add_france_fixed(r: &mut redis::Connection) {
        delete_keys(r, &["race:france"]);
        let _: Option<String> = r
            .xadd(
                "race:france",
                "1692632086370-0",
                &[
                    ("rider", "Castilla"),
                    ("speed", "30.2"),
                    ("position", "1"),
                    ("location_id", "1"),
                ],
            )
            .expect("add france 1");
        let _: Option<String> = r
            .xadd(
                "race:france",
                "1692632094485-0",
                &[
                    ("rider", "Norem"),
                    ("speed", "28.8"),
                    ("position", "3"),
                    ("location_id", "1"),
                ],
            )
            .expect("add france 2");
        let _: Option<String> = r
            .xadd(
                "race:france",
                "1692632102976-0",
                &[
                    ("rider", "Prickett"),
                    ("speed", "29.7"),
                    ("position", "2"),
                    ("location_id", "1"),
                ],
            )
            .expect("add france 3");
        let _: Option<String> = r
            .xadd(
                "race:france",
                "1692632147973-0",
                &[
                    ("rider", "Castilla"),
                    ("speed", "29.9"),
                    ("position", "1"),
                    ("location_id", "2"),
                ],
            )
            .expect("add france 4");
    }

    fn seed_usa_fixed(r: &mut redis::Connection) {
        delete_keys(r, &["race:usa"]);
        let _: Option<String> = r
            .xadd("race:usa", "0-1", &[("racer", "Castilla")])
            .expect("add usa 1");
        let _: Option<String> = r
            .xadd("race:usa", "0-2", &[("racer", "Norem")])
            .expect("add usa 2");
    }

    fn seed_italy_group_base(r: &mut redis::Connection) {
        delete_keys(r, &["race:italy"]);
        let _: () = r
            .xgroup_create_mkstream("race:italy", "italy_riders", "$")
            .expect("create italy group");
        let _: Option<String> = r
            .xadd("race:italy", "1692632639151-0", &[("rider", "Castilla")])
            .expect("add italy 1");
        let _: Option<String> = r
            .xadd("race:italy", "1692632647899-0", &[("rider", "Royce")])
            .expect("add italy 2");
        let _: Option<String> = r
            .xadd("race:italy", "1692632662819-0", &[("rider", "Sam-Bodden")])
            .expect("add italy 3");
        let _: Option<String> = r
            .xadd("race:italy", "1692632670501-0", &[("rider", "Prickett")])
            .expect("add italy 4");
        let _: Option<String> = r
            .xadd("race:italy", "1692632678249-0", &[("rider", "Norem")])
            .expect("add italy 5");
    }

    fn seed_italy_alice_pending(r: &mut redis::Connection) {
        seed_italy_group_base(r);
        let opts = StreamReadOptions::default().group("italy_riders", "Alice").count(1);
        let _: Option<StreamReadReply> = r
            .xread_options(&["race:italy"], &[">"], &opts)
            .expect("alice read pending");
    }

    fn seed_italy_after_ack(r: &mut redis::Connection) {
        seed_italy_alice_pending(r);
        let _: usize = r
            .xack("race:italy", "italy_riders", &["1692632639151-0"])
            .expect("ack first italy message");
    }

    fn seed_italy_bob_pending(r: &mut redis::Connection) {
        seed_italy_after_ack(r);
        let opts = StreamReadOptions::default().group("italy_riders", "Bob").count(2);
        let _: Option<StreamReadReply> = r
            .xread_options(&["race:italy"], &[">"], &opts)
            .expect("bob read pending");
    }

    fn seed_italy_info_state(r: &mut redis::Connection) {
        seed_italy_bob_pending(r);
        sleep(Duration::from_millis(5));
        let _: redis::streams::StreamClaimReply = r
            .xclaim("race:italy", "italy_riders", "Alice", 1, &["1692632647899-0"])
            .expect("alice claim");
        sleep(Duration::from_millis(5));
        let _: redis::streams::StreamClaimReply = r
            .xclaim("race:italy", "italy_riders", "Lora", 1, &["1692632662819-0"])
            .expect("lora claim");
    }

    fn seed_trim_stream(r: &mut redis::Connection) {
        delete_keys(r, &["mystream"]);
        for id in ["1-0", "2-0", "3-0", "4-0", "5-0", "6-0", "7-0", "8-0", "9-0", "10-0"] {
            let _: Option<String> = r
                .xadd("mystream", id, &[("field", "value")])
                .expect("seed mystream");
        }
    }

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
        let _: () = r.flushall().expect("Failed to flushall");
        // REMOVE_END

        // STEP_START xadd
        let res1 = {
            let res: Option<String> = r
                .xadd(
                    "race:france",
                    "*",
                    &[
                        ("rider", "Castilla"),
                        ("speed", "30.2"),
                        ("position", "1"),
                        ("location_id", "1"),
                    ],
                )
                .expect("xadd 1");
            res.expect("missing stream id")
        };
        println!("{res1}"); // >>> 1692632086370-0

        let res2 = {
            let res: Option<String> = r
                .xadd(
                    "race:france",
                    "*",
                    &[
                        ("rider", "Norem"),
                        ("speed", "28.8"),
                        ("position", "3"),
                        ("location_id", "1"),
                    ],
                )
                .expect("xadd 2");
            res.expect("missing stream id")
        };
        println!("{res2}"); // >>> 1692632094485-0

        let res3 = {
            let res: Option<String> = r
                .xadd(
                    "race:france",
                    "*",
                    &[
                        ("rider", "Prickett"),
                        ("speed", "29.7"),
                        ("position", "2"),
                        ("location_id", "1"),
                    ],
                )
                .expect("xadd 3");
            res.expect("missing stream id")
        };
        println!("{res3}"); // >>> 1692632102976-0
        // STEP_END
        // REMOVE_START
        let parse = |id: &str| {
            let (ms, seq) = id.split_once('-').expect("invalid stream id");
            (
                ms.parse::<u64>().expect("invalid stream id millis"),
                seq.parse::<u64>().expect("invalid stream id seq"),
            )
        };
        assert!(parse(&res1) < parse(&res2));
        assert!(parse(&res2) < parse(&res3));
        // REMOVE_END

        // HIDE_START
        add_france_fixed(&mut r);
        // HIDE_END
        // STEP_START xrange
        if let Ok(res) = r.xrange_count("race:france", "1692632086370-0", "+", 2) {
            let res: StreamRangeReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![
                            ("rider".to_string(), entry.get::<String>("rider").expect("missing rider")),
                            ("speed".to_string(), entry.get::<String>("speed").expect("missing speed")),
                            ("position".to_string(), entry.get::<String>("position").expect("missing position")),
                            (
                                "location_id".to_string(),
                                entry.get::<String>("location_id").expect("missing location_id"),
                            ),
                        ],
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("1692632086370-0", [("rider", "Castilla"), ("speed", "30.2"), ("position", "1"), ("location_id", "1")]), ("1692632094485-0", [("rider", "Norem"), ("speed", "28.8"), ("position", "3"), ("location_id", "1")])]
            // REMOVE_START
            assert_eq!(view.len(), 2);
            assert_eq!(view[0].0, "1692632086370-0");
            assert_eq!(view[1].0, "1692632094485-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        add_france_fixed(&mut r);
        // HIDE_END
        // STEP_START xread_block
        let opts = StreamReadOptions::default().count(100).block(300);
        if let Ok(res) = r.xread_options(&["race:france"], &["$"], &opts) {
            let res: Option<StreamReadReply> = res;
            println!("{res:?}"); // >>> None
            // REMOVE_START
            assert!(res.is_none());
            // REMOVE_END
        }
        // STEP_END

        // STEP_START xadd_2
        if let Ok(res) = r.xadd(
            "race:france",
            "*",
            &[
                ("rider", "Castilla"),
                ("speed", "29.9"),
                ("position", "1"),
                ("location_id", "2"),
            ],
        ) {
            let res: Option<String> = res;
            let res = res.expect("missing stream id");
            println!("{res}"); // >>> 1692632147973-0
            // REMOVE_START
            let (ms, seq) = res.split_once('-').expect("invalid stream id");
            let _ = (
                ms.parse::<u64>().expect("invalid stream id millis"),
                seq.parse::<u64>().expect("invalid stream id seq"),
            );
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        add_france_fixed(&mut r);
        // HIDE_END
        // STEP_START xlen
        if let Ok(res) = r.xlen("race:france") {
            let res: usize = res;
            println!("{res}"); // >>> 4
            // REMOVE_START
            assert_eq!(res, 4);
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        delete_keys(&mut r, &["race:usa"]);
        // HIDE_END
        // STEP_START xadd_id
        if let Ok(res) = r.xadd("race:usa", "0-1", &[("racer", "Castilla")]) {
            let res: Option<String> = res;
            let res = res.expect("missing stream id");
            println!("{res}"); // >>> 0-1
            // REMOVE_START
            assert_eq!(res, "0-1");
            // REMOVE_END
        }

        if let Ok(res) = r.xadd("race:usa", "0-2", &[("racer", "Norem")]) {
            let res: Option<String> = res;
            let res = res.expect("missing stream id");
            println!("{res}"); // >>> 0-2
            // REMOVE_START
            assert_eq!(res, "0-2");
            // REMOVE_END
        }
        // STEP_END

        // STEP_START xadd_bad_id
        let res: redis::RedisResult<Option<String>> =
            r.xadd("race:usa", "0-1", &[("racer", "Prickett")]);
        match res {
            Ok(_) => {}
            Err(e) => {
                let msg = e.to_string();
                println!("{msg}");
                // >>> An error was signalled by the server - ResponseError: The ID specified in XADD is equal or smaller than the target stream top item
                // REMOVE_START
                assert!(msg.contains("equal or smaller"));
                // REMOVE_END
            }
        }
        // STEP_END

        // HIDE_START
        seed_usa_fixed(&mut r);
        // HIDE_END
        // STEP_START xadd_7
        if let Ok(res) = r.xadd("race:usa", "0-*", &[("racer", "Prickett")]) {
            let res: Option<String> = res;
            let res = res.expect("missing stream id");
            println!("{res}"); // >>> 0-3
            // REMOVE_START
            assert_eq!(res, "0-3");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        add_france_fixed(&mut r);
        // HIDE_END
        // STEP_START xrange_all
        if let Ok(res) = r.xrange_all("race:france") {
            let res: StreamRangeReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![
                            ("rider".to_string(), entry.get::<String>("rider").expect("missing rider")),
                            ("speed".to_string(), entry.get::<String>("speed").expect("missing speed")),
                            ("position".to_string(), entry.get::<String>("position").expect("missing position")),
                            (
                                "location_id".to_string(),
                                entry.get::<String>("location_id").expect("missing location_id"),
                            ),
                        ],
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("1692632086370-0", [("rider", "Castilla"), ("speed", "30.2"), ("position", "1"), ("location_id", "1")]), ("1692632094485-0", [("rider", "Norem"), ("speed", "28.8"), ("position", "3"), ("location_id", "1")]), ("1692632102976-0", [("rider", "Prickett"), ("speed", "29.7"), ("position", "2"), ("location_id", "1")]), ("1692632147973-0", [("rider", "Castilla"), ("speed", "29.9"), ("position", "1"), ("location_id", "2")])]
            // REMOVE_START
            assert_eq!(view.len(), 4);
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        add_france_fixed(&mut r);
        // HIDE_END
        // STEP_START xrange_time
        if let Ok(res) = r.xrange("race:france", "1692632086369", "1692632086371") {
            let res: StreamRangeReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![
                            ("rider".to_string(), entry.get::<String>("rider").expect("missing rider")),
                            ("speed".to_string(), entry.get::<String>("speed").expect("missing speed")),
                            ("position".to_string(), entry.get::<String>("position").expect("missing position")),
                            (
                                "location_id".to_string(),
                                entry.get::<String>("location_id").expect("missing location_id"),
                            ),
                        ],
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("1692632086370-0", [("rider", "Castilla"), ("speed", "30.2"), ("position", "1"), ("location_id", "1")])]
            // REMOVE_START
            assert_eq!(view.len(), 1);
            assert_eq!(view[0].0, "1692632086370-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        add_france_fixed(&mut r);
        // HIDE_END
        // STEP_START xrange_step_1
        if let Ok(res) = r.xrange_count("race:france", "-", "+", 2) {
            let res: StreamRangeReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![
                            ("rider".to_string(), entry.get::<String>("rider").expect("missing rider")),
                            ("speed".to_string(), entry.get::<String>("speed").expect("missing speed")),
                            ("position".to_string(), entry.get::<String>("position").expect("missing position")),
                            (
                                "location_id".to_string(),
                                entry.get::<String>("location_id").expect("missing location_id"),
                            ),
                        ],
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("1692632086370-0", [("rider", "Castilla"), ("speed", "30.2"), ("position", "1"), ("location_id", "1")]), ("1692632094485-0", [("rider", "Norem"), ("speed", "28.8"), ("position", "3"), ("location_id", "1")])]
            // REMOVE_START
            assert_eq!(view.len(), 2);
            assert_eq!(view[1].0, "1692632094485-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        add_france_fixed(&mut r);
        // HIDE_END
        // STEP_START xrange_step_2
        if let Ok(res) = r.xrange_count("race:france", "(1692632094485-0", "+", 2) {
            let res: StreamRangeReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![
                            ("rider".to_string(), entry.get::<String>("rider").expect("missing rider")),
                            ("speed".to_string(), entry.get::<String>("speed").expect("missing speed")),
                            ("position".to_string(), entry.get::<String>("position").expect("missing position")),
                            (
                                "location_id".to_string(),
                                entry.get::<String>("location_id").expect("missing location_id"),
                            ),
                        ],
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("1692632102976-0", [("rider", "Prickett"), ("speed", "29.7"), ("position", "2"), ("location_id", "1")]), ("1692632147973-0", [("rider", "Castilla"), ("speed", "29.9"), ("position", "1"), ("location_id", "2")])]
            // REMOVE_START
            assert_eq!(view.len(), 2);
            assert_eq!(view[0].0, "1692632102976-0");
            assert_eq!(view[1].0, "1692632147973-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        add_france_fixed(&mut r);
        // HIDE_END
        // STEP_START xrange_empty
        if let Ok(res) = r.xrange_count("race:france", "(1692632147973-0", "+", 2) {
            let res: StreamRangeReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![
                            ("rider".to_string(), entry.get::<String>("rider").expect("missing rider")),
                            ("speed".to_string(), entry.get::<String>("speed").expect("missing speed")),
                            ("position".to_string(), entry.get::<String>("position").expect("missing position")),
                            (
                                "location_id".to_string(),
                                entry.get::<String>("location_id").expect("missing location_id"),
                            ),
                        ],
                    )
                })
                .collect();
            println!("{view:?}"); // >>> []
            // REMOVE_START
            assert!(view.is_empty());
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        add_france_fixed(&mut r);
        // HIDE_END
        // STEP_START xrevrange
        if let Ok(res) = r.xrevrange_count("race:france", "+", "-", 1) {
            let res: StreamRangeReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![
                            ("rider".to_string(), entry.get::<String>("rider").expect("missing rider")),
                            ("speed".to_string(), entry.get::<String>("speed").expect("missing speed")),
                            ("position".to_string(), entry.get::<String>("position").expect("missing position")),
                            (
                                "location_id".to_string(),
                                entry.get::<String>("location_id").expect("missing location_id"),
                            ),
                        ],
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("1692632147973-0", [("rider", "Castilla"), ("speed", "29.9"), ("position", "1"), ("location_id", "2")])]
            // REMOVE_START
            assert_eq!(view.len(), 1);
            assert_eq!(view[0].0, "1692632147973-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        add_france_fixed(&mut r);
        // HIDE_END
        // STEP_START xread
        let opts = StreamReadOptions::default().count(2);
        if let Ok(res) = r.xread_options(&["race:france"], &["0"], &opts) {
            let res: Option<StreamReadReply> = res;
            let reply = res.expect("xread should return data");
            let view: Vec<_> = reply
                .keys
                .iter()
                .map(|stream| {
                    (
                        stream.key.clone(),
                        stream
                            .ids
                            .iter()
                            .map(|entry| {
                                (
                                    entry.id.clone(),
                                    vec![
                                        ("rider".to_string(), entry.get::<String>("rider").expect("missing rider")),
                                        ("speed".to_string(), entry.get::<String>("speed").expect("missing speed")),
                                        ("position".to_string(), entry.get::<String>("position").expect("missing position")),
                                        (
                                            "location_id".to_string(),
                                            entry.get::<String>("location_id").expect("missing location_id"),
                                        ),
                                    ],
                                )
                            })
                            .collect::<Vec<_>>(),
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("race:france", [("1692632086370-0", [("rider", "Castilla"), ("speed", "30.2"), ("position", "1"), ("location_id", "1")]), ("1692632094485-0", [("rider", "Norem"), ("speed", "28.8"), ("position", "3"), ("location_id", "1")])])]
            // REMOVE_START
            assert_eq!(view.len(), 1);
            assert_eq!(view[0].1.len(), 2);
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        add_france_fixed(&mut r);
        // HIDE_END
        // STEP_START xgroup_create
        if let Ok(res) = r.xgroup_create("race:france", "france_riders", "$") {
            let res: () = res;
            let _ = res;
            println!("OK"); // >>> OK
        }
        // STEP_END

        // HIDE_START
        delete_keys(&mut r, &["race:italy"]);
        // HIDE_END
        // STEP_START xgroup_create_mkstream
        if let Ok(res) = r.xgroup_create_mkstream("race:italy", "italy_riders", "$") {
            let res: () = res;
            let _ = res;
            println!("OK"); // >>> OK
        }
        // STEP_END

        // HIDE_START
        delete_keys(&mut r, &["race:italy"]);
        let _: () = r
            .xgroup_create_mkstream("race:italy", "italy_riders", "$")
            .expect("create italy group");
        // HIDE_END
        // STEP_START xgroup_read
        let italy_1: Option<String> = r
            .xadd("race:italy", "1692632639151-0", &[("rider", "Castilla")])
            .expect("italy1");
        let italy_1 = italy_1.expect("missing stream id");
        println!("{italy_1}"); // >>> 1692632639151-0
        let italy_2: Option<String> = r
            .xadd("race:italy", "1692632647899-0", &[("rider", "Royce")])
            .expect("italy2");
        let italy_2 = italy_2.expect("missing stream id");
        println!("{italy_2}"); // >>> 1692632647899-0
        let italy_3: Option<String> = r
            .xadd("race:italy", "1692632662819-0", &[("rider", "Sam-Bodden")])
            .expect("italy3");
        let italy_3 = italy_3.expect("missing stream id");
        println!("{italy_3}"); // >>> 1692632662819-0
        let italy_4: Option<String> = r
            .xadd("race:italy", "1692632670501-0", &[("rider", "Prickett")])
            .expect("italy4");
        let italy_4 = italy_4.expect("missing stream id");
        println!("{italy_4}"); // >>> 1692632670501-0
        let italy_5: Option<String> = r
            .xadd("race:italy", "1692632678249-0", &[("rider", "Norem")])
            .expect("italy5");
        let italy_5 = italy_5.expect("missing stream id");
        println!("{italy_5}"); // >>> 1692632678249-0

        let opts = StreamReadOptions::default().group("italy_riders", "Alice").count(1);
        if let Ok(res) = r.xread_options(&["race:italy"], &[">"], &opts) {
            let res: Option<StreamReadReply> = res;
            let view: Vec<_> = res
                .expect("xgroup read should return data")
                .keys
                .iter()
                .map(|stream| {
                    (
                        stream.key.clone(),
                        stream
                            .ids
                            .iter()
                            .map(|entry| {
                                (
                                    entry.id.clone(),
                                    vec![(
                                        "rider".to_string(),
                                        entry.get::<String>("rider").expect("missing rider"),
                                    )],
                                )
                            })
                            .collect::<Vec<_>>(),
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("race:italy", [("1692632639151-0", [("rider", "Castilla")])])]
            // REMOVE_START
            assert_eq!(view[0].1[0].0, "1692632639151-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        seed_italy_alice_pending(&mut r);
        // HIDE_END
        // STEP_START xgroup_read_id
        let opts = StreamReadOptions::default().group("italy_riders", "Alice");
        if let Ok(res) = r.xread_options(&["race:italy"], &["0"], &opts) {
            let res: Option<StreamReadReply> = res;
            let view: Vec<_> = res
                .expect("xgroup history")
                .keys
                .iter()
                .map(|stream| {
                    (
                        stream.key.clone(),
                        stream
                            .ids
                            .iter()
                            .map(|entry| {
                                (
                                    entry.id.clone(),
                                    vec![(
                                        "rider".to_string(),
                                        entry.get::<String>("rider").expect("missing rider"),
                                    )],
                                )
                            })
                            .collect::<Vec<_>>(),
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("race:italy", [("1692632639151-0", [("rider", "Castilla")])])]
            // REMOVE_START
            assert_eq!(view[0].1[0].0, "1692632639151-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        seed_italy_alice_pending(&mut r);
        // HIDE_END
        // STEP_START xack
        if let Ok(res) = r.xack("race:italy", "italy_riders", &["1692632639151-0"]) {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        let opts = StreamReadOptions::default().group("italy_riders", "Alice");
        if let Ok(res) = r.xread_options(&["race:italy"], &["0"], &opts) {
            let res: Option<StreamReadReply> = res;
            let view: Vec<_> = res
                .expect("xgroup history")
                .keys
                .iter()
                .map(|stream| {
                    (
                        stream.key.clone(),
                        stream
                            .ids
                            .iter()
                            .map(|entry| {
                                (
                                    entry.id.clone(),
                                    vec![(
                                        "rider".to_string(),
                                        entry.get::<String>("rider").expect("missing rider"),
                                    )],
                                )
                            })
                            .collect::<Vec<_>>(),
                    )
                })
                .collect();
            println!("{view:?}"); // >>> [("race:italy", [])]
            // REMOVE_START
            assert!(view[0].1.is_empty());
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        seed_italy_after_ack(&mut r);
        // HIDE_END
        // STEP_START xgroup_read_bob
        let opts = StreamReadOptions::default().group("italy_riders", "Bob").count(2);
        if let Ok(res) = r.xread_options(&["race:italy"], &[">"], &opts) {
            let res: Option<StreamReadReply> = res;
            let view: Vec<_> = res
                .expect("bob should receive data")
                .keys
                .iter()
                .map(|stream| {
                    (
                        stream.key.clone(),
                        stream
                            .ids
                            .iter()
                            .map(|entry| {
                                (
                                    entry.id.clone(),
                                    vec![(
                                        "rider".to_string(),
                                        entry.get::<String>("rider").expect("missing rider"),
                                    )],
                                )
                            })
                            .collect::<Vec<_>>(),
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("race:italy", [("1692632647899-0", [("rider", "Royce")]), ("1692632662819-0", [("rider", "Sam-Bodden")])])]
            // REMOVE_START
            assert_eq!(view[0].1.len(), 2);
            assert_eq!(view[0].1[0].0, "1692632647899-0");
            assert_eq!(view[0].1[1].0, "1692632662819-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        seed_italy_bob_pending(&mut r);
        // HIDE_END
        // STEP_START xpending
        if let Ok(res) = r.xpending("race:italy", "italy_riders") {
            let res: StreamPendingReply = res;
            let view = match res {
                StreamPendingReply::Empty => None,
                StreamPendingReply::Data(data) => Some((
                    data.count,
                    data.start_id.clone(),
                    data.end_id.clone(),
                    data.consumers
                        .iter()
                        .map(|consumer| (consumer.name.clone(), consumer.pending))
                        .collect::<Vec<_>>(),
                )),
            }
            .expect("pending summary");
            println!("{view:?}");
            // >>> (2, "1692632647899-0", "1692632662819-0", [("Bob", 2)])
            // REMOVE_START
            assert_eq!(view.0, 2);
            assert_eq!(view.1, "1692632647899-0");
            assert_eq!(view.2, "1692632662819-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        seed_italy_bob_pending(&mut r);
        sleep(Duration::from_millis(5));
        // HIDE_END
        // STEP_START xpending_plus_minus
        if let Ok(res) = r.xpending_count("race:italy", "italy_riders", "-", "+", 10) {
            let res: StreamPendingCountReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        entry.consumer.clone(),
                        entry.last_delivered_ms,
                        entry.times_delivered,
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("1692632647899-0", "Bob", 5, 1), ("1692632662819-0", "Bob", 5, 1)]
            // REMOVE_START
            assert_eq!(view.len(), 2);
            assert_eq!(view[0].0, "1692632647899-0");
            assert_eq!(view[1].0, "1692632662819-0");
            assert_eq!(view[0].1, "Bob");
            assert_eq!(view[0].3, 1);
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        seed_italy_bob_pending(&mut r);
        // HIDE_END
        // STEP_START xrange_pending
        if let Ok(res) = r.xrange("race:italy", "1692632647899-0", "1692632647899-0") {
            let res: StreamRangeReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![(
                            "rider".to_string(),
                            entry.get::<String>("rider").expect("missing rider"),
                        )],
                    )
                })
                .collect();
            println!("{view:?}"); // >>> [("1692632647899-0", [("rider", "Royce")])]
            // REMOVE_START
            assert_eq!(view.len(), 1);
            assert_eq!(view[0].0, "1692632647899-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        seed_italy_bob_pending(&mut r);
        sleep(Duration::from_millis(5));
        // HIDE_END
        // STEP_START xclaim
        if let Ok(res) = r.xclaim("race:italy", "italy_riders", "Alice", 1, &["1692632647899-0"]) {
            let res: redis::streams::StreamClaimReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![(
                            "rider".to_string(),
                            entry.get::<String>("rider").expect("missing rider"),
                        )],
                    )
                })
                .collect();
            println!("{view:?}"); // >>> [("1692632647899-0", [("rider", "Royce")])]
            // REMOVE_START
            assert_eq!(view.len(), 1);
            assert_eq!(view[0].0, "1692632647899-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        seed_italy_bob_pending(&mut r);
        sleep(Duration::from_millis(5));
        // HIDE_END
        // STEP_START xautoclaim
        let opts = StreamAutoClaimOptions::default().count(1);
        if let Ok(res) = r.xautoclaim_options("race:italy", "italy_riders", "Alice", 1, "0-0", opts) {
            let res: redis::streams::StreamAutoClaimReply = res;
            let claimed: Vec<_> = res
                .claimed
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![(
                            "rider".to_string(),
                            entry.get::<String>("rider").expect("missing rider"),
                        )],
                    )
                })
                .collect();
            println!("{:?}", (res.next_stream_id.clone(), &claimed));
            // >>> ("1692632662819-0", [("1692632647899-0", [("rider", "Royce")])])
            // REMOVE_START
            assert_eq!(claimed.len(), 1);
            assert_eq!(claimed[0].0, "1692632647899-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        seed_italy_bob_pending(&mut r);
        sleep(Duration::from_millis(5));
        let first_opts = StreamAutoClaimOptions::default().count(1);
        let _: redis::streams::StreamAutoClaimReply = r
            .xautoclaim_options("race:italy", "italy_riders", "Alice", 1, "0-0", first_opts)
            .expect("first autoclaim");
        // HIDE_END
        // STEP_START xautoclaim_cursor
        let next_opts = StreamAutoClaimOptions::default().count(1);
        if let Ok(res) = r.xautoclaim_options(
            "race:italy",
            "italy_riders",
            "Lora",
            1,
            "(1692632647899-0",
            next_opts,
        ) {
            let res: redis::streams::StreamAutoClaimReply = res;
            let claimed: Vec<_> = res
                .claimed
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![(
                            "rider".to_string(),
                            entry.get::<String>("rider").expect("missing rider"),
                        )],
                    )
                })
                .collect();
            println!("{:?}", (res.next_stream_id.clone(), &claimed));
            // >>> ("0-0", [("1692632662819-0", [("rider", "Sam-Bodden")])])
            // REMOVE_START
            assert_eq!(claimed.len(), 1);
            assert_eq!(claimed[0].0, "1692632662819-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        seed_italy_info_state(&mut r);
        // HIDE_END
        // STEP_START xinfo
        if let Ok(res) = r.xinfo_stream("race:italy") {
            let res: StreamInfoStreamReply = res;
            let view = (
                res.length,
                res.radix_tree_keys,
                res.groups,
                res.last_generated_id.clone(),
                res.first_entry.id.clone(),
                res.last_entry.id.clone(),
            );
            println!("{view:?}");
            // >>> (5, 1, 1, "1692632678249-0", "1692632639151-0", "1692632678249-0")
            // REMOVE_START
            assert_eq!(view.0, 5);
            assert_eq!(view.2, 1);
            assert_eq!(view.4, "1692632639151-0");
            assert_eq!(view.5, "1692632678249-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        seed_italy_info_state(&mut r);
        // HIDE_END
        // STEP_START xinfo_groups
        if let Ok(res) = r.xinfo_groups("race:italy") {
            let res: StreamInfoGroupsReply = res;
            let view: Vec<_> = res
                .groups
                .iter()
                .map(|group| {
                    (
                        group.name.clone(),
                        group.consumers,
                        group.pending,
                        group.last_delivered_id.clone(),
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("italy_riders", 3, 2, "1692632662819-0")]
            // REMOVE_START
            assert_eq!(view.len(), 1);
            assert_eq!(view[0].0, "italy_riders");
            assert_eq!(view[0].1, 3);
            assert_eq!(view[0].2, 2);
            assert_eq!(view[0].3, "1692632662819-0");
            // REMOVE_END
        }
        // STEP_END

        // HIDE_START
        seed_italy_info_state(&mut r);
        // HIDE_END
        // STEP_START xinfo_consumers
        if let Ok(res) = r.xinfo_consumers("race:italy", "italy_riders") {
            let res: StreamInfoConsumersReply = res;
            let mut view: Vec<_> = res
                .consumers
                .iter()
                .map(|consumer| (consumer.name.clone(), consumer.pending, consumer.idle))
                .collect();
            view.sort_by(|a, b| a.0.cmp(&b.0));
            println!("{view:?}");
            // >>> [("Alice", 1, 5), ("Bob", 0, 5), ("Lora", 1, 5)]
            // REMOVE_START
            assert_eq!(view.len(), 3);
            assert_eq!(view[0].0, "Alice");
            assert_eq!(view[0].1, 1);
            assert_eq!(view[1].0, "Bob");
            assert_eq!(view[2].0, "Lora");
            // REMOVE_END
        }
        // STEP_END

        // STEP_START maxlen
        // HIDE_START
        delete_keys(&mut r, &["race:italy"]);
        // HIDE_END
        let max1: Option<String> = r
            .xadd_maxlen("race:italy", StreamMaxlen::Equals(2), "1-0", &[("rider", "Jones")])
            .expect("maxlen add 1");
        let max1 = max1.expect("missing stream id");
        println!("{max1}"); // >>> 1-0
        let max2: Option<String> = r
            .xadd_maxlen("race:italy", StreamMaxlen::Equals(2), "2-0", &[("rider", "Wood")])
            .expect("maxlen add 2");
        let max2 = max2.expect("missing stream id");
        println!("{max2}"); // >>> 2-0
        let max3: Option<String> = r
            .xadd_maxlen("race:italy", StreamMaxlen::Equals(2), "3-0", &[("rider", "Henshaw")])
            .expect("maxlen add 3");
        let max3 = max3.expect("missing stream id");
        println!("{max3}"); // >>> 3-0

        if let Ok(res) = r.xlen("race:italy") {
            let res: usize = res;
            println!("{res}"); // >>> 2
            // REMOVE_START
            assert_eq!(res, 2);
            // REMOVE_END
        }

        if let Ok(res) = r.xrange_all("race:italy") {
            let res: StreamRangeReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![(
                            "rider".to_string(),
                            entry.get::<String>("rider").expect("missing rider"),
                        )],
                    )
                })
                .collect();
            println!("{view:?}");
            // >>> [("2-0", [("rider", "Wood")]), ("3-0", [("rider", "Henshaw")])]
            // REMOVE_START
            assert_eq!(view.len(), 2);
            assert_eq!(view[0].0, "2-0");
            assert_eq!(view[1].0, "3-0");
            // REMOVE_END
        }
        // STEP_END

        // STEP_START xtrim
        // HIDE_START
        delete_keys(&mut r, &["race:italy"]);
        let _: Option<String> = r.xadd("race:italy", "1-0", &[("rider", "Wood")]).expect("trim seed 1");
        let _: Option<String> = r.xadd("race:italy", "2-0", &[("rider", "Henshaw")]).expect("trim seed 2");
        // HIDE_END
        if let Ok(res) = r.xtrim("race:italy", StreamMaxlen::Equals(10)) {
            let res: usize = res;
            println!("{res}"); // >>> 0
            // REMOVE_START
            assert_eq!(res, 0);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START xtrim2
        // HIDE_START
        seed_trim_stream(&mut r);
        // HIDE_END
        if let Ok(res) = r.xtrim_options(
            "mystream",
            &StreamTrimOptions::maxlen(StreamTrimmingMode::Approx, 10),
        ) {
            let res: usize = res;
            println!("{res}"); // >>> 0
            // REMOVE_START
            assert_eq!(res, 0);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START xdel
        // HIDE_START
        delete_keys(&mut r, &["race:italy"]);
        let _: Option<String> = r.xadd("race:italy", "2-0", &[("rider", "Wood")]).expect("xdel seed 1");
        let _: Option<String> = r.xadd("race:italy", "3-0", &[("rider", "Henshaw")]).expect("xdel seed 2");
        // HIDE_END
        if let Ok(res) = r.xrange_count("race:italy", "-", "+", 2) {
            let res: StreamRangeReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![(
                            "rider".to_string(),
                            entry.get::<String>("rider").expect("missing rider"),
                        )],
                    )
                })
                .collect();
            println!("{view:?}"); // >>> [("2-0", [("rider", "Wood")]), ("3-0", [("rider", "Henshaw")])]
            // REMOVE_START
            assert_eq!(view.len(), 2);
            // REMOVE_END
        }

        if let Ok(res) = r.xdel("race:italy", &["3-0"]) {
            let res: usize = res;
            println!("{res}"); // >>> 1
            // REMOVE_START
            assert_eq!(res, 1);
            // REMOVE_END
        }

        if let Ok(res) = r.xrange_count("race:italy", "-", "+", 2) {
            let res: StreamRangeReply = res;
            let view: Vec<_> = res
                .ids
                .iter()
                .map(|entry| {
                    (
                        entry.id.clone(),
                        vec![(
                            "rider".to_string(),
                            entry.get::<String>("rider").expect("missing rider"),
                        )],
                    )
                })
                .collect();
            println!("{view:?}"); // >>> [("2-0", [("rider", "Wood")])]
            // REMOVE_START
            assert_eq!(view.len(), 1);
            assert_eq!(view[0].0, "2-0");
            // REMOVE_END
        }
        // STEP_END
    }
}
