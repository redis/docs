// EXAMPLE: home_vecsets
#[cfg(all(test, feature = "vector-sets"))]
mod tests {
    // STEP_START import
    use fastembed::{EmbeddingModel, InitOptions, TextEmbedding};
    use redis::vector_sets::{
        EmbeddingInput, VAddOptions, VSimOptions, VectorAddInput, VectorSimilaritySearchInput,
    };
    use redis::{AsyncCommands, Value};
    // STEP_END

    // STEP_START model
    // `fastembed` runs the ONNX-exported `all-MiniLM-L6-v2` encoder locally.
    // `TextEmbedding::embed` returns mean-pooled, L2-normalized 384-element
    // `Vec<f32>` embeddings, matching the pooling and normalization the
    // other clients' bindings apply.
    fn build_model() -> TextEmbedding {
        TextEmbedding::try_new(InitOptions::new(EmbeddingModel::AllMiniLML6V2))
            .expect("Failed to initialize embedding model")
    }
    // STEP_END

    // STEP_START data
    struct PersonData {
        born: i32,
        died: i32,
        description: &'static str,
    }

    fn people_data() -> Vec<(&'static str, PersonData)> {
        vec![
            (
                "Marie Curie",
                PersonData {
                    born: 1867,
                    died: 1934,
                    description: "Polish-French chemist and physicist. The only person \
                    ever to win two Nobel prizes for two different sciences.",
                },
            ),
            (
                "Linus Pauling",
                PersonData {
                    born: 1901,
                    died: 1994,
                    description: "American chemist and peace activist. One of only two \
                    people to win two Nobel prizes in different fields (chemistry \
                    and peace).",
                },
            ),
            (
                "Freddie Mercury",
                PersonData {
                    born: 1946,
                    died: 1991,
                    description: "British musician, best known as the lead singer of \
                    the rock band Queen.",
                },
            ),
            (
                "Marie Fredriksson",
                PersonData {
                    born: 1958,
                    died: 2019,
                    description: "Swedish multi-instrumentalist, mainly known as the \
                    lead singer and keyboardist of the band Roxette.",
                },
            ),
            (
                "Paul Erdos",
                PersonData {
                    born: 1913,
                    died: 1996,
                    description: "Hungarian mathematician, known for his eccentric \
                    personality almost as much as his contributions to many \
                    different fields of mathematics.",
                },
            ),
            (
                "Maryam Mirzakhani",
                PersonData {
                    born: 1977,
                    died: 2017,
                    description: "Iranian mathematician. The first woman ever to win \
                    the Fields medal for her contributions to mathematics.",
                },
            ),
            (
                "Masako Natsume",
                PersonData {
                    born: 1957,
                    died: 1985,
                    description: "Japanese actress. She was very famous in Japan but \
                    was primarily known elsewhere in the world for her portrayal \
                    of Tripitaka in the TV series Monkey.",
                },
            ),
            (
                "Chaim Topol",
                PersonData {
                    born: 1935,
                    died: 2023,
                    description: "Israeli actor and singer, usually credited simply \
                    as 'Topol'. He was best known for his many appearances as \
                    Tevye in the musical Fiddler on the Roof.",
                },
            ),
        ]
    }
    // STEP_END

