# EXAMPLE: iris_agent_memory_summary_views
# HIDE_START
import time

from redis_iris.agent_memory import AgentMemory, models

OWNER_ID = "quickstart-user"

memory = AgentMemory.from_env()
# HIDE_END

# STEP_START summary-view-seed
memory.remember("The user is vegetarian and prefers spicy food.", owner=OWNER_ID)
memory.remember("The user wants to visit Tokyo and Kyoto next month.", owner=OWNER_ID)
# STEP_END

# STEP_START summary-view-create
view = memory.client.create_summary_view(
    name="example-travel-profile",
    source=models.SummaryViewSource.LONG_TERM,
    visibility=models.SummaryViewVisibility.PRIVATE,
    group_by=[],
    filter_={"owner_id": {"eq": OWNER_ID}},
    output={
        "format_": "TEXT",
        "instructions": "Summarize the travel preferences in these memories.",
    },
    refresh_policy={"mode": "MANUAL"},
)
view_id = view.view_id
print("View ID:", view_id, "owner:", repr(view.owner_id))
# STEP_END

# STEP_START summary-view-refresh
accepted = memory.client.refresh_summary_view(
    view_id=view_id, target=models.SummaryViewRefreshTarget.FULL,
)
print("Refresh accepted:", accepted.accepted)
# STEP_END

# STEP_START summary-view-result
Status = models.SummaryViewResultStatus
for _ in range(60):  # generation runs in the background
    result = memory.client.get_summary_view_result(
        view_id=view_id, include_source_memory_ids=True,
    )
    if result.status == Status.FAILED:
        raise RuntimeError(f"Refresh failed: {result.error_code}")
    if result.status == Status.EMPTY:
        print("No matching source memories.")
        break
    if result.status == Status.READY and not result.stale and result.value is not None:
        print(result.value.text)
        print(f"{result.summarized_memory_count} of {result.source_memory_count} memories,",
              "truncated:", result.truncated)
        break
    time.sleep(5)
else:
    raise TimeoutError(f"Continue polling view {view_id}")
# STEP_END

# STEP_START summary-view-update
updated = memory.client.update_summary_view(
    view_id=view_id, description="Travel preferences for trip planning.",
)
print(updated.name, "version", updated.definition_version)
for item in memory.client.list_summary_views(limit=20).items:
    print(item.view_id, item.name, item.state)
# STEP_END

# STEP_START summary-view-delete
memory.client.delete_summary_view(view_id=view_id)
# STEP_END
