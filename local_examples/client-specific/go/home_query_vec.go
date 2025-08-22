// EXAMPLE: home_query_vec
// STEP_START import
package main

import (
	"context"
	"encoding/binary"
	"fmt"
	"math"

	"github.com/knights-analytics/hugot"
	"github.com/redis/go-redis/v9"
)

// STEP_END

// STEP_START helper
func floatsToBytes(fs []float32) []byte {
	buf := make([]byte, len(fs)*4)

	for i, f := range fs {
		u := math.Float32bits(f)
		binary.NativeEndian.PutUint32(buf[i*4:], u)
	}

	return buf
}

// STEP_END

func main() {
	// STEP_START connect
	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
		Protocol: 2,
	})

	rdb.FTDropIndexWithArgs(ctx,
		"vector_idx",
		&redis.FTDropIndexOptions{
			DeleteDocs: true,
		},
	)
	// STEP_END

	// STEP_START create_index
	_, err := rdb.FTCreate(ctx,
		"vector_idx",
		&redis.FTCreateOptions{
			OnHash: true,
			Prefix: []any{"doc:"},
		},
		&redis.FieldSchema{
			FieldName: "content",
			FieldType: redis.SearchFieldTypeText,
		},
		&redis.FieldSchema{
			FieldName: "genre",
			FieldType: redis.SearchFieldTypeTag,
		},
		&redis.FieldSchema{
			FieldName: "embedding",
			FieldType: redis.SearchFieldTypeVector,
			VectorArgs: &redis.FTVectorArgs{
				HNSWOptions: &redis.FTHNSWOptions{
					Dim:            384,
					DistanceMetric: "L2",
					Type:           "FLOAT32",
				},
			},
		},
	).Result()
	if err != nil {
		panic(err)
	}
	// STEP_END

	// STEP_START embedder
	// Create a Hugot session
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

	// Download the model
	downloadOptions := hugot.NewDownloadOptions()
	downloadOptions.OnnxFilePath = "onnx/model.onnx" // Specify which ONNX file to use
	modelPath, err := hugot.DownloadModel("sentence-transformers/all-MiniLM-L6-v2", "./models/", downloadOptions)
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

	// STEP_START add_data
	sentences := []string{
		"That is a very happy person",
		"That is a happy dog",
		"Today is a sunny day",
	}

	tags := []string{
		"persons", "pets", "weather",
	}

	// Generate embeddings using Hugot
	embeddingResult, err := embeddingPipeline.RunPipeline(sentences)
	if err != nil {
		panic(err)
	}

	// Extract the embeddings from the result
	embeddings := embeddingResult.Embeddings

	for i, emb := range embeddings {
		buffer := floatsToBytes(emb)

		_, err = rdb.HSet(ctx,
			fmt.Sprintf("doc:%v", i),
			map[string]any{
				"content":   sentences[i],
				"genre":     tags[i],
				"embedding": buffer,
			},
		).Result()

		if err != nil {
			panic(err)
		}
	}
	// STEP_END

	// STEP_START query
	// Generate query embedding using Hugot
	queryResult, err := embeddingPipeline.RunPipeline([]string{
		"That is a happy person",
	})

	if err != nil {
		panic(err)
	}

	buffer := floatsToBytes(queryResult.Embeddings[0])

	results, err := rdb.FTSearchWithArgs(ctx,
		"vector_idx",
		"*=>[KNN 3 @embedding $vec AS vector_distance]",
		&redis.FTSearchOptions{
			Return: []redis.FTSearchReturn{
				{FieldName: "vector_distance"},
				{FieldName: "content"},
			},
			DialectVersion: 2,
			Params: map[string]any{
				"vec": buffer,
			},
		},
	).Result()

	if err != nil {
		panic(err)
	}

	for _, doc := range results.Docs {
		fmt.Printf(
			"ID: %v, Distance:%v, Content:'%v'\n",
			doc.ID, doc.Fields["vector_distance"], doc.Fields["content"],
		)
	}
	// STEP_END

	// STEP_START json_index
	rdb.FTDropIndexWithArgs(ctx,
		"vector_json_idx",
		&redis.FTDropIndexOptions{
			DeleteDocs: true,
		},
	)

	_, err = rdb.FTCreate(ctx,
		"vector_json_idx",
		&redis.FTCreateOptions{
			OnJSON: true,
			Prefix: []any{"jdoc:"},
		},
		&redis.FieldSchema{
			FieldName: "$.content",
			As:        "content",
			FieldType: redis.SearchFieldTypeText,
		},
		&redis.FieldSchema{
			FieldName: "$.genre",
			As:        "genre",
			FieldType: redis.SearchFieldTypeTag,
		},
		&redis.FieldSchema{
			FieldName: "$.embedding",
			As:        "embedding",
			FieldType: redis.SearchFieldTypeVector,
			VectorArgs: &redis.FTVectorArgs{
				HNSWOptions: &redis.FTHNSWOptions{
					Dim:            384,
					DistanceMetric: "L2",
					Type:           "FLOAT32",
				},
			},
		},
	).Result()
	if err != nil {
		panic(err)
	}
	// STEP_END

	// STEP_START json_data
	for i, emb := range embeddings {
		_, err = rdb.JSONSet(ctx,
			fmt.Sprintf("jdoc:%v", i),
			"$",
			map[string]any{
				"content":   sentences[i],
				"genre":     tags[i],
				"embedding": emb,
			},
		).Result()

		if err != nil {
			panic(err)
		}
	}
	// STEP_END

	// STEP_START json_query
	// Generate query embedding for JSON search using Hugot
	jsonQueryResult, err := embeddingPipeline.RunPipeline([]string{
		"That is a happy person",
	})

	if err != nil {
		panic(err)
	}

	jsonBuffer := floatsToBytes(jsonQueryResult.Embeddings[0])

	jsonResults, err := rdb.FTSearchWithArgs(ctx,
		"vector_json_idx",
		"*=>[KNN 3 @embedding $vec AS vector_distance]",
		&redis.FTSearchOptions{
			Return: []redis.FTSearchReturn{
				{FieldName: "vector_distance"},
				{FieldName: "content"},
			},
			DialectVersion: 2,
			Params: map[string]any{
				"vec": jsonBuffer,
			},
		},
	).Result()

	if err != nil {
		panic(err)
	}

	for _, doc := range jsonResults.Docs {
		fmt.Printf(
			"ID: %v, Distance:%v, Content:'%v'\n",
			doc.ID, doc.Fields["vector_distance"], doc.Fields["content"],
		)
	}
	// STEP_END
}
