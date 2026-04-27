// EXAMPLE: stream_tutorial
#[cfg(test)]
mod tests {
    use redis::{
        streams::{
            StreamAutoClaimOptions, StreamInfoConsumersReply, StreamInfoGroupsReply,
            StreamInfoStreamReply, StreamMaxlen, StreamPendingCountReply, StreamPendingReply,
            StreamRangeReply, StreamReadOptions, StreamReadReply, StreamTrimmingMode, StreamTrimOptions,
        },
        AsyncCommands,
    };
    use tokio::time::{sleep, Duration};

    async fn delete_keys(r: &mut redis::aio::MultiplexedConnection, keys: &[&str]) {
        let _: usize = r.del(keys).await.unwrap_or(0);
    }

    async fn add_france_fixed(r: &mut redis::aio::MultiplexedConnection) {
        delete_keys(r, &["race:france"]).await;
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
            .await
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
            .await
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
            .await
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
            .await
            .expect("add france 4");
    }

    async fn seed_usa_fixed(r: &mut redis::aio::MultiplexedConnection) {
        delete_keys(r, &["race:usa"]).await;
        let _: Option<String> = r
            .xadd("race:usa", "0-1", &[("racer", "Castilla")])
            .await
            .expect("add usa 1");
        let _: Option<String> = r
            .xadd("race:usa", "0-2", &[("racer", "Norem")])
            .await
            .expect("add usa 2");
    }

    async fn seed_italy_group_base(r: &mut redis::aio::MultiplexedConnection) {
        delete_keys(r, &["race:italy"]).await;
        let _: () = r
            .xgroup_create_mkstream("race:italy", "italy_riders", "$")
            .await
            .expect("create italy group");
        let _: Option<String> = r
            .xadd("race:italy", "1692632639151-0", &[("rider", "Castilla")])
            .await
            .expect("add italy 1");
        let _: Option<String> = r
            .xadd("race:italy", "1692632647899-0", &[("rider", "Royce")])
            .await
            .expect("add italy 2");
        let _: Option<String> = r
            .xadd("race:italy", "1692632662819-0", &[("rider", "Sam-Bodden")])
            .await
            .expect("add italy 3");
        let _: Option<String> = r
            .xadd("race:italy", "1692632670501-0", &[("rider", "Prickett")])
            .await
            .expect("add italy 4");
        let _: Option<String> = r
            .xadd("race:italy", "1692632678249-0", &[("rider", "Norem")])
            .await
            .expect("add italy 5");
    }

    async fn seed_italy_alice_pending(r: &mut redis::aio::MultiplexedConnection) {
        seed_italy_group_base(r).await;
        let opts = StreamReadOptions::default().group("italy_riders", "Alice").count(1);
        let _: Option<StreamReadReply> = r
            .xread_options(&["race:italy"], &[">"], &opts)
            .await
            .expect("alice read pending");
    }

    async fn seed_italy_after_ack(r: &mut redis::aio::MultiplexedConnection) {
        seed_italy_alice_pending(r).await;
        let _: usize = r
            .xack("race:italy", "italy_riders", &["1692632639151-0"])
            .await
            .expect("ack first italy message");
    }

    async fn seed_italy_bob_pending(r: &mut redis::aio::MultiplexedConnection) {
        seed_italy_after_ack(r).await;
        let opts = StreamReadOptions::default().group("italy_riders", "Bob").count(2);
        let _: Option<StreamReadReply> = r
            .xread_options(&["race:italy"], &[">"], &opts)
            .await
            .expect("bob read pending");
    }

    async fn seed_italy_info_state(r: &mut redis::aio::MultiplexedConnection) {
        seed_italy_bob_pending(r).await;
        sleep(Duration::from_millis(5)).await;
        let _: redis::streams::StreamClaimReply = r
            .xclaim("race:italy", "italy_riders", "Alice", 1, &["1692632647899-0"])
            .await
            .expect("alice claim");
        sleep(Duration::from_millis(5)).await;
        let _: redis::streams::StreamClaimReply = r
            .xclaim("race:italy", "italy_riders", "Lora", 1, &["1692632662819-0"])
            .await
            .expect("lora claim");
    }