    fn parse_names(value: Value) -> Vec<String> {
        match value {
            Value::Array(items) => items
                .into_iter()
                .map(|item| match item {
                    Value::BulkString(bytes) => String::from_utf8(bytes).expect("utf8"),
                    Value::SimpleString(s) => s,
                    other => panic!("Unexpected VSIM item: {other:?}"),
                })
                .collect(),
            other => panic!("Unexpected VSIM response: {other:?}"),
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

        let model = build_model();

        // STEP_START add_data
        for (name, details) in people_data() {
            let embeddings = model
                .embed(vec![details.description], None)
                .expect("Failed to embed");

            let opts = VAddOptions::default().set_attributes(serde_json::json!({
                "born": details.born,
                "died": details.died,
            }));

            let _: bool = r
                .vadd_options(
                    "famousPeople",
                    VectorAddInput::Values(EmbeddingInput::Float32(&embeddings[0])),
                    name,
                    &opts,
                )
                .await
                .expect("Failed to run VADD");
        }
        // STEP_END

        // STEP_START basic_query
        let query_embedding = model.embed(vec!["actors"], None).expect("Failed to embed");

        let res: Value = r
            .vsim(
                "famousPeople",
                VectorSimilaritySearchInput::Values(EmbeddingInput::Float32(&query_embedding[0])),
            )
            .await
            .expect("Failed to run VSIM");

        let actors_results = parse_names(res);
        println!("'actors': {actors_results:?}");
        // >>> 'actors': ["Masako Natsume", "Chaim Topol", "Linus Pauling",
        // "Marie Fredriksson", "Maryam Mirzakhani", "Marie Curie",
        // "Freddie Mercury", "Paul Erdos"]
        // REMOVE_START
        assert_eq!(
            actors_results,
            vec![
                "Masako Natsume",
                "Chaim Topol",
                "Linus Pauling",
                "Marie Fredriksson",
                "Maryam Mirzakhani",
                "Marie Curie",
                "Freddie Mercury",
                "Paul Erdos",
            ]
        );
        // REMOVE_END
        // STEP_END

        // STEP_START limited_query
        let query_embedding = model.embed(vec!["actors"], None).expect("Failed to embed");

        let opts = VSimOptions::default().set_count(2);
        let res: Value = r
            .vsim_options(
                "famousPeople",
                VectorSimilaritySearchInput::Values(EmbeddingInput::Float32(&query_embedding[0])),
                &opts,
            )
            .await
            .expect("Failed to run VSIM");

        let two_actors_results = parse_names(res);
        println!("'actors (2)': {two_actors_results:?}");
        // >>> 'actors (2)': ["Masako Natsume", "Chaim Topol"]
        // REMOVE_START
        assert_eq!(two_actors_results, vec!["Masako Natsume", "Chaim Topol"]);
        // REMOVE_END
        // STEP_END

        // STEP_START entertainer_query
        let query_embedding = model
            .embed(vec!["entertainer"], None)
            .expect("Failed to embed");

        let res: Value = r
            .vsim(
                "famousPeople",
                VectorSimilaritySearchInput::Values(EmbeddingInput::Float32(&query_embedding[0])),
            )
            .await
            .expect("Failed to run VSIM");

        let entertainer_results = parse_names(res);
        println!("'entertainer': {entertainer_results:?}");
        // >>> 'entertainer': ["Chaim Topol", "Freddie Mercury",
        // "Marie Fredriksson", "Linus Pauling", "Masako Natsume",
        // "Paul Erdos", "Maryam Mirzakhani", "Marie Curie"]
        // REMOVE_START
        assert_eq!(
            entertainer_results,
            vec![
                "Chaim Topol",
                "Freddie Mercury",
                "Marie Fredriksson",
                "Linus Pauling",
                "Masako Natsume",
                "Paul Erdos",
                "Maryam Mirzakhani",
                "Marie Curie",
            ]
        );
        // REMOVE_END
        // STEP_END

        let query_embedding = model.embed(vec!["science"], None).expect("Failed to embed");

        let res: Value = r
            .vsim(
                "famousPeople",
                VectorSimilaritySearchInput::Values(EmbeddingInput::Float32(&query_embedding[0])),
            )
            .await
            .expect("Failed to run VSIM");

        let science_results = parse_names(res);
        println!("'science': {science_results:?}");
        // >>> 'science': ["Marie Curie", "Linus Pauling",
        // "Maryam Mirzakhani", "Paul Erdos", "Marie Fredriksson",
        // "Freddie Mercury", "Masako Natsume", "Chaim Topol"]
        // REMOVE_START
        assert_eq!(
            science_results,
            vec![
                "Marie Curie",
                "Linus Pauling",
                "Maryam Mirzakhani",
                "Paul Erdos",
                "Marie Fredriksson",
                "Freddie Mercury",
                "Masako Natsume",
                "Chaim Topol",
            ]
        );
        // REMOVE_END

        // STEP_START filtered_query
        let query_embedding = model.embed(vec!["science"], None).expect("Failed to embed");

        let opts = VSimOptions::default().set_filter_expression(".died < 2000");
        let res: Value = r
            .vsim_options(
                "famousPeople",
                VectorSimilaritySearchInput::Values(EmbeddingInput::Float32(&query_embedding[0])),
                &opts,
            )
            .await
            .expect("Failed to run VSIM");

        let science2000_results = parse_names(res);
        println!("'science2000': {science2000_results:?}");
        // >>> 'science2000': ["Marie Curie", "Linus Pauling",
        // "Paul Erdos", "Freddie Mercury", "Masako Natsume"]
        // REMOVE_START
        assert_eq!(
            science2000_results,
            vec![
                "Marie Curie",
                "Linus Pauling",
                "Paul Erdos",
                "Freddie Mercury",
                "Masako Natsume",
            ]
        );
        // REMOVE_END
        // STEP_END
    }
}
