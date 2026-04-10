package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"html"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	graphWidth  = 1020
	graphHeight = 150
	graphPadX   = 10
	graphPadY   = 18
)

func main() {
	redisHost := flag.String("redis-host", "localhost", "Redis host")
	redisPort := flag.Int("redis-port", 6379, "Redis port")
	port := flag.Int("port", 8080, "HTTP port for the local dashboard")
	flag.Parse()

	ctx := context.Background()
	client := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%d", *redisHost, *redisPort),
	})

	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatalf("failed to connect to Redis at %s:%d: %v", *redisHost, *redisPort, err)
	}

	store := NewRedisTimeSeriesStore(client, Sensors)
	if err := store.EnsureSchema(ctx); err != nil {
		log.Fatalf("time series setup failed: %v", err)
	}

	simulator := NewSensorSimulator(Sensors)
	ticker := time.NewTicker(SampleIntervalMS * time.Millisecond)
	defer ticker.Stop()

	go func() {
		for range ticker.C {
			if err := store.AddSamples(ctx, simulator.NextSamples()); err != nil {
				log.Printf("failed to add samples: %v", err)
			}
		}
	}()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" && r.URL.Path != "/index.html" {
			http.NotFound(w, r)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprint(w, htmlPage())
	})

	http.HandleFunc("/api/snapshot", func(w http.ResponseWriter, r *http.Request) {
		snapshot, err := store.DashboardSnapshot(r.Context())
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(snapshot)
	})

	log.Printf("Dashboard running at http://localhost:%d", *port)
	log.Printf("Writing simulated samples to Redis at %s:%d", *redisHost, *redisPort)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *port), nil))
}

