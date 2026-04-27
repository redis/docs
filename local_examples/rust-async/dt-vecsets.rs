// EXAMPLE: vecset_tutorial
#[cfg(all(test, feature = "vector-sets"))]
mod tests {
    use redis::{
        cmd, AsyncCommands, EmbeddingInput, VAddOptions, VSimOptions, Value, VectorAddInput,
        VectorQuantization, VectorSimilaritySearchInput,
    };

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

        // STEP_START vadd
        if let Ok(res) = r
            .vadd(
                "points",
                VectorAddInput::Values(EmbeddingInput::Float64(&[1.0, 1.0])),
                "pt:A",
            )
            .await
        {
            let res: bool = res;
            println!("{res}"); // >>> true
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r
            .vadd(
                "points",
                VectorAddInput::Values(EmbeddingInput::Float64(&[-1.0, -1.0])),
                "pt:B",
            )
            .await
        {
            let res: bool = res;
            println!("{res}"); // >>> true
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r
            .vadd(
                "points",
                VectorAddInput::Values(EmbeddingInput::Float64(&[-1.0, 1.0])),
                "pt:C",
            )
            .await
        {
            let res: bool = res;
            println!("{res}"); // >>> true
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r
            .vadd(
                "points",
                VectorAddInput::Values(EmbeddingInput::Float64(&[1.0, -1.0])),
                "pt:D",
            )
            .await
        {
            let res: bool = res;
            println!("{res}"); // >>> true
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r
            .vadd(
                "points",
                VectorAddInput::Values(EmbeddingInput::Float64(&[1.0, 0.0])),
                "pt:E",
            )
            .await
        {
            let res: bool = res;
            println!("{res}"); // >>> true
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        let res: String = cmd("TYPE")
            .arg("points")
            .query_async(&mut r)
            .await
            .expect("TYPE points should succeed");
        println!("{res}"); // >>> vectorset
        // REMOVE_START
        assert_eq!(res, "vectorset");
        // REMOVE_END
        // STEP_END

        // STEP_START vcardvdim
        if let Ok(res) = r.vcard("points").await {
            let res: usize = res;
            println!("{res}"); // >>> 5
            // REMOVE_START
            assert_eq!(res, 5);
            // REMOVE_END
        }

        if let Ok(res) = r.vdim("points").await {
            let res: usize = res;
            println!("{res}"); // >>> 2
            // REMOVE_START
            assert_eq!(res, 2);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START vemb
        if let Ok(res) = r.vemb("points", "pt:A").await {
            let res: Vec<f64> = res;
            println!("{res:?}");
            // >>> [0.9999999403953552, 0.9999999403953552]
            // REMOVE_START
            assert!((res[0] - 1.0).abs() < 0.001);
            assert!((res[1] - 1.0).abs() < 0.001);
            // REMOVE_END
        }

        if let Ok(res) = r.vemb("points", "pt:B").await {
            let res: Vec<f64> = res;
            println!("{res:?}");
            // >>> [-0.9999999403953552, -0.9999999403953552]
            // REMOVE_START
            assert!((res[0] + 1.0).abs() < 0.001);
            assert!((res[1] + 1.0).abs() < 0.001);
            // REMOVE_END
        }

        if let Ok(res) = r.vemb("points", "pt:C").await {
            let res: Vec<f64> = res;
            println!("{res:?}");
            // >>> [-0.9999999403953552, 0.9999999403953552]
            // REMOVE_START
            assert!((res[0] + 1.0).abs() < 0.001);
            assert!((res[1] - 1.0).abs() < 0.001);
            // REMOVE_END
        }

        if let Ok(res) = r.vemb("points", "pt:D").await {
            let res: Vec<f64> = res;
            println!("{res:?}");
            // >>> [0.9999999403953552, -0.9999999403953552]
            // REMOVE_START
            assert!((res[0] - 1.0).abs() < 0.001);
            assert!((res[1] + 1.0).abs() < 0.001);
            // REMOVE_END
        }

        if let Ok(res) = r.vemb("points", "pt:E").await {
            let res: Vec<f64> = res;
            println!("{res:?}"); // >>> [1.0, 0.0]
            // REMOVE_START
            assert!((res[0] - 1.0).abs() < 0.001);
            assert!(res[1].abs() < 0.001);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START attr
        let res: bool = cmd("VSETATTR")
            .arg("points")
            .arg("pt:A")
            .arg("{\"name\":\"Point A\",\"description\":\"First point added\"}")
            .query_async(&mut r)
            .await
            .expect("VSETATTR should succeed");
        println!("{res}"); // >>> true
        // REMOVE_START
        assert!(res);
        // REMOVE_END

        if let Ok(res) = r.vgetattr("points", "pt:A").await {
            let res: Option<String> = res;
            println!(
                "{}",
                res.clone().unwrap_or_else(|| "None".to_string())
            );
            // >>> {"name":"Point A","description":"First point added"}
            // REMOVE_START
            assert_eq!(
                res,
                Some("{\"name\":\"Point A\",\"description\":\"First point added\"}".to_string())
            );
            // REMOVE_END
        }

        let res: bool = cmd("VSETATTR")
            .arg("points")
            .arg("pt:A")
            .arg("")
            .query_async(&mut r)
            .await
            .expect("VSETATTR clear should succeed");
        println!("{res}"); // >>> true
        // REMOVE_START
        assert!(res);
        // REMOVE_END

        if let Ok(res) = r.vgetattr("points", "pt:A").await {
            let res: Option<String> = res;
            println!(
                "{}",
                res.clone().unwrap_or_else(|| "None".to_string())
            ); // >>> None
            // REMOVE_START
            assert_eq!(res, None);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START vrem
        if let Ok(res) = r
            .vadd(
                "points",
                VectorAddInput::Values(EmbeddingInput::String(&["0", "0"])),
                "pt:F",
            )
            .await
        {
            let res: bool = res;
            println!("{res}"); // >>> true
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r.vcard("points").await {
            let res: usize = res;
            println!("{res}"); // >>> 6
            // REMOVE_START
            assert_eq!(res, 6);
            // REMOVE_END
        }

        if let Ok(res) = r.vrem("points", "pt:F").await {
            let res: bool = res;
            println!("{res}"); // >>> true
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r.vcard("points").await {
            let res: usize = res;
            println!("{res}"); // >>> 5
            // REMOVE_START
            assert_eq!(res, 5);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START vsim_basic
        if let Ok(res) = r
            .vsim(
                "points",
                VectorSimilaritySearchInput::Values(EmbeddingInput::Float64(&[0.9, 0.1])),
            )
            .await
        {
            let res: Value = res;
            if let Value::Array(items) = res {
                let view: Vec<String> = items
                    .into_iter()
                    .map(|item| match item {
                        Value::BulkString(bytes) => String::from_utf8(bytes).expect("utf8"),
                        Value::SimpleString(s) => s,
                        other => panic!("Unexpected VSIM item: {other:?}"),
                    })
                    .collect();
                println!("{view:?}");
                // >>> ["pt:E", "pt:A", "pt:D", "pt:C", "pt:B"]
                // REMOVE_START
                assert_eq!(
                    view,
                    vec![
                        "pt:E".to_string(),
                        "pt:A".to_string(),
                        "pt:D".to_string(),
                        "pt:C".to_string(),
                        "pt:B".to_string()
                    ]
                );
                // REMOVE_END
            }
        }
        // STEP_END

        // STEP_START vsim_options
        let opts = VSimOptions::default().set_with_scores(true).set_count(4);
        if let Ok(res) = r
            .vsim_options("points", VectorSimilaritySearchInput::Element("pt:A"), &opts)
            .await
        {
            let res: Value = res;
            let mut view: Vec<(String, f64)> = match res {
                Value::Array(items) => items
                    .chunks(2)
                    .map(|chunk| {
                        let member = match &chunk[0] {
                            Value::BulkString(bytes) => {
                                String::from_utf8(bytes.clone()).expect("utf8")
                            }
                            Value::SimpleString(s) => s.clone(),
                            other => panic!("Unexpected member format: {other:?}"),
                        };
                        let score = match &chunk[1] {
                            Value::BulkString(bytes) => String::from_utf8(bytes.clone())
                                .expect("utf8")
                                .parse::<f64>()
                                .expect("score"),
                            Value::SimpleString(s) => s.parse::<f64>().expect("score"),
                            Value::Double(v) => *v,
                            Value::Int(v) => *v as f64,
                            other => panic!("Unexpected score format: {other:?}"),
                        };
                        (member, score)
                    })
                    .collect(),
                Value::Map(items) => items
                    .into_iter()
                    .map(|(member, score)| {
                        let member = match member {
                            Value::BulkString(bytes) => String::from_utf8(bytes).expect("utf8"),
                            Value::SimpleString(s) => s,
                            other => panic!("Unexpected member format: {other:?}"),
                        };
                        let score = match score {
                            Value::BulkString(bytes) => String::from_utf8(bytes)
                                .expect("utf8")
                                .parse::<f64>()
                                .expect("score"),
                            Value::SimpleString(s) => s.parse::<f64>().expect("score"),
                            Value::Double(v) => v,
                            Value::Int(v) => v as f64,
                            other => panic!("Unexpected score format: {other:?}"),
                        };
                        (member, score)
                    })
                    .collect(),
                other => panic!("Unexpected VSIM WITHSCORES response: {other:?}"),
            };
            view.sort_by(|a, b| {
                b.1.partial_cmp(&a.1)
                    .unwrap_or(std::cmp::Ordering::Equal)
                    .then_with(|| b.0.cmp(&a.0))
            });
            println!("{view:?}");
            // >>> [("pt:A", 1.0), ("pt:E", 0.8535534143447876), ("pt:D", 0.5), ("pt:C", 0.5)]
            // REMOVE_START
            assert_eq!(view.len(), 4);
            assert_eq!(view[0].0, "pt:A");
            assert!((view[0].1 - 1.0).abs() < 0.001);
            assert_eq!(view[1].0, "pt:E");
            assert!(view[1].1 > 0.85 && view[1].1 < 0.86);
            assert_eq!(view[2], ("pt:D".to_string(), 0.5));
            assert_eq!(view[3], ("pt:C".to_string(), 0.5));
            // REMOVE_END
        }
        // STEP_END

        // STEP_START vsim_filter
        let res: bool = cmd("VSETATTR")
            .arg("points")
            .arg("pt:A")
            .arg("{\"size\":\"large\",\"price\":18.99}")
            .query_async(&mut r)
            .await
            .expect("VSETATTR A should succeed");
        println!("{res}"); // >>> true
        // REMOVE_START
        assert!(res);
        // REMOVE_END

        let res: bool = cmd("VSETATTR")
            .arg("points")
            .arg("pt:B")
            .arg("{\"size\":\"large\",\"price\":35.99}")
            .query_async(&mut r)
            .await
            .expect("VSETATTR B should succeed");
        println!("{res}"); // >>> true
        // REMOVE_START
        assert!(res);
        // REMOVE_END

        let res: bool = cmd("VSETATTR")
            .arg("points")
            .arg("pt:C")
            .arg("{\"size\":\"large\",\"price\":25.99}")
            .query_async(&mut r)
            .await
            .expect("VSETATTR C should succeed");
        println!("{res}"); // >>> true
        // REMOVE_START
        assert!(res);
        // REMOVE_END

        let res: bool = cmd("VSETATTR")
            .arg("points")
            .arg("pt:D")
            .arg("{\"size\":\"small\",\"price\":21.00}")
            .query_async(&mut r)
            .await
            .expect("VSETATTR D should succeed");
        println!("{res}"); // >>> true
        // REMOVE_START
        assert!(res);
        // REMOVE_END

        let res: bool = cmd("VSETATTR")
            .arg("points")
            .arg("pt:E")
            .arg("{\"size\":\"small\",\"price\":17.75}")
            .query_async(&mut r)
            .await
            .expect("VSETATTR E should succeed");
        println!("{res}"); // >>> true
        // REMOVE_START
        assert!(res);
        // REMOVE_END

        let opts = VSimOptions::default().set_filter_expression(".size == \"large\"");
        if let Ok(res) = r
            .vsim_options("points", VectorSimilaritySearchInput::Element("pt:A"), &opts)
            .await
        {
            let res: Value = res;
            if let Value::Array(items) = res {
                let view: Vec<String> = items
                    .into_iter()
                    .map(|item| match item {
                        Value::BulkString(bytes) => String::from_utf8(bytes).expect("utf8"),
                        Value::SimpleString(s) => s,
                        other => panic!("Unexpected VSIM item: {other:?}"),
                    })
                    .collect();
                println!("{view:?}");
                // >>> ["pt:A", "pt:C", "pt:B"]
                // REMOVE_START
                assert_eq!(
                    view,
                    vec!["pt:A".to_string(), "pt:C".to_string(), "pt:B".to_string()]
                );
                // REMOVE_END
            }
        }

        let opts = VSimOptions::default()
            .set_filter_expression(".size == \"large\" && .price > 20.00");
        if let Ok(res) = r
            .vsim_options("points", VectorSimilaritySearchInput::Element("pt:A"), &opts)
            .await
        {
            let res: Value = res;
            if let Value::Array(items) = res {
                let view: Vec<String> = items
                    .into_iter()
                    .map(|item| match item {
                        Value::BulkString(bytes) => String::from_utf8(bytes).expect("utf8"),
                        Value::SimpleString(s) => s,
                        other => panic!("Unexpected VSIM item: {other:?}"),
                    })
                    .collect();
                println!("{view:?}");
                // >>> ["pt:C", "pt:B"]
                // REMOVE_START
                assert_eq!(view, vec!["pt:C".to_string(), "pt:B".to_string()]);
                // REMOVE_END
            }
        }
        // STEP_END

        // STEP_START add_quant
        let opts = VAddOptions::default().set_quantization(VectorQuantization::Q8);
        if let Ok(res) = r
            .vadd_options(
                "quantSetQ8",
                VectorAddInput::Values(EmbeddingInput::Float64(&[1.262185, 1.958231])),
                "quantElement",
                &opts,
            )
            .await
        {
            let res: bool = res;
            println!("{res}"); // >>> true
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r.vemb("quantSetQ8", "quantElement").await {
            let res: Vec<f64> = res;
            println!("{res:?}");
            // >>> [1.2643694877624512, 1.958230972290039]
            // REMOVE_START
            assert!((res[0] - 1.2643694877624512).abs() < 0.001);
            assert!((res[1] - 1.958230972290039).abs() < 0.001);
            // REMOVE_END
        }

        let opts = VAddOptions::default().set_quantization(VectorQuantization::NoQuant);
        if let Ok(res) = r
            .vadd_options(
                "quantSetNoQ",
                VectorAddInput::Values(EmbeddingInput::Float64(&[1.262185, 1.958231])),
                "quantElement",
                &opts,
            )
            .await
        {
            let res: bool = res;
            println!("{res}"); // >>> true
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r.vemb("quantSetNoQ", "quantElement").await {
            let res: Vec<f64> = res;
            println!("{res:?}");
            // >>> [1.262184977531433, 1.958230972290039]
            // REMOVE_START
            assert!((res[0] - 1.262184977531433).abs() < 0.001);
            assert!((res[1] - 1.958230972290039).abs() < 0.001);
            // REMOVE_END
        }

        let opts = VAddOptions::default().set_quantization(VectorQuantization::Bin);
        if let Ok(res) = r
            .vadd_options(
                "quantSetBin",
                VectorAddInput::Values(EmbeddingInput::Float64(&[1.262185, 1.958231])),
                "quantElement",
                &opts,
            )
            .await
        {
            let res: bool = res;
            println!("{res}"); // >>> true
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r.vemb("quantSetBin", "quantElement").await {
            let res: Vec<f64> = res;
            println!("{res:?}"); // >>> [1.0, 1.0]
            // REMOVE_START
            assert_eq!(res, vec![1.0, 1.0]);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START add_reduce
        let values: Vec<f64> = (0..300).map(|i| i as f64 / 299.0).collect();

        if let Ok(res) = r
            .vadd(
                "setNotReduced",
                VectorAddInput::Values(EmbeddingInput::Float64(&values)),
                "element",
            )
            .await
        {
            let res: bool = res;
            println!("{res}"); // >>> true
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r.vdim("setNotReduced").await {
            let res: usize = res;
            println!("{res}"); // >>> 300
            // REMOVE_START
            assert_eq!(res, 300);
            // REMOVE_END
        }

        let opts = VAddOptions::default().set_reduction_dimension(100);
        if let Ok(res) = r
            .vadd_options(
                "setReduced",
                VectorAddInput::Values(EmbeddingInput::Float64(&values)),
                "element",
                &opts,
            )
            .await
        {
            let res: bool = res;
            println!("{res}"); // >>> true
            // REMOVE_START
            assert!(res);
            // REMOVE_END
        }

        if let Ok(res) = r.vdim("setReduced").await {
            let res: usize = res;
            println!("{res}"); // >>> 100
            // REMOVE_START
            assert_eq!(res, 100);
            // REMOVE_END
        }
        // STEP_END
    }
}
