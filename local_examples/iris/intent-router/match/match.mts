// EXAMPLE: iris_intent_router_match
// HIDE_START
import { IntentRouter } from "@redis-iris/intent-router";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

const router = new IntentRouter({
  serverURL: requiredEnv("IRIS_INTENT_ROUTER_URL"),
  routerId: requiredEnv("IRIS_INTENT_ROUTER_ID"),
  apiKey: requiredEnv("IRIS_INTENT_ROUTER_API_KEY"),
  retryConfig: { strategy: "none" },
});
await router.upsertIntent("track_order", {
  description: "The customer wants to know where an order is.",
  target: { type: "tool", ref: "orders.track", args: { region: "eu" } },
  examples: ["where is my order", "track my package", "has my parcel shipped"],
});
await router.upsertIntent("refund", {
  examples: ["i want a refund", "refund my purchase", "i would like my money back"],
});
// HIDE_END

// STEP_START match-options
const result = await router.match({
  query: "where is my order please",
  limit: 3,
  minScore: 0.6,
});
for (const item of result.items) console.log(item.name, item.score, item.target);
// STEP_END

// STEP_START match-dispatch
async function route(query: string): Promise<string> {
  const { items } = await router.match({ query });
  if (items.length === 0) return "no intent is close enough: use a default path";
  const top = items[0];
  if (!top.target) return `none ${top.name}`;
  return `${top.target.type} ${top.target.ref}`;
}

console.log(await route("where is my order please"));
// STEP_END

// STEP_START match-tune
const candidates = await router.match({ query: "i need help", minScore: 0 });
for (const item of candidates.items) console.log(item.name, item.score.toFixed(2));
// STEP_END
