// EXAMPLE: home_vecsets
// STEP_START import
package main

import (
	"context"
	"fmt"
	"strings"

	"github.com/knights-analytics/hugot"
	"github.com/redis/go-redis/v9"
)

// STEP_END

// STEP_START data
type PersonData struct {
	Born        int
	Died        int
	Description string
}

var peopleData = map[string]PersonData{
	"Marie Curie": {
		Born: 1867, Died: 1934,
		Description: `Polish-French chemist and physicist. The only person ever to win
		two Nobel prizes for two different sciences.
		`,
	},
	"Linus Pauling": {
		Born: 1901, Died: 1994,
		Description: `American chemist and peace activist. One of only two people to win two
		Nobel prizes in different fields (chemistry and peace).
		`,
	},
	"Freddie Mercury": {
		Born: 1946, Died: 1991,
		Description: `British musician, best known as the lead singer of the rock band
		Queen.
		`,
	},
	"Marie Fredriksson": {
		Born: 1958, Died: 2019,
		Description: `Swedish multi-instrumentalist, mainly known as the lead singer and
		keyboardist of the band Roxette.
		`,
	},
	"Paul Erdos": {
		Born: 1913, Died: 1996,
		Description: `Hungarian mathematician, known for his eccentric personality almost
		as much as his contributions to many different fields of mathematics.
		`,
	},
	"Maryam Mirzakhani": {
		Born: 1977, Died: 2017,
		Description: `Iranian mathematician. The first woman ever to win the Fields medal
		for her contributions to mathematics.
		`,
	},
	"Masako Natsume": {
		Born: 1957, Died: 1985,
		Description: `Japanese actress. She was very famous in Japan but was primarily
		known elsewhere in the world for her portrayal of Tripitaka in the
		TV series Monkey.
		`,
	},
	"Chaim Topol": {
		Born: 1935, Died: 2023,
		Description: `Israeli actor and singer, usually credited simply as 'Topol'. He was
		best known for his many appearances as Tevye in the musical Fiddler
		on the Roof.
		`,
	},
}

// STEP_END

