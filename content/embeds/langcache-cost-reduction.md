LangCache reduces your LLM costs by caching responses and avoiding repeated API calls. When a response is served from cache, you don’t pay for output tokens. Input token costs are typically offset by embedding and storage costs.

For every cached response, you'll save the output token cost. To calculate your monthly savings with LangCache, you can use the following formula:

```bash
Est. monthly savings with LangCache = 
    (Monthly output token costs) × (Cache hit rate)
```

The more requests you serve from LangCache, the more you save, because you’re not paying to regenerate the output.

Here’s an example:
- Monthly LLM spend: $200
- Percentage of output tokens in your spend: 60%
- Cost of output tokens: $200 × 60% = $120
- Cache hit rate: 50%
- Estimated savings: $120 × 50% = $60/month

{{<note>}}
The formula and numbers above provide a rough estimate of your monthly savings. Actual savings will vary depending on your usage.
{{</note>}}