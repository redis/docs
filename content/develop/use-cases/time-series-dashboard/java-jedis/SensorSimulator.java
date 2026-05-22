import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Simulated sensor definitions and value generation for the dashboard demo.
 */
public final class SensorSimulator {
    public record SensorDefinition(
            String sensorId,
            String zone,
            String unit,
            double minValue,
            double maxValue,
            double baseline,
            double drift,
            double spikeChance,
            double spikeSize) {

        public String sensorType() {
            return "power_consumption";
        }

        public String key() {
            return "ts:sensor:" + sensorType() + ":" + sensorId;
        }

        public Map<String, String> labels() {
            Map<String, String> labels = new LinkedHashMap<>();
            labels.put("site", "demo");
            labels.put("sensor_type", sensorType());
            labels.put("sensor_id", sensorId);
            labels.put("zone", zone);
            labels.put("unit", unit);
            return labels;
        }
    }

    public record SensorSample(SensorDefinition sensor, double value) {
    }

    public static final List<SensorDefinition> SENSORS = List.of(
            new SensorDefinition("power-1", "north", "watts", 320.0, 920.0, 480.0, 18.0, 0.10, 120.0),
            new SensorDefinition("power-2", "central", "watts", 320.0, 920.0, 560.0, 20.0, 0.08, 140.0),
            new SensorDefinition("power-3", "south", "watts", 320.0, 920.0, 640.0, 24.0, 0.12, 160.0)
    );

    private final List<SensorDefinition> sensors;
    private final Map<String, Double> values = new LinkedHashMap<>();

    public SensorSimulator(List<SensorDefinition> sensors) {
        this.sensors = sensors;
        for (SensorDefinition sensor : sensors) {
            values.put(sensor.sensorId(), sensor.baseline());
        }
    }

    public List<SensorSample> nextSamples() {
        List<SensorSample> samples = new ArrayList<>();

        for (SensorDefinition sensor : sensors) {
            double current = values.get(sensor.sensorId());
            double drift = randomBetween(-sensor.drift(), sensor.drift());
            double pull = (sensor.baseline() - current) * 0.12;
            double value = current + drift + pull;

            if (sensor.spikeChance() > 0 && ThreadLocalRandom.current().nextDouble() < sensor.spikeChance()) {
                value += randomBetween(0.5, 1.0) * sensor.spikeSize();
            }

            value = Math.max(sensor.minValue(), Math.min(sensor.maxValue(), value));
            value = Math.round(value * 100.0) / 100.0;

            values.put(sensor.sensorId(), value);
            samples.add(new SensorSample(sensor, value));
        }

        return samples;
    }

    private double randomBetween(double min, double max) {
        return ThreadLocalRandom.current().nextDouble(min, max);
    }
}
