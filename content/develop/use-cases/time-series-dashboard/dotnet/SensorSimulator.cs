using System.Globalization;

namespace TimeSeriesDashboardDemo;

public sealed record SensorDefinition(
    string SensorId,
    string Zone,
    string Unit,
    double MinValue,
    double MaxValue,
    double Baseline,
    double Drift,
    double SpikeChance,
    double SpikeSize)
{
    public string SensorType => "power_consumption";

    public string Key => $"ts:sensor:{SensorType}:{SensorId}";

    public IReadOnlyDictionary<string, string> Labels =>
        new Dictionary<string, string>
        {
            ["site"] = "demo",
            ["sensor_type"] = SensorType,
            ["sensor_id"] = SensorId,
            ["zone"] = Zone,
            ["unit"] = Unit
        };
}

public sealed record SensorSample(SensorDefinition Sensor, double Value);

public static class SensorCatalog
{
    public static IReadOnlyList<SensorDefinition> Sensors { get; } =
        new[]
        {
            new SensorDefinition(
                SensorId: "power-1",
                Zone: "north",
                Unit: "watts",
                MinValue: 320.0,
                MaxValue: 920.0,
                Baseline: 480.0,
                Drift: 18.0,
                SpikeChance: 0.10,
                SpikeSize: 120.0),
            new SensorDefinition(
                SensorId: "power-2",
                Zone: "central",
                Unit: "watts",
                MinValue: 320.0,
                MaxValue: 920.0,
                Baseline: 560.0,
                Drift: 20.0,
                SpikeChance: 0.08,
                SpikeSize: 140.0),
            new SensorDefinition(
                SensorId: "power-3",
                Zone: "south",
                Unit: "watts",
                MinValue: 320.0,
                MaxValue: 920.0,
                Baseline: 640.0,
                Drift: 24.0,
                SpikeChance: 0.12,
                SpikeSize: 160.0)
        };
}

public sealed class SensorSimulator
{
    private readonly IReadOnlyList<SensorDefinition> _sensors;
    private readonly Dictionary<string, double> _values;
    private readonly Random _random = new();

    public SensorSimulator(IReadOnlyList<SensorDefinition> sensors)
    {
        _sensors = sensors;
        _values = sensors.ToDictionary(sensor => sensor.SensorId, sensor => sensor.Baseline);
    }

    public IReadOnlyList<SensorSample> NextSamples()
    {
        var samples = new List<SensorSample>(_sensors.Count);

        foreach (var sensor in _sensors)
        {
            var current = _values[sensor.SensorId];
            var drift = RandomBetween(-sensor.Drift, sensor.Drift);
            var pull = (sensor.Baseline - current) * 0.12;
            var value = current + drift + pull;

            if (sensor.SpikeChance > 0 && _random.NextDouble() < sensor.SpikeChance)
            {
                value += RandomBetween(0.5, 1.0) * sensor.SpikeSize;
            }

            value = Math.Clamp(value, sensor.MinValue, sensor.MaxValue);
            value = Math.Round(value, 2, MidpointRounding.AwayFromZero);

            _values[sensor.SensorId] = value;
            samples.Add(new SensorSample(sensor, value));
        }

        return samples;
    }

    private double RandomBetween(double min, double max) => min + (_random.NextDouble() * (max - min));
}
