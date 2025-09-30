// EXAMPLE: home_vecsets
// STEP_START import
// Suppress experimental API warnings for VectorSet
#pragma warning disable SER001

using StackExchange.Redis;

using Microsoft.ML;
using Microsoft.ML.Transforms.Text;
// STEP_END

// STEP_START model
static PredictionEngine<TextData, TransformedTextData> GetPredictionEngine()
{
    // Create a new ML context, for ML.NET operations. It can be used for
    // exception tracking and logging, as well as the source of randomness.
    var mlContext = new MLContext();

    // Create an empty list as the dataset
    var emptySamples = new List<TextData>();

    // Convert sample list to an empty IDataView.
    var emptyDataView = mlContext.Data.LoadFromEnumerable(emptySamples);

    // A pipeline for converting text into a 150-dimension embedding vector
    var textPipeline = mlContext.Transforms.Text.NormalizeText("Text")
        .Append(mlContext.Transforms.Text.TokenizeIntoWords("Tokens",
            "Text"))
        .Append(mlContext.Transforms.Text.ApplyWordEmbedding("Features",
            "Tokens", WordEmbeddingEstimator.PretrainedModelKind
            .SentimentSpecificWordEmbedding));

    // Fit to data.
    var textTransformer = textPipeline.Fit(emptyDataView);

    // Create the prediction engine to get the embedding vector from the input text/string.
    var predictionEngine = mlContext.Model.CreatePredictionEngine<TextData,
        TransformedTextData>(textTransformer);

    return predictionEngine;
}
// STEP_END

// STEP_START get_embedding
static float[] GetEmbedding(
    PredictionEngine<TextData, TransformedTextData> model, string sentence
)
{
    // Call the prediction API to convert the text into embedding vector.
    var data = new TextData()
    {
        Text = sentence
    };

    var prediction = model.Predict(data);

    float[] floatArray = Array.ConvertAll(prediction.Features, x => (float)x);

    return floatArray;
}
// STEP_END

// STEP_START data
Dictionary<string, dynamic> peopleData = new Dictionary<string, dynamic>
{
    ["Marie Curie"] = new
    {
        born = 1867,
        died = 1934,
        description = @"
        Polish-French chemist and physicist. The only person ever to win
        two Nobel prizes for two different sciences.
        "
    },
    ["Linus Pauling"] = new
    {
        born = 1901,
        died = 1994,
        description = @"
        American chemist and peace activist. One of only two people to win two
        Nobel prizes in different fields (chemistry and peace).
        "
    },
    ["Freddie Mercury"] = new
    {
        born = 1946,
        died = 1991,
        description = @"
        British musician, best known as the lead singer of the rock band
        Queen.
        "
    },
    ["Marie Fredriksson"] = new
    {
        born = 1958,
        died = 2019,
        description = @"
        Swedish multi-instrumentalist, mainly known as the lead singer and
        keyboardist of the band Roxette.
        "
    },
    ["Paul Erdos"] = new
    {
        born = 1913,
        died = 1996,
        description = @"
        Hungarian mathematician, known for his eccentric personality almost
        as much as his contributions to many different fields of mathematics.
        "
    },
    ["Maryam Mirzakhani"] = new
    {
        born = 1977,
        died = 2017,
        description = @"
        Iranian mathematician. The first woman ever to win the Fields medal
        for her contributions to mathematics.
        "
    },
    ["Masako Natsume"] = new
    {
        born = 1957,
        died = 1985,
        description = @"
        Japanese actress. She was very famous in Japan but was primarily
        known elsewhere in the world for her portrayal of Tripitaka in the
        TV series Monkey.
        "
    },
    ["Chaim Topol"] = new
    {
        born = 1935,
        died = 2023,
        description = @"
        Israeli actor and singer, usually credited simply as 'Topol'. He was
        best known for his many appearances as Tevye in the musical Fiddler
        on the Roof.
        "
    }
};
// STEP_END

// STEP_START add_data
ConnectionMultiplexer muxer = ConnectionMultiplexer.Connect("localhost:6379");
IDatabase db = muxer.GetDatabase();

PredictionEngine<TextData, TransformedTextData> model = GetPredictionEngine();

foreach (KeyValuePair<string, dynamic> person in peopleData)
{
    string name = person.Key;
    dynamic details = person.Value;
    float[] embedding = GetEmbedding(model, details.description);

    VectorSetAddRequest addRequest = VectorSetAddRequest.Member(name, embedding, null);
    db.VectorSetAdd("famousPeople", addRequest);

    // Set attributes separately
    string attributesJson = $"{{\"born\": {details.born}, \"died\": {details.died}}}";
    db.VectorSetSetAttributesJson("famousPeople", name, attributesJson);
}
// STEP_END

