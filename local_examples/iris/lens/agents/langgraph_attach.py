# EXAMPLE: iris_lens_langgraph_attach
from langchain_openai import ChatOpenAI
from langgraph.graph import START, MessagesState, StateGraph

from redis_iris import lens

lens.init(agent_id="support-bot")
model = ChatOpenAI(model="gpt-4o-mini")


def assistant(state: MessagesState):
    return {"messages": [model.invoke(state["messages"])]}


graph = StateGraph(MessagesState)
graph.add_node("assistant", assistant)
graph.add_edge(START, "assistant")

# STEP_START langgraph_attach
from redis_iris import AgentMemory
from redis_iris.integrations.langgraph import attach

memory = AgentMemory.from_env()
app = attach(memory, graph).compile()

result = app.invoke(
    {"messages": [("user", "Where can I see my refund status?")]},
    {"configurable": {"user_id": "user-1042", "thread_id": "thread-1"}},
)
# STEP_END

print(result["messages"][-1].content)
lens.shutdown()