    async fn seed_trim_stream(r: &mut redis::aio::MultiplexedConnection) {
        delete_keys(r, &["mystream"]).await;
        for id in ["1-0", "2-0", "3-0", "4-0", "5-0", "6-0", "7-0", "8-0", "9-0", "10-0"] {
            let _: Option<String> = r
                .xadd("mystream", id, &[("field", "value")])
                .await
                .expect("seed mystream");
        }
    }

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
        // REMOVE_START
        let _: () = r.flushall().await.expect("Failed to flushall");
        // REMOVE_END

        // STEP_START xadd
        let res1: Option<String> = r
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
            .await
            .expect("xadd 1");
        let res1 = res1.expect("missing stream id");
        println!("{res1}"); // >>> 1692632086370-0

        let res2: Option<String> = r
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
            .await
            .expect("xadd 2");
        let res2 = res2.expect("missing stream id");
        println!("{res2}"); // >>> 1692632094485-0

        let res3: Option<String> = r
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
            .await
            .expect("xadd 3");
        let res3 = res3.expect("missing stream id");
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
        add_france_fixed(&mut r).await;
        // HIDE_END
        // STEP_START xrange
        if let Ok(res) = r.xrange_count("race:france", "1692632086370-0", "+", 2).await {
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
        }
        // STEP_END

        // HIDE_START
        add_france_fixed(&mut r).await;
        // HIDE_END
        // STEP_START xread_block
        let opts = StreamReadOptions::default().count(100).block(300);
        if let Ok(res) = r.xread_options(&["race:france"], &["$"], &opts).await {
            let res: Option<StreamReadReply> = res;
            println!("{res:?}"); // >>> None
        }
        // STEP_END

        // STEP_START xadd_2
        if let Ok(res) = r
            .xadd(
                "race:france",
                "*",
                &[
                    ("rider", "Castilla"),
                    ("speed", "29.9"),
                    ("position", "1"),
                    ("location_id", "2"),
                ],
            )
            .await
        {
            let res: Option<String> = res;
            let res = res.expect("missing stream id");
            println!("{res}"); // >>> 1692632147973-0
        }
        // STEP_END

        // STEP_START xlen
        // HIDE_START
        add_france_fixed(&mut r).await;
        // HIDE_END
        if let Ok(res) = r.xlen("race:france").await {
            let res: usize = res;
            println!("{res}"); // >>> 4
        }
        // STEP_END

        // STEP_START xadd_id
        // HIDE_START
        delete_keys(&mut r, &["race:usa"]).await;
        // HIDE_END
        if let Ok(res) = r.xadd("race:usa", "0-1", &[("racer", "Castilla")]).await {
            let res: Option<String> = res;
            let res = res.expect("missing stream id");
            println!("{res}"); // >>> 0-1
        }
        if let Ok(res) = r.xadd("race:usa", "0-2", &[("racer", "Norem")]).await {
            let res: Option<String> = res;
            let res = res.expect("missing stream id");
            println!("{res}"); // >>> 0-2
        }
        // STEP_END

        // STEP_START xadd_bad_id
        let res: redis::RedisResult<Option<String>> =
            r.xadd("race:usa", "0-1", &[("racer", "Prickett")]).await;
        match res {
            Ok(_) => {}
            Err(e) => {
                let msg = e.to_string();
                println!("{msg}");
                // >>> An error was signalled by the server - ResponseError: The ID specified in XADD is equal or smaller than the target stream top item
            }
        }
        // STEP_END

        // STEP_START xadd_7
        // HIDE_START
        seed_usa_fixed(&mut r).await;
        // HIDE_END
        if let Ok(res) = r.xadd("race:usa", "0-*", &[("racer", "Prickett")]).await {
            let res: Option<String> = res;
            let res = res.expect("missing stream id");
            println!("{res}"); // >>> 0-3
        }
        // STEP_END