// STEP_START basic_query
string queryValue = "actors";

float[] queryEmbedding = GetEmbedding(model, queryValue);

VectorSetSimilaritySearchRequest basicQuery = VectorSetSimilaritySearchRequest.ByVector(queryEmbedding);
using (Lease<VectorSetSimilaritySearchResult>? actorsResults = db.VectorSetSimilaritySearch("famousPeople", basicQuery))
{
    IEnumerable<string> resultIds = actorsResults!.Span.ToArray()
        .Select(r => (string?)r.Member)
        .Where(id => id != null)
        .Select(id => $"'{id!}'");
    Console.WriteLine($"'actors': [{string.Join(", ", resultIds)}]");
}
// STEP_END

// STEP_START limited_query
queryValue = "actors";

queryEmbedding = GetEmbedding(model, queryValue);

VectorSetSimilaritySearchRequest limitedQuery = VectorSetSimilaritySearchRequest.ByVector(queryEmbedding);
limitedQuery.Count = 2;
using (Lease<VectorSetSimilaritySearchResult>? twoActorsResults = db.VectorSetSimilaritySearch("famousPeople", limitedQuery))
{
    IEnumerable<string> resultIds = twoActorsResults!.Span.ToArray()
        .Select(r => (string?)r.Member)
        .Where(id => id != null)
        .Select(id => $"'{id!}'");
    Console.WriteLine($"'actors (2)': [{string.Join(", ", resultIds)}]");
    // >>> 'actors (2)': ['Masako Natsume', 'Chaim Topol']
}
// STEP_END

// STEP_START entertainer_query
queryValue = "entertainer";

queryEmbedding = GetEmbedding(model, queryValue);

VectorSetSimilaritySearchRequest entertainerQuery = VectorSetSimilaritySearchRequest.ByVector(queryEmbedding);
using (Lease<VectorSetSimilaritySearchResult>? entertainerResults = db.VectorSetSimilaritySearch("famousPeople", entertainerQuery))
{
    IEnumerable<string> resultIds = entertainerResults!.Span.ToArray()
        .Select(r => (string?)r.Member)
        .Where(id => id != null)
        .Select(id => $"'{id!}'");
    Console.WriteLine($"'entertainer': [{string.Join(", ", resultIds)}]");
    // >>> 'entertainer': ['Chaim Topol', 'Freddie Mercury',
    // 'Marie Fredriksson', 'Masako Natsume', 'Linus Pauling',
    // 'Paul Erdos', 'Maryam Mirzakhani', 'Marie Curie']
}
// STEP_END

queryValue = "science";

queryEmbedding = GetEmbedding(model, queryValue);

VectorSetSimilaritySearchRequest scienceQuery = VectorSetSimilaritySearchRequest.ByVector(queryEmbedding);
using (Lease<VectorSetSimilaritySearchResult>? scienceResults = db.VectorSetSimilaritySearch("famousPeople", scienceQuery))
{
    IEnumerable<string> resultIds = scienceResults!.Span.ToArray()
        .Select(r => (string?)r.Member)
        .Where(id => id != null)
        .Select(id => $"'{id!}'");
    Console.WriteLine($"'science': [{string.Join(", ", resultIds)}]");
    // >>> 'science': ['Marie Curie', 'Linus Pauling',
    // 'Maryam Mirzakhani', 'Paul Erdos', 'Marie Fredriksson',
    // 'Freddie Mercury', 'Masako Natsume', 'Chaim Topol']
}

// STEP_START filtered_query
queryValue = "science";

queryEmbedding = GetEmbedding(model, queryValue);

VectorSetSimilaritySearchRequest filteredQuery = VectorSetSimilaritySearchRequest.ByVector(queryEmbedding);
filteredQuery.FilterExpression = ".died < 2000";
using (Lease<VectorSetSimilaritySearchResult>? science2000Results = db.VectorSetSimilaritySearch("famousPeople", filteredQuery))
{
    IEnumerable<string> resultIds = science2000Results!.Span.ToArray()
        .Select(r => (string?)r.Member)
        .Where(id => id != null)
        .Select(id => $"'{id!}'");
    Console.WriteLine($"'science2000': [{string.Join(", ", resultIds)}]");
    // >>> 'science2000': ['Marie Curie', 'Linus Pauling',
    // 'Paul Erdos', 'Freddie Mercury', 'Masako Natsume']
}
// STEP_END

// STEP_START data_classes
class TextData
{
    public string Text { get; set; } = string.Empty;
}

class TransformedTextData : TextData
{
    public float[] Features { get; set; } = Array.Empty<float>();
}
// STEP_END
