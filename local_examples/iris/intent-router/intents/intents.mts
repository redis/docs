// EXAMPLE: iris_intent_router_intents
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
// HIDE_END

// STEP_START intent-upsert
const { result: intent } = await router.upsertIntent("refund", undefined, undefined, {
  description: "The customer wants their money back.",
  target: { type: "agent", ref: "billing-agent" },
  minScore: 0.75,
  metadata: { owner: "support" },
  examples: ["i want a refund", "refund my purchase"],
});
console.log(intent.name, intent.exampleCount, intent.revision);
// STEP_END

// STEP_START intents-bulk
const { result } = await router.addIntents({
  intents: [
    { name: "track_order", examples: ["where is my order", "track my package"] },
    { name: "cancel_order", examples: ["cancel my order", "i changed my mind"] },
  ],
});
for (const item of result.items) console.log(item.name, item.exampleCount);
// STEP_END

// STEP_START intents-list
const { result: page } = await router.listIntents(50);
for (const item of page.items) console.log(item.name, item.exampleCount);
console.log("next cursor:", page.nextCursor);
// STEP_END

// STEP_START intent-patch
const { result: patched } = await router.updateIntent("refund", undefined, {
  minScore: null,
  target: { type: "agent", ref: "refunds-agent" },
});
console.log(patched.name, patched.target, patched.minScore, patched.revision);
// STEP_END

// STEP_START intent-conditional
const { result: current } = await router.getIntent("refund");
const { result: changed } = await router.updateIntent("refund", undefined, {
  description: "The customer wants a refund or a chargeback reversed.",
  expectedRevision: current.revision,
});
console.log(changed.name, changed.revision);
// STEP_END

// STEP_START examples-add
const { result: added } = await router.addExamples("refund", {
  examples: ["send my money back", "i was charged twice"],
});
for (const example of added.items) console.log(example.exampleId, example.text);
// STEP_END

// STEP_START examples-list
const { result: examples } = await router.listExamples("refund", 50);
for (const example of examples.items) console.log(example.exampleId, example.text);
// STEP_END

// STEP_START example-delete
await router.deleteExample("refund", examples.items[0].exampleId);
// STEP_END

// STEP_START intent-delete
await router.deleteIntent("cancel_order");
// STEP_END

// STEP_START router-clear
await router.clear({ scope: "INTENTS" });
// STEP_END
