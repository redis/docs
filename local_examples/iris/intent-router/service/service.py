# EXAMPLE: iris_intent_router_service
# HIDE_START
from redis_iris.intent_router import IntentRouter

service = IntentRouter.from_env().service
# HIDE_END

# STEP_START models-list
models = service.list_models(purpose="EMBEDDING").items
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
)
router_id = created.router_id
print(router_id, created.state)
# STEP_END

# STEP_START router-wait
import time

router = service.get_router(router_id=router_id)
while router.state == "PROVISIONING":
    time.sleep(1)
    router = service.get_router(router_id=router_id)
if router.state != "READY":
    raise RuntimeError(router.failure_reason)
# STEP_END

# STEP_START router-list
for item in service.list_routers().items:
    print(item.router_id, item.name, item.state)
# STEP_END

# STEP_START router-update
service.update_router(router_id=router_id, min_score=0.75, expected_revision=router.revision)
# STEP_END

# STEP_START router-suspend
service.update_router(router_id=router_id, state="SUSPENDED")
service.update_router(router_id=router_id, state="READY")
# STEP_END

# STEP_START router-delete
service.delete_router(router_id=router_id)
# STEP_END
