# EXAMPLE: iris_lens_iris_products
# STEP_START iris_products_turn
from redis_iris import Iris, lens, workflows
from redis_iris.hooks import stack

lens.init(agent_id="support-bot")

iris = Iris.from_env()
memory = iris.agent_memory(assistant_id="support-bot")
playbook = iris.agent_playbooks()
gateway = iris.context_gateway()

hooks = stack(memory.hooks(), playbook.disclosure(audience="support"))


def run_agent(context, message, tools):
    # Your model and tool loop goes here. It receives the Iris context and tools.
    return "Your refund was issued on May 2."


def handle(owner, message, thread_id):
    with lens.turn(thread_id, user_id=owner) as outer:
        with workflows.turn(hooks, message, owner=owner, session=thread_id) as turn:
            tools = [*gateway.model_tools(), *hooks.tools()]
            answer = run_agent(turn.context, message, tools)
            turn.record(answer)
        outer.set_outcome("completed")
    return answer


print(handle("user-1042", "Where can I see my refund status?", "thread-1"))
# STEP_END

lens.shutdown()