func main() {
	ctx := context.Background()

	// STEP_START model
	// Create a new Hugot session
	session, err := hugot.NewGoSession()
	if err != nil {
		panic(err)
	}
	defer func() {
		err := session.Destroy()
		if err != nil {
			panic(err)
		}
	}()

	// Download the model.
	downloadOptions := hugot.NewDownloadOptions()
	downloadOptions.OnnxFilePath = "onnx/model.onnx"
	modelPath, err := hugot.DownloadModel(
		"sentence-transformers/all-MiniLM-L6-v2",
		"./models/",
		downloadOptions,
	)
	if err != nil {
		panic(err)
	}

	// Create feature extraction pipeline configuration
	config := hugot.FeatureExtractionConfig{
		ModelPath: modelPath,
		Name:      "embeddingPipeline",
	}

	// Create the feature extraction pipeline
	embeddingPipeline, err := hugot.NewPipeline(session, config)
	if err != nil {
		panic(err)
	}
	// STEP_END

	// STEP_START connect
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password
		DB:       0,  // use default DB
	})
	// STEP_END

	// STEP_START add_data
	for name, details := range peopleData {
		// Generate embeddings using Hugot
		result, err := embeddingPipeline.RunPipeline([]string{details.Description})
		if err != nil {
			panic(err)
		}

		// Convert embedding to float64 slice
		embFloat32 := result.Embeddings[0]
		embFloat64 := make([]float64, len(embFloat32))
		for i, v := range embFloat32 {
			embFloat64[i] = float64(v)
		}

		// Add vector to vector set
		_, err = rdb.VAdd(ctx, "famousPeople", name, &redis.VectorValues{Val: embFloat64}).Result()
		if err != nil {
			panic(err)
		}

		// Set attributes for the element
		_, err = rdb.VSetAttr(ctx, "famousPeople", name, map[string]interface{}{
			"born": details.Born,
			"died": details.Died,
		}).Result()
		if err != nil {
			panic(err)
		}
	}
	// STEP_END

	// STEP_START basic_query
	queryValue := "actors"

	queryResult, err := embeddingPipeline.RunPipeline([]string{queryValue})
	if err != nil {
		panic(err)
	}

	// Convert embedding to float64 slice
	queryFloat32 := queryResult.Embeddings[0]
	queryFloat64 := make([]float64, len(queryFloat32))
	for i, v := range queryFloat32 {
		queryFloat64[i] = float64(v)
	}

	actorsResults, err := rdb.VSim(ctx, "famousPeople", &redis.VectorValues{Val: queryFloat64}).Result()
	if err != nil {
		panic(err)
	}

	fmt.Printf("'actors': %v\n", strings.Join(actorsResults, ", "))
	// >>> 'actors': Masako Natsume, Chaim Topol, Linus Pauling,
	// Marie Fredriksson, Maryam Mirzakhani, Marie Curie, Freddie Mercury,
	// Paul Erdos
	// STEP_END

	// STEP_START limited_query
	queryValue = "actors"

	queryResult, err = embeddingPipeline.RunPipeline([]string{queryValue})
	if err != nil {
		panic(err)
	}

	// Convert embedding to float64 slice
	queryFloat32 = queryResult.Embeddings[0]
	queryFloat64 = make([]float64, len(queryFloat32))
	for i, v := range queryFloat32 {
		queryFloat64[i] = float64(v)
	}

	twoActorsResults, err := rdb.VSimWithArgs(ctx, "famousPeople",
		&redis.VectorValues{Val: queryFloat64},
		&redis.VSimArgs{Count: 2}).Result()
	if err != nil {
		panic(err)
	}

	fmt.Printf("'actors (2)': %v\n", strings.Join(twoActorsResults, ", "))
	// >>> 'actors (2)': Masako Natsume, Chaim Topol
	// STEP_END

	// STEP_START entertainer_query
	queryValue = "entertainer"

	queryResult, err = embeddingPipeline.RunPipeline([]string{queryValue})
	if err != nil {
		panic(err)
	}

	// Convert embedding to float64 slice
	queryFloat32 = queryResult.Embeddings[0]
	queryFloat64 = make([]float64, len(queryFloat32))
	for i, v := range queryFloat32 {
		queryFloat64[i] = float64(v)
	}

	entertainerResults, err := rdb.VSim(ctx, "famousPeople", &redis.VectorValues{Val: queryFloat64}).Result()
	if err != nil {
		panic(err)
	}

	fmt.Printf("'entertainer': %v\n", strings.Join(entertainerResults, ", "))
	// >>> 'entertainer': Chaim Topol, Freddie Mercury, Marie Fredriksson,
	// Linus Pauling, Masako Natsume, Paul Erdos,
	// Maryam Mirzakhani, Marie Curie
	// STEP_END

	queryValue = "science"

	queryResult, err = embeddingPipeline.RunPipeline([]string{queryValue})
	if err != nil {
		panic(err)
	}

	// Convert embedding to float64 slice
	queryFloat32 = queryResult.Embeddings[0]
	queryFloat64 = make([]float64, len(queryFloat32))
	for i, v := range queryFloat32 {
		queryFloat64[i] = float64(v)
	}

	scienceResults, err := rdb.VSim(ctx, "famousPeople", &redis.VectorValues{Val: queryFloat64}).Result()
	if err != nil {
		panic(err)
	}

	fmt.Printf("'science': %v\n", strings.Join(scienceResults, ", "))
	// >>> 'science': Marie Curie, Linus Pauling, Maryam Mirzakhani, Paul Erdos,
	// Marie Fredriksson, Freddie Mercury, Masako Natsume, Chaim Topol
	// STEP_START filtered_query
	queryValue = "science"

	queryResult, err = embeddingPipeline.RunPipeline([]string{queryValue})
	if err != nil {
		panic(err)
	}

	// Convert embedding to float64 slice
	queryFloat32 = queryResult.Embeddings[0]
	queryFloat64 = make([]float64, len(queryFloat32))
	for i, v := range queryFloat32 {
		queryFloat64[i] = float64(v)
	}

	science2000Results, err := rdb.VSimWithArgs(ctx, "famousPeople",
		&redis.VectorValues{Val: queryFloat64},
		&redis.VSimArgs{Filter: ".died < 2000"}).Result()
	if err != nil {
		panic(err)
	}

	fmt.Printf("'science2000': %v\n", strings.Join(science2000Results, ", "))
	// >>> 'science2000': Marie Curie, Linus Pauling, Paul Erdos, Freddie Mercury,
	// Masako Natsume
	// STEP_END
}