        // STEP_START xrange_all
        // HIDE_START
        add_france_fixed(&mut r).await;
        // HIDE_END
        if let Ok(res) = r.xrange_all("race:france").await {
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
        }
        // STEP_END

        // STEP_START xrange_time
        // HIDE_START
        add_france_fixed(&mut r).await;
        // HIDE_END
        if let Ok(res) = r.xrange("race:france", "1692632086369", "1692632086371").await {
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
        }
        // STEP_END

        // STEP_START xrange_step_1
        // HIDE_START
        add_france_fixed(&mut r).await;
        // HIDE_END
        if let Ok(res) = r.xrange_count("race:france", "-", "+", 2).await {
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
        }
        // STEP_END

        // STEP_START xrange_step_2
        // HIDE_START
        add_france_fixed(&mut r).await;
        // HIDE_END
        if let Ok(res) = r.xrange_count("race:france", "(1692632094485-0", "+", 2).await {
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
        }
        // STEP_END

        // STEP_START xrange_empty
        // HIDE_START
        add_france_fixed(&mut r).await;
        // HIDE_END
        if let Ok(res) = r.xrange_count("race:france", "(1692632147973-0", "+", 2).await {
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
        }
        // STEP_END

        // STEP_START xrevrange
        // HIDE_START
        add_france_fixed(&mut r).await;
        // HIDE_END
        if let Ok(res) = r.xrevrange_count("race:france", "+", "-", 1).await {
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
        }
        // STEP_END

        // STEP_START xread
        // HIDE_START
        add_france_fixed(&mut r).await;
        // HIDE_END
        let opts = StreamReadOptions::default().count(2);
        if let Ok(res) = r.xread_options(&["race:france"], &["0"], &opts).await {
            let res: Option<StreamReadReply> = res;
            let view: Vec<_> = res
                .expect("xread should return data")
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
        }
        // STEP_END

        // STEP_START xgroup_create
        // HIDE_START
        add_france_fixed(&mut r).await;
        // HIDE_END
        if let Ok(res) = r.xgroup_create("race:france", "france_riders", "$").await {
            let res: () = res;
            let _ = res;
            println!("OK"); // >>> OK
        }
        // STEP_END

        // STEP_START xgroup_create_mkstream
        // HIDE_START
        delete_keys(&mut r, &["race:italy"]).await;
        // HIDE_END
        if let Ok(res) = r.xgroup_create_mkstream("race:italy", "italy_riders", "$").await {
            let res: () = res;
            let _ = res;
            println!("OK"); // >>> OK
        }
        // STEP_END

        // HIDE_START
        delete_keys(&mut r, &["race:italy"]).await;
        let _: () = r
            .xgroup_create_mkstream("race:italy", "italy_riders", "$")
            .await
            .expect("create italy group");
        // HIDE_END
        // STEP_START xgroup_read
        let italy_1: Option<String> = r
            .xadd("race:italy", "1692632639151-0", &[("rider", "Castilla")])
            .await
            .expect("italy1");
        let italy_1 = italy_1.expect("missing stream id");
        println!("{italy_1}"); // >>> 1692632639151-0
        let italy_2: Option<String> = r
            .xadd("race:italy", "1692632647899-0", &[("rider", "Royce")])
            .await
            .expect("italy2");
        let italy_2 = italy_2.expect("missing stream id");
        println!("{italy_2}"); // >>> 1692632647899-0
        let italy_3: Option<String> = r
            .xadd("race:italy", "1692632662819-0", &[("rider", "Sam-Bodden")])
            .await
            .expect("italy3");
        let italy_3 = italy_3.expect("missing stream id");
        println!("{italy_3}"); // >>> 1692632662819-0
        let italy_4: Option<String> = r
            .xadd("race:italy", "1692632670501-0", &[("rider", "Prickett")])
            .await
            .expect("italy4");
        let italy_4 = italy_4.expect("missing stream id");
        println!("{italy_4}"); // >>> 1692632670501-0
        let italy_5: Option<String> = r
            .xadd("race:italy", "1692632678249-0", &[("rider", "Norem")])
            .await
            .expect("italy5");
        let italy_5 = italy_5.expect("missing stream id");
        println!("{italy_5}"); // >>> 1692632678249-0
        let opts = StreamReadOptions::default().group("italy_riders", "Alice").count(1);
        if let Ok(res) = r.xread_options(&["race:italy"], &[">"], &opts).await {
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
        }
        // STEP_END

