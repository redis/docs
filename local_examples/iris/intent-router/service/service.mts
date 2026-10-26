// EXAMPLE: iris_intent_router_service
// HIDE_START
import { IntentRouterService } from "@redis-iris/intent-router";

const service = new IntentRouterService({
  serverURL: process.env.IRIS_INTENT_ROUTER_SERVICE_URL!,
  token: process.env.IRIS_INTENT_ROUTER_SERVICE_TOKEN!,
});
// HIDE_END

// STEP_START models-list
const models = await service.listModels("EMBEDDING");
for (const model of models.items) {
  console.log(model.provider, model.model, model.dimensions, model.authorization);
}
// STEP_END

// STEP_START router-create
const created = await service.createRouter({
  name: "support-router",
  description: "Routes support requests to tools and agents.",
  template: "AGENT",
  minScore: 0.7,
  vectorSpace: {
    provider: models.items[0].provider,
    model: models.items[0].model,
    dimensions: models.items[0].dimensions,
  },
});
const routerId = created.routerId;
console.log(routerId, created.state);
// STEP_END

// STEP_START router-wait
let router = await service.getRouter(routerId);
while (router.state === "PROVISIONING") {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  router = await service.getRouter(routerId);
}
if (router.state !== "READY") throw new Error(router.failureReason);
// STEP_END

// STEP_START router-list
const routers = await service.listRouters();
for (const item of routers.items) console.log(item.routerId, item.name, item.state);
// STEP_END

// STEP_START router-update
await service.updateRouter(routerId, { minScore: 0.75, expectedRevision: router.revision });
// STEP_END

// STEP_START router-suspend
await service.updateRouter(routerId, { state: "SUSPENDED" });
await service.updateRouter(routerId, { state: "READY" });
// STEP_END

// STEP_START router-delete
await service.deleteRouter(routerId);
// STEP_END
