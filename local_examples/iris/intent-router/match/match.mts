// EXAMPLE: iris_intent_router_match
// HIDE_START
import { IntentRouter } from "@redis-iris/intent-router";

const router = new IntentRouter({
  serverURL: process.env.INTENT_ROUTER_URL!,
  routerId: process.env.ROUTER_ID!,
  apiKey: process.env.INTENT_ROUTER_API_KEY!,
});

function callTool(ref: string, args: Record<string, unknown>) {
  console.log("calling", ref, args);
}
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
async function route(query: string) {
  const { items } = await router.match({ query });
  if (items.length === 0) return null; // no intent is close enough: use a default path
  const top = items[0];
  if (top.target?.type === "tool") {
    return callTool(top.target.ref, top.target.args ?? {});
  }
  return top.name;
}
// STEP_END

// STEP_START match-tune
const candidates = await router.match({ query: "i need help", minScore: 0 });
for (const item of candidates.items) console.log(item.name, item.score.toFixed(2));
// STEP_END