        // HIDE_START
        seed_italy_alice_pending(&mut r).await;
        // HIDE_END
        // STEP_START xgroup_read_id
        let opts = StreamReadOptions::default().group("italy_riders", "Alice");
        if let Ok(res) = r.xread_options(&["race:italy"], &["0"], &opts).await {
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
        }
        // STEP_END

        // HIDE_START
        seed_italy_alice_pending(&mut r).await;
        // HIDE_END
        // STEP_START xack
        if let Ok(res) = r.xack("race:italy", "italy_riders", &["1692632639151-0"]).await {
            let res: usize = res;
            println!("{res}"); // >>> 1
        }
        let opts = StreamReadOptions::default().group("italy_riders", "Alice");
        if let Ok(res) = r.xread_options(&["race:italy"], &["0"], &opts).await {
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
        }
        // STEP_END

        // HIDE_START
        seed_italy_after_ack(&mut r).await;
        // HIDE_END
        // STEP_START xgroup_read_bob
        let opts = StreamReadOptions::default().group("italy_riders", "Bob").count(2);
        if let Ok(res) = r.xread_options(&["race:italy"], &[">"], &opts).await {
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
        }
        // STEP_END

        // HIDE_START
        seed_italy_bob_pending(&mut r).await;
        // HIDE_END
        // STEP_START xpending
        if let Ok(res) = r.xpending("race:italy", "italy_riders").await {
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
        }
        // STEP_END

        // HIDE_START
        seed_italy_bob_pending(&mut r).await;
        sleep(Duration::from_millis(5)).await;
        // HIDE_END
        // STEP_START xpending_plus_minus
        if let Ok(res) = r.xpending_count("race:italy", "italy_riders", "-", "+", 10).await {
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
        }
        // STEP_END

        // HIDE_START
        seed_italy_bob_pending(&mut r).await;
        // HIDE_END
        // STEP_START xrange_pending
        if let Ok(res) = r.xrange("race:italy", "1692632647899-0", "1692632647899-0").await {
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
        }
        // STEP_END

        // HIDE_START
        seed_italy_bob_pending(&mut r).await;
        sleep(Duration::from_millis(5)).await;
        // HIDE_END
        // STEP_START xclaim
        if let Ok(res) = r
            .xclaim("race:italy", "italy_riders", "Alice", 1, &["1692632647899-0"])
            .await
        {
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
        }
        // STEP_END

        // HIDE_START
        seed_italy_bob_pending(&mut r).await;
        sleep(Duration::from_millis(5)).await;
        // HIDE_END
        // STEP_START xautoclaim
        let opts = StreamAutoClaimOptions::default().count(1);
        if let Ok(res) = r
            .xautoclaim_options("race:italy", "italy_riders", "Alice", 1, "0-0", opts)
            .await
        {
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
        }
        // STEP_END

        // HIDE_START
        seed_italy_bob_pending(&mut r).await;
        sleep(Duration::from_millis(5)).await;
        let first_opts = StreamAutoClaimOptions::default().count(1);
        let _: redis::streams::StreamAutoClaimReply = r
            .xautoclaim_options("race:italy", "italy_riders", "Alice", 1, "0-0", first_opts)
            .await
            .expect("first autoclaim");
        // HIDE_END
        // STEP_START xautoclaim_cursor
        let next_opts = StreamAutoClaimOptions::default().count(1);
        if let Ok(res) = r
            .xautoclaim_options(
                "race:italy",
                "italy_riders",
                "Lora",
                1,
                "(1692632647899-0",
                next_opts,
            )
            .await
        {
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
        }
        // STEP_END

        // HIDE_START
        seed_italy_info_state(&mut r).await;
        // HIDE_END
        // STEP_START xinfo
        if let Ok(res) = r.xinfo_stream("race:italy").await {
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
        }
        // STEP_END

