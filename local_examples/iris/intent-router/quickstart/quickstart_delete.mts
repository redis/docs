// EXAMPLE: iris_intent_router_quickstart_delete
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

// STEP_START intents-delete
for (const name of ["track_order", "refund"]) {
  await router.deleteIntent(name);
}
// STEP_END
