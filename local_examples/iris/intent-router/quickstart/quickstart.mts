// EXAMPLE: iris_intent_router_quickstart
// STEP_START router-connect
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
console.log(await router.getRouterHealth());
// STEP_END

// STEP_START intents-create
for (const intent of [
  await router.upsertIntent("track_order", {
    description: "The customer wants to know where an order is.",
    target: { type: "tool", ref: "orders.track", args: { region: "eu" } },
    examples: ["where is my order", "track my package", "has my parcel shipped"],
  }),
  await router.upsertIntent("refund", {
    examples: ["i want a refund", "refund my purchase", "i would like my money back"],
  }),
]) {
  console.log(intent.name, intent.exampleCount, intent.revision);
}
// STEP_END

// STEP_START match-query
for (const query of ["where is my order please", "i would like my money back", "zzz qqq"]) {
  const { items } = await router.match({ query });
  if (items.length > 0) {
    console.log(query, "->", items[0].name, items[0].score.toFixed(2), items[0].target);
  } else {
    console.log(query, "-> no match");
  }
}
// STEP_END

// STEP_START examples-add
const added = await router.addExamples("track_order", {
  examples: ["when will my delivery arrive"],
});
for (const example of added.items) console.log(example.exampleId, example.text);
// STEP_END

// STEP_START intent-update
const updated = await router.updateIntent("track_order", { minScore: 0.8 });
console.log(updated.name, updated.minScore, updated.revision);
// STEP_END
