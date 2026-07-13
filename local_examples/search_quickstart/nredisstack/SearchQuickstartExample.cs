// EXAMPLE: search_quickstart

using NRedisStack.RedisStackCommands;
using NRedisStack.Search;
using NRedisStack.Search.Aggregation;
using NRedisStack.Search.Literals.Enums;
using NRedisStack.Tests;
using StackExchange.Redis;

// REMOVE_START
namespace Doc;

[Collection("DocsTests")]
// REMOVE_END
public class SearchQuickstartExample
// REMOVE_START
: AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public SearchQuickstartExample(EndpointsFixture fixture) : base(fixture) { }

    [Fact]
    // REMOVE_END
    public void Run()
    {
        //REMOVE_START
        // This is needed because we're constructing ConfigurationOptions in the test before calling GetConnection
        SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
        var _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
        //REMOVE_END
        // STEP_START connect
        var muxer = ConnectionMultiplexer.Connect("localhost:6379");
        var db = muxer.GetDatabase();
        var ft = db.FT();
        var json = db.JSON();
        // STEP_END

        // REMOVE_START
        try
        {
            ft.DropIndex("idx:bicycle");
        }
        catch
        {
            // ignored
        }
        // REMOVE_END

        // STEP_START data_sample
        var bike1 = new
        {
            brand = "Velorim",
            model = "Jigger",
            price = 270M,
            description = "Small and powerful, the Jigger is the best ride " +
                            "for the smallest of tikes! This is the tiniest " +
                            "kids’ pedal bike on the market available without" +
                            " a coaster brake, the Jigger is the vehicle of " +
                            "choice for the rare tenacious little rider " +
                            "raring to go.",
            condition = "new"
        };
        // STEP_END

        var bicycles = new object[]
            {
                bike1,
                new
                {
                    brand = "Bicyk",
                    model = "Hillcraft",
                    price = 1200M,
                    description = "Kids want to ride with as little weight as possible." +
                        " Especially on an incline! They may be at the age " +
                        "when a 27.5 inch wheel bike is just too clumsy coming " +
                        "off a 24 inch bike. The Hillcraft 26 is just the solution" +
                        " they need!",
                    condition = "used",
                },
                new
                {
                    brand = "Nord",
                    model = "Chook air 5",
                    price = 815M,
                    description = "The Chook Air 5  gives kids aged six years and older " +
                        "a durable and uberlight mountain bike for their first" +
                        " experience on tracks and easy cruising through forests" +
                        " and fields. The lower  top tube makes it easy to mount" +
                        " and dismount in any situation, giving your kids greater" +
                        " safety on the trails.",
                    condition = "used",
                },
                new
                {
                    brand = "Eva",
                    model = "Eva 291",
                    price = 3400M,
                    description = "The sister company to Nord, Eva launched in 2005 as the" +
                        " first and only women-dedicated bicycle brand. Designed" +
                        " by women for women, allEva bikes are optimized for the" +
                        " feminine physique using analytics from a body metrics" +
                        " database. If you like 29ers, try the Eva 291. It’s a " +
                        "brand new bike for 2022.. This full-suspension, " +
                        "cross-country ride has been designed for velocity. The" +
                        " 291 has 100mm of front and rear travel, a superlight " +
                        "aluminum frame and fast-rolling 29-inch wheels. Yippee!",
                    condition = "used",
                },
                new
                {
                    brand = "Noka Bikes",
                    model = "Kahuna",
                    price = 3200M,
                    description = "Whether you want to try your hand at XC racing or are " +
                        "looking for a lively trail bike that's just as inspiring" +
                        " on the climbs as it is over rougher ground, the Wilder" +
                        " is one heck of a bike built specifically for short women." +
                        " Both the frames and components have been tweaked to " +
                        "include a women’s saddle, different bars and unique " +
                        "colourway.",
                    condition = "used",
                },
                new
                {
                    brand = "Breakout",
                    model = "XBN 2.1 Alloy",
                    price = 810M,
                    description = "The XBN 2.1 Alloy is our entry-level road bike – but that’s" +
                        " not to say that it’s a basic machine. With an internal " +
                        "weld aluminium frame, a full carbon fork, and the slick-shifting" +
                        " Claris gears from Shimano’s, this is a bike which doesn’t" +
                        " break the bank and delivers craved performance.",
                    condition = "new",
                },
                new
                {
                    brand = "ScramBikes",
                    model = "WattBike",
                    price = 2300M,
                    description = "An e-bike with a 1000W mid-drive and a 48V battery, offering over 60 miles per charge and three riding modes.",
                    condition = "new",
                },
                new
                {
                    brand = "Peaknetic",
                    model = "Secto",
                    price = 430M,
                    description = "A lightweight aluminum commuter bike with ergonomic grips, a lumbar-supporting seat, and a low step-over frame for comfort and easy mounting.",
                    condition = "new",
                },
                new
                {
                    brand = "nHill",
                    model = "Summit",
                    price = 1200M,
                    description = "This budget mountain bike from nHill performs well both on bike" +
                        " paths and on the trail. The fork with 100mm of travel absorbs" +
                        " rough terrain. Fat Kenda Booster tires give you grip in corners" +
                        " and on wet trails. The Shimano Tourney drivetrain offered enough" +
                        " gears for finding a comfortable pace to ride uphill, and the" +
                        " Tektro hydraulic disc brakes break smoothly. Whether you want an" +
                        " affordable bike that you can take to work, but also take trail in" +
                        " mountains on the weekends or you’re just after a stable," +
                        " comfortable ride for the bike path, the Summit gives a good value" +
                        " for money.",
                    condition = "new",
                },
                new
                {
                    model = "ThrillCycle",
                    brand = "BikeShind",
                    price = 815M,
                    description = "An artsy,  retro-inspired bicycle that’s as functional as it is" +
                        " pretty: The ThrillCycle steel frame offers a smooth ride. A" +
                        " 9-speed drivetrain has enough gears for coasting in the city, but" +
                        " we wouldn’t suggest taking it to the mountains. Fenders protect" +
                        " you from mud, and a rear basket lets you transport groceries," +
                        " flowers and books. The ThrillCycle comes with a limited lifetime" +
                        " warranty, so this little guy will last you long past graduation.",
                    condition = "refurbished",
                },
            };

        // STEP_START create_index
        var schema = new Schema()
            .AddTextField(new FieldName("$.brand", "brand"))
            .AddTextField(new FieldName("$.model", "model"))
            .AddTextField(new FieldName("$.description", "description"))
            .AddNumericField(new FieldName("$.price", "price"))
            .AddTagField(new FieldName("$.condition", "condition"));

        ft.Create(
            "idx:bicycle",
            new FTCreateParams().On(IndexDataType.JSON).Prefix("bicycle:"),
            schema);

        for (int i = 0; i < bicycles.Length; i++)
        {
            json.Set($"bicycle:{i}", "$", bicycles[i]);
        }
        // STEP_END

        // STEP_START wildcard_query
        var query1 = new Query("*");
        var res1 = ft.Search("idx:bicycle", query1).Documents;
        Console.WriteLine(string.Join("\n", res1.Count()));
        // Prints: Documents found: 10
        // STEP_END
        // REMOVE_START
        Assert.Equal(10, res1.Count());
        // REMOVE_END

        // STEP_START query_single_term
        var query2 = new Query("@model:Jigger");
        var res2 = ft.Search("idx:bicycle", query2).Documents;
        Console.WriteLine(string.Join("\n", res2.Select(x => x["json"])));
        // Prints: {"brand":"Moore PLC","model":"Award Race","price":3790.76,
        //          "description":"This olive folding bike features a carbon frame
        //          and 27.5 inch wheels. This folding bike is perfect for compact
        //          storage and transportation.","condition":"new"}
        // STEP_END
        // REMOVE_START
        Assert.Single(res2);
        Assert.Equal("bicycle:0", res2[0].Id);
        // REMOVE_END

        // STEP_START query_single_term_and_num_range
        var query3 = new Query("basic @price:[500 1000]");
        var res3 = ft.Search("idx:bicycle", query3).Documents;
        Console.WriteLine(string.Join("\n", res3.Select(x => x["json"])));
        // Prints: {"brand":"Moore PLC","model":"Award Race","price":3790.76,
        //          "description":"This olive folding bike features a carbon frame
        //          and 27.5 inch wheels. This folding bike is perfect for compact
        //          storage and transportation.","condition":"new"}
        // STEP_END
        // REMOVE_START
        Assert.Single(res3);
        Assert.Equal("bicycle:5", res3[0].Id);
        // REMOVE_END

        // STEP_START query_exact_matching
        var query4 = new Query("@brand:\"Noka Bikes\"");
        var res4 = ft.Search("idx:bicycle", query4).Documents;
        Console.WriteLine(string.Join("\n", res4.Select(x => x["json"])));
        // Prints: {"brand":"Moore PLC","model":"Award Race","price":3790.76,
        //          "description":"This olive folding bike features a carbon frame
        //          and 27.5 inch wheels. This folding bike is perfect for compact
        //          storage and transportation.","condition":"new"}
        // STEP_END
        // REMOVE_START
        Assert.Single(res4);
        Assert.Equal("bicycle:4", res4[0].Id);
        // REMOVE_END

        // STEP_START query_single_term_limit_fields
        var query5 = new Query("@model:Jigger").ReturnFields("price");
        var res5 = ft.Search("idx:bicycle", query5).Documents;
        Console.WriteLine(res5.First()["price"]);
        // Prints: 270
        // STEP_END
        // REMOVE_START
        Assert.Single(res5);
        Assert.Equal("bicycle:0", res5[0].Id);
        // REMOVE_END

        // STEP_START simple_aggregation
        var request = new AggregationRequest("*").GroupBy(
            "@condition", Reducers.Count().As("Count"));
        var result = ft.Aggregate("idx:bicycle", request);

        for (var i = 0; i < result.TotalResults; i++)
        {
            var row = result.GetRow(i);
            Console.WriteLine($"{row["condition"]} - {row["Count"]}");
        }

        // Prints:
        // refurbished - 1
        // used - 4
        // new - 5
        // STEP_END
        // REMOVE_START
        Assert.Equal(3, result.TotalResults);
        // REMOVE_END
    }
}