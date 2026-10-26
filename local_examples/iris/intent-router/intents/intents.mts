// EXAMPLE: iris_intent_router_intents
// HIDE_START
import { IntentRouter } from "@redis-iris/intent-router";

const router = new IntentRouter({
  serverURL: process.env.INTENT_ROUTER_URL!,
  routerId: process.env.ROUTER_ID!,
  apiKey: process.env.INTENT_ROUTER_API_KEY!,
});
// HIDE_END

// STEP_START intent-upsert
const intent = await router.upsertIntent("refund", {
  description: "The customer wants their money back.",
  target: { type: "agent", ref: "billing-agent" },
  minScore: 0.75,
  metadata: { owner: "support" },
  examples: ["i want a refund", "refund my purchase"],
});
console.log(intent.name, intent.exampleCount, intent.revision);
// STEP_END

// STEP_START intents-bulk
await router.addIntents({
  intents: [
    { name: "track_order", examples: ["where is my order", "track my package"] },
    { name: "cancel_order", examples: ["cancel my order", "i changed my mind"] },
  ],
});
// STEP_END

// STEP_START intents-list
let cursor: string | undefined;
do {
  const page = await router.listIntents(50, cursor);
  for (const item of page.items) console.log(item.name, item.exampleCount);
  cursor = page.nextCursor;
} while (cursor);
// STEP_END

// STEP_START intent-patch
await router.updateIntent("refund", {
  minScore: null,
  target: { type: "agent", ref: "refunds-agent" },
});
// STEP_END

// STEP_START intent-conditional
const current = await router.getIntent("refund");
await router.upsertIntent("refund", {
  examples: ["i want a refund", "refund my purchase", "send my money back"],
  expectedRevision: current.revision,
});
// STEP_END

// STEP_START examples-add
const added = await router.addExamples("refund", {
  examples: ["send my money back", "i was charged twice"],
});
for (const example of added.items) console.log(example.exampleId, example.text);
// STEP_END

// STEP_START examples-list
const examples = await router.listExamples("refund", 50);
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
