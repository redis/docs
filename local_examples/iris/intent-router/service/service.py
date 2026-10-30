# EXAMPLE: iris_intent_router_service
# HIDE_START
from redis_iris.intent_router import IntentRouter

service = IntentRouter.from_env().service
# HIDE_END

# STEP_START models-list
models = service.list_models(purpose="EMBEDDING").result.items
for model in models:
    print(model.provider, model.model, model.dimensions, model.authorization)
# STEP_END

# STEP_START router-create
created = service.create_router(
    name="support-router",
    description="Routes support requests to tools and agents.",
    template="AGENT",
    min_score=0.7,
    vector_space={
        "provider": models[0].provider,
        "model": models[0].model,
        "dimensions": models[0].dimensions,
    },
).result
router_id = created.router_id
print(router_id, created.state, created.revision)
# STEP_END

# STEP_START router-wait
import time

router = service.get_router(router_id=router_id).result
while router.state == "PROVISIONING":
    time.sleep(1)
    router = service.get_router(router_id=router_id).result
print(router.router_id, router.state, router.failure_reason)
if router.state != "READY":
    raise SystemExit(1)
# STEP_END

# STEP_START router-list
for item in service.list_routers().result.items:
    print(item.router_id, item.name, item.state)
# STEP_END

# STEP_START router-update
updated = service.update_router(
    router_id=router_id, min_score=0.75, expected_revision=router.revision
).result
print(updated.router_id, updated.min_score, updated.revision)
# STEP_END

# STEP_START router-suspend
for state in ("SUSPENDED", "READY"):
    changed = service.update_router(router_id=router_id, state=state).result
    print(changed.router_id, changed.state)
# STEP_END

# STEP_START router-delete
deleted = service.delete_router(router_id=router_id).result
if deleted:
    print(deleted.router_id, deleted.state)
# STEP_END
