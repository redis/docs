# frozen_string_literal: true

# Simulated sensor definitions and value generation for the dashboard demo.
class SensorSimulator
  SensorDefinition = Struct.new(
    :sensor_id,
    :zone,
    :unit,
    :min_value,
    :max_value,
    :baseline,
    :drift,
    :spike_chance,
    :spike_size,
    keyword_init: true
  ) do
    def sensor_type
      "power_consumption"
    end

    def key
      "ts:sensor:#{sensor_type}:#{sensor_id}"
    end

    def labels
      {
        "site" => "demo",
        "sensor_type" => sensor_type,
        "sensor_id" => sensor_id,
        "zone" => zone,
        "unit" => unit
      }
    end
  end

  SensorSample = Struct.new(:sensor, :value, keyword_init: true)

  SENSORS = [
    SensorDefinition.new(
      sensor_id: "power-1",
      zone: "north",
      unit: "watts",
      min_value: 320.0,
      max_value: 920.0,
      baseline: 480.0,
      drift: 18.0,
      spike_chance: 0.10,
      spike_size: 120.0
    ),
    SensorDefinition.new(
      sensor_id: "power-2",
      zone: "central",
      unit: "watts",
      min_value: 320.0,
      max_value: 920.0,
      baseline: 560.0,
      drift: 20.0,
      spike_chance: 0.08,
      spike_size: 140.0
    ),
    SensorDefinition.new(
      sensor_id: "power-3",
      zone: "south",
      unit: "watts",
      min_value: 320.0,
      max_value: 920.0,
      baseline: 640.0,
      drift: 24.0,
      spike_chance: 0.12,
      spike_size: 160.0
    )
  ].freeze

  def initialize(sensors = SENSORS)
    @sensors = sensors
    @values = sensors.to_h { |sensor| [sensor.sensor_id, sensor.baseline] }
  end

  def next_samples
    @sensors.map do |sensor|
      current = @values.fetch(sensor.sensor_id, sensor.baseline)
      drift = random_between(-sensor.drift, sensor.drift)
      pull = (sensor.baseline - current) * 0.12
      value = current + drift + pull

      if sensor.spike_chance.positive? && rand < sensor.spike_chance
        value += random_between(0.5, 1.0) * sensor.spike_size
      end

      value = [[value, sensor.min_value].max, sensor.max_value].min
      value = (value * 100.0).round / 100.0

      @values[sensor.sensor_id] = value
      SensorSample.new(sensor: sensor, value: value)
    end
  end

  private

  def random_between(min, max)
    min + rand * (max - min)
  end
end
