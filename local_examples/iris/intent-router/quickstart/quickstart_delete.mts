// EXAMPLE: iris_intent_router_quickstart_delete
// HIDE_START
import { IntentRouter } from "@redis-iris/intent-router";

const router = new IntentRouter({
  serverURL: process.env.INTENT_ROUTER_URL!,
  routerId: process.env.ROUTER_ID!,
  apiKey: process.env.INTENT_ROUTER_API_KEY!,
});
// HIDE_END

// STEP_START intents-delete
for (const name of ["track_order", "refund"]) {
  await router.deleteIntent(name);
}
// STEP_END