func htmlPage() string {
	template := `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis TimeSeries Rolling Demo</title>
  <style>
    :root {
      --bg: #f6f0e3;
      --paper: #fffaf0;
      --ink: #1f2a2e;
      --muted: #5b666a;
      --line: #d9ccb7;
      --accent: #126353;
      --accent-soft: #dcefe7;
      --signal: #c1532f;
      --grid: #e9decc;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top left, #fff4d7, transparent 28%),
        linear-gradient(180deg, #f8f3e7 0%, var(--bg) 100%);
      color: var(--ink);
      font-family: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
    }
    main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 14px 14px 24px;
    }
    h1, h2, h3 {
      margin: 0;
      line-height: 1.1;
    }
    p {
      margin: 0;
      color: var(--muted);
    }
    .intro {
      display: grid;
      gap: 6px;
      padding: 12px 14px;
      background: rgba(255, 250, 240, 0.9);
      border: 1px solid var(--line);
      border-radius: 14px;
      margin-bottom: 12px;
    }
    .intro h1 {
      font-size: 1.7rem;
    }
    .intro p {
      font-size: 0.94rem;
      line-height: 1.35;
    }
    .metrics {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }
    .pill {
      padding: 4px 8px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 0.82rem;
    }
    .sensor-panel {
      margin-top: 10px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--paper);
      box-shadow: 0 10px 30px rgba(31, 42, 46, 0.05);
    }
    .sensor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }
    .sensor-title-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      min-width: 0;
    }
    .sensor-header h2 {
      font-size: 1.1rem;
    }
    .sensor-meta {
      font-size: 0.82rem;
      color: var(--muted);
      white-space: nowrap;
    }
    .latest {
      color: var(--accent);
      font-size: 0.98rem;
      white-space: nowrap;
    }
    svg {
      width: 100%;
      height: 164px;
      display: block;
      background: linear-gradient(180deg, #fffdf8 0%, #faf4e8 100%);
      border: 1px solid var(--line);
      border-radius: 10px;
    }
    .plot-shell {
      position: relative;
    }
    .bucket-row {
      margin-top: 0;
    }
    .empty {
      color: var(--muted);
      font-style: italic;
      padding: 6px 0 0;
    }
    code {
      font-family: "SFMono-Regular", Menlo, monospace;
      color: var(--signal);
      font-size: 0.92em;
    }
    @media (max-width: 760px) {
      .intro h1 {
        font-size: 1.45rem;
      }
      .sensor-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .sensor-title-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }
      .sensor-meta {
        white-space: normal;
      }
      .bucket-row {
        overflow-x: auto;
      }
    }
  </style>
</head>
<body>
  <main>
    <section class="intro">
      <h1>Rolling Power Sensor Demo</h1>
      <p>Three sensors write new readings to Redis every <code>__SAMPLE_INTERVAL__ms</code>. Each graph shows only the most recent <code>__WINDOW__s</code>, so old samples disappear as Redis retention expires them. The buckets underneath each graph summarize the same data in <code>__BUCKET__s</code> windows using min, max, and average aggregation.</p>
      <div class="metrics">
        <span class="pill">Commands in play: <code>TS.MADD</code>, <code>TS.RANGE</code></span>
        <span class="pill">Retention: <code>__RETENTION__s</code></span>
        <span class="pill">Sample interval: <code>__SAMPLE_INTERVAL__ms</code></span>
        <span class="pill">Bucket width: <code>__BUCKET__s</code></span>
      </div>
    </section>
    <div id="sensors">Loading snapshot...</div>
  </main>

  <script>
    const GRAPH_WIDTH = __GRAPH_WIDTH__;
    const GRAPH_HEIGHT = __GRAPH_HEIGHT__;
    const GRAPH_PAD_X = __GRAPH_PAD_X__;
    const GRAPH_PAD_Y = __GRAPH_PAD_Y__;

    function fmt(value) {
      if (value === null || value === undefined) return "n/a";
      return Number(value).toFixed(1);
    }

    function timeLabel(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
    }

    function combinedSvgForSensor(sensor, now, windowMs) {
      const width = GRAPH_WIDTH;
      const chartHeight = GRAPH_HEIGHT;
      const bucketHeight = 36;
      const height = chartHeight + bucketHeight;
      const padX = GRAPH_PAD_X;
      const padY = GRAPH_PAD_Y;
      const plotWidth = width - padX * 2;
      const plotHeight = chartHeight - padY * 2;
      const bucketTop = chartHeight;
      const clipIdBase = sensor.sensor_id.replace(/[^a-zA-Z0-9_-]/g, "-");
      const chartClipId = __BT__chart-clip-${clipIdBase}__BT__;
      const bucketClipId = __BT__bucket-clip-${clipIdBase}__BT__;
      const values = sensor.raw_points.map((point) => point.value);
      const minValue = Math.min(...values, 300);
      const maxValue = Math.max(...values, 900);
      const valueSpan = Math.max(maxValue - minValue, 1);

      const xFor = (timestamp) => padX + ((timestamp - (now - windowMs)) / windowMs) * plotWidth;
      const yFor = (value) => padY + (1 - ((value - minValue) / valueSpan)) * plotHeight;

      const boundaryTimestamps = sensor.buckets.length
        ? [...sensor.buckets.map((bucket) => bucket.start), sensor.buckets[sensor.buckets.length - 1].end]
        : [now - windowMs, now];

      const verticalLines = boundaryTimestamps.map((timestamp) => {
        const x = xFor(timestamp);
        return __BT__<line x1="${x.toFixed(2)}" y1="${padY}" x2="${x.toFixed(2)}" y2="${chartHeight - padY}" stroke="var(--grid)" stroke-width="1" />__BT__;
      }).join("");

      const horizontalLines = [];
      for (let i = 0; i <= 3; i += 1) {
        const y = padY + (plotHeight / 3) * i;
        horizontalLines.push(__BT__<line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="var(--grid)" stroke-width="1" />__BT__);
      }

      const bucketBands = sensor.buckets.map((bucket) => {
        const rawStartX = xFor(bucket.start);
        const rawEndX = xFor(bucket.end);
        const bandWidth = Math.max(rawEndX - rawStartX, 0);
        return __BT__<rect x="${rawStartX.toFixed(2)}" y="${padY}" width="${bandWidth.toFixed(2)}" height="${plotHeight.toFixed(2)}" fill="rgba(18, 99, 83, 0.04)" />__BT__;
      }).join("");

      const bucketDividers = sensor.buckets.map((bucket) => {
        const x = xFor(bucket.start);
        return __BT__<line x1="${x.toFixed(2)}" y1="${padY}" x2="${x.toFixed(2)}" y2="${chartHeight - padY}" stroke="rgba(18, 99, 83, 0.28)" stroke-width="1.2" />__BT__;
      }).join("") + __BT__<line x1="${(width - padX).toFixed(2)}" y1="${padY}" x2="${(width - padX).toFixed(2)}" y2="${chartHeight - padY}" stroke="rgba(18, 99, 83, 0.28)" stroke-width="1.2" />__BT__;

      const polyline = sensor.raw_points.length > 0
        ? sensor.raw_points.map((point) => __BT__${xFor(point.timestamp).toFixed(2)},${yFor(point.value).toFixed(2)}__BT__).join(" ")
        : "";

      const dots = sensor.raw_points.map((point) => __BT__<circle cx="${xFor(point.timestamp).toFixed(2)}" cy="${yFor(point.value).toFixed(2)}" r="2.7" fill="var(--signal)" />__BT__).join("");

      const labels = boundaryTimestamps.map((timestamp) => {
        const x = xFor(timestamp);
        return __BT__<text x="${x.toFixed(2)}" y="${chartHeight - 4}" text-anchor="middle" font-size="11" fill="var(--muted)">${timeLabel(timestamp)}</text>__BT__;
      }).join("");

      const bucketRects = sensor.buckets.map((bucket) => {
        const relativeStart = (bucket.start - (now - windowMs)) / windowMs;
        const relativeWidth = (bucket.end - bucket.start) / windowMs;
        const rawStartX = padX + relativeStart * plotWidth;
        const rawEndX = rawStartX + relativeWidth * plotWidth;
        const rectWidth = Math.max(rawEndX - rawStartX, 0);
        const visibleStartX = Math.max(rawStartX, padX);
        const visibleEndX = Math.min(rawEndX, width - padX);
        const visibleWidth = Math.max(visibleEndX - visibleStartX, 0);
        const textX = rawStartX + rectWidth / 2;
        const textOpacity = Math.max(0, Math.min(1, (visibleWidth - 58) / 38)).toFixed(2);
        let textBlock = "";

        if (visibleWidth >= 112) {
          textBlock = __BT__<text x="${textX.toFixed(2)}" y="${bucketTop + 23}" text-anchor="middle" font-size="11" fill="#1f2a2e" opacity="${textOpacity}">Min ${fmt(bucket.min)}, Max ${fmt(bucket.max)}, Avg ${fmt(bucket.avg)}</text>__BT__;
        } else if (visibleWidth >= 86) {
          textBlock = __BT__<text x="${textX.toFixed(2)}" y="${bucketTop + 23}" text-anchor="middle" font-size="10" fill="#1f2a2e" opacity="${textOpacity}">Avg ${fmt(bucket.avg)}, Min ${fmt(bucket.min)}, Max ${fmt(bucket.max)}</text>__BT__;
        }

        return __BT__<rect x="${rawStartX.toFixed(2)}" y="${bucketTop}" width="${rectWidth.toFixed(2)}" height="36" fill="#fffdf8" stroke="#d9ccb7" />${textBlock}__BT__;
      }).join("");

      const bucketBoundaryLines = boundaryTimestamps.map((timestamp) => {
        const x = xFor(timestamp);
        return __BT__<line x1="${x.toFixed(2)}" y1="${bucketTop}" x2="${x.toFixed(2)}" y2="${height}" stroke="rgba(18, 99, 83, 0.22)" stroke-width="1" />__BT__;
      }).join("");

      return __BT__
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Rolling graph and bucket summaries for ${sensor.sensor_id}">
          <defs>
            <clipPath id="${chartClipId}">
              <rect x="${padX}" y="${padY}" width="${plotWidth}" height="${plotHeight}" />
            </clipPath>
            <clipPath id="${bucketClipId}">
              <rect x="${padX}" y="${bucketTop}" width="${plotWidth}" height="${bucketHeight}" />
            </clipPath>
          </defs>
          <g clip-path="url(#${bucketClipId})">
            ${bucketRects}
          </g>
          <line x1="0" y1="${bucketTop}" x2="${width}" y2="${bucketTop}" stroke="var(--line)" stroke-width="1" />
          <g clip-path="url(#${chartClipId})">
            ${bucketBands}
            ${verticalLines}
            ${horizontalLines.join("")}
            ${bucketDividers}
            <polyline fill="none" stroke="var(--signal)" stroke-width="2.5" points="${polyline}" />
            ${dots}
          </g>
          ${labels}
          <g clip-path="url(#${bucketClipId})">
            ${bucketBoundaryLines}
          </g>
        </svg>
      __BT__;
    }

    function render(snapshot) {
      const html = snapshot.sensors.map((sensor) => __BT__
        <section class="sensor-panel">
          <div class="sensor-header">
            <div class="sensor-title-row">
              <h2>${sensor.sensor_id}</h2>
              <div class="sensor-meta">Power consumption sensor in the ${sensor.zone} zone</div>
            </div>
            <div class="latest">Latest: <strong>${fmt(sensor.latest?.value)}</strong> ${sensor.unit}</div>
          </div>
          <div class="plot-shell">
            <div class="bucket-row">${combinedSvgForSensor(sensor, snapshot.now, snapshot.window_ms)}</div>
          </div>
        </section>
      __BT__).join("");

      document.getElementById("sensors").innerHTML = html;
    }

    async function refresh() {
      const response = await fetch("/api/snapshot");
      if (!response.ok) {
        throw new Error(__BT__Request failed: ${response.status}__BT__);
      }
      const snapshot = await response.json();
      render(snapshot);
    }

    refresh().catch((error) => {
      document.getElementById("sensors").innerHTML = __BT__<pre>${error.message}</pre>__BT__;
    });

    setInterval(() => {
      refresh().catch((error) => console.error(error));
    }, 750);
  </script>
</body>
</html>
`

	template = strings.ReplaceAll(template, "__BT__", "`")
	template = strings.ReplaceAll(template, "__SAMPLE_INTERVAL__", fmt.Sprint(SampleIntervalMS))
	template = strings.ReplaceAll(template, "__WINDOW__", fmt.Sprint(WindowMS/1000))
	template = strings.ReplaceAll(template, "__BUCKET__", fmt.Sprint(BucketMS/1000))
	template = strings.ReplaceAll(template, "__RETENTION__", fmt.Sprint(RetentionMS/1000))
	template = strings.ReplaceAll(template, "__GRAPH_WIDTH__", fmt.Sprint(graphWidth))
	template = strings.ReplaceAll(template, "__GRAPH_HEIGHT__", fmt.Sprint(graphHeight))
	template = strings.ReplaceAll(template, "__GRAPH_PAD_X__", fmt.Sprint(graphPadX))
	template = strings.ReplaceAll(template, "__GRAPH_PAD_Y__", fmt.Sprint(graphPadY))

	return template
}

func escapedNotFound(path string) map[string]string {
	return map[string]string{
		"error": "Not found: " + html.EscapeString(path),
	}
}
