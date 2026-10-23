# EXAMPLE: iris_lens_langgraph
# STEP_START langgraph_turn
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
app = graph.compile()

thread_id = "thread-1"
with lens.turn(thread_id, user_id="user-1042") as turn:
    result = app.invoke(
        {"messages": [("user", "Where can I see my refund status?")]},
        {"configurable": {"thread_id": thread_id}},
    )
    turn.set_outcome("completed")

print(result["messages"][-1].content)
# STEP_END

lens.shutdown()