        // HIDE_START
        seed_italy_info_state(&mut r).await;
        // HIDE_END
        // STEP_START xinfo_groups
        if let Ok(res) = r.xinfo_groups("race:italy").await {
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
        }
        // STEP_END

        // HIDE_START
        seed_italy_info_state(&mut r).await;
        // HIDE_END
        // STEP_START xinfo_consumers
        if let Ok(res) = r.xinfo_consumers("race:italy", "italy_riders").await {
            let res: StreamInfoConsumersReply = res;
            let mut view: Vec<_> = res
                .consumers
                .iter()
                .map(|consumer| (consumer.name.clone(), consumer.pending, consumer.idle))
                .collect();
            view.sort_by(|a, b| a.0.cmp(&b.0));
            println!("{view:?}");
            // >>> [("Alice", 1, 5), ("Bob", 0, 5), ("Lora", 1, 5)]
        }
        // STEP_END

        // STEP_START maxlen
        // HIDE_START
        delete_keys(&mut r, &["race:italy"]).await;
        // HIDE_END
        let max1: Option<String> = r
            .xadd_maxlen("race:italy", StreamMaxlen::Equals(2), "1-0", &[("rider", "Jones")])
            .await
            .expect("maxlen add 1");
        let max1 = max1.expect("missing stream id");
        println!("{max1}"); // >>> 1-0
        let max2: Option<String> = r
            .xadd_maxlen("race:italy", StreamMaxlen::Equals(2), "2-0", &[("rider", "Wood")])
            .await
            .expect("maxlen add 2");
        let max2 = max2.expect("missing stream id");
        println!("{max2}"); // >>> 2-0
        let max3: Option<String> = r
            .xadd_maxlen("race:italy", StreamMaxlen::Equals(2), "3-0", &[("rider", "Henshaw")])
            .await
            .expect("maxlen add 3");
        let max3 = max3.expect("missing stream id");
        println!("{max3}"); // >>> 3-0
        if let Ok(res) = r.xlen("race:italy").await {
            let res: usize = res;
            println!("{res}"); // >>> 2
        }
        if let Ok(res) = r.xrange_all("race:italy").await {
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
        }
        // STEP_END

        // STEP_START xtrim
        // HIDE_START
        delete_keys(&mut r, &["race:italy"]).await;
        let _: Option<String> = r.xadd("race:italy", "1-0", &[("rider", "Wood")]).await.expect("trim seed 1");
        let _: Option<String> = r.xadd("race:italy", "2-0", &[("rider", "Henshaw")]).await.expect("trim seed 2");
        // HIDE_END
        if let Ok(res) = r.xtrim("race:italy", StreamMaxlen::Equals(10)).await {
            let res: usize = res;
            println!("{res}"); // >>> 0
        }
        // STEP_END

        // STEP_START xtrim2
        // HIDE_START
        seed_trim_stream(&mut r).await;
        // HIDE_END
        if let Ok(res) = r
            .xtrim_options(
                "mystream",
                &StreamTrimOptions::maxlen(StreamTrimmingMode::Approx, 10),
            )
            .await
        {
            let res: usize = res;
            println!("{res}"); // >>> 0
        }
        // STEP_END

        // STEP_START xdel
        // HIDE_START
        delete_keys(&mut r, &["race:italy"]).await;
        let _: Option<String> = r.xadd("race:italy", "2-0", &[("rider", "Wood")]).await.expect("xdel seed 1");
        let _: Option<String> = r.xadd("race:italy", "3-0", &[("rider", "Henshaw")]).await.expect("xdel seed 2");
        // HIDE_END
        if let Ok(res) = r.xrange_count("race:italy", "-", "+", 2).await {
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
        }
        if let Ok(res) = r.xdel("race:italy", &["3-0"]).await {
            let res: usize = res;
            println!("{res}"); // >>> 1
        }
        if let Ok(res) = r.xrange_count("race:italy", "-", "+", 2).await {
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
        }
        // STEP_END
    }
}
