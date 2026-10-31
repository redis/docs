// EXAMPLE: iris_intent_router_service
// HIDE_START
import { IntentRouterService } from "@redis-iris/intent-router";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

const service = new IntentRouterService({
  serverURL: requiredEnv("IRIS_INTENT_ROUTER_SERVICE_URL"),
  token: requiredEnv("IRIS_INTENT_ROUTER_SERVICE_TOKEN"),
  retryConfig: { strategy: "none" },
});
// HIDE_END

// STEP_START models-list
const { result: models } = await service.listModels("EMBEDDING");
for (const model of models.items) {
  console.log(model.provider, model.model, model.dimensions, model.authorization);
}
// STEP_END

// STEP_START router-create
const [embedding] = models.items;
if (!embedding?.dimensions) throw new Error("No embedding model is offered");
const { result: created } = await service.createRouter({
  name: "support-router",
  description: "Routes support requests to tools and agents.",
  template: "AGENT",
  minScore: 0.7,
  vectorSpace: {
    provider: embedding.provider,
    model: embedding.model,
    dimensions: embedding.dimensions,
  },
});
const routerId = created.routerId;
console.log(routerId, created.state, created.revision);
// STEP_END

// STEP_START router-wait
let router = (await service.getRouter(routerId)).result;
while (router.state === "PROVISIONING") {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  router = (await service.getRouter(routerId)).result;
}
console.log(router.routerId, router.state, router.failureReason);
if (router.state !== "READY") process.exit(1);
// STEP_END

// STEP_START router-list
const { result: routers } = await service.listRouters();
for (const item of routers.items) console.log(item.routerId, item.name, item.state);
// STEP_END

// STEP_START router-update
const { result: updated } = await service.updateRouter(routerId, undefined, {
  minScore: 0.75,
  expectedRevision: router.revision,
});
console.log(updated.routerId, updated.minScore, updated.revision);
// STEP_END

// STEP_START router-suspend
for (const state of ["SUSPENDED", "READY"] as const) {
  const { result: changed } = await service.updateRouter(routerId, undefined, { state });
  console.log(changed.routerId, changed.state);
}
// STEP_END

// STEP_START router-delete
const deleted = (await service.deleteRouter(routerId))?.result;
if (deleted) console.log(deleted.routerId, deleted.state);
// STEP_END
