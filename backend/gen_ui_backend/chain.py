from typing import List, Optional, TypedDict
import os
import csv
from pathlib import Path

from langchain.output_parsers.openai_tools import JsonOutputToolsParser
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.graph.graph import CompiledGraph

from gen_ui_backend.tools.laptops import laptop_product
from gen_ui_backend.tools.product_comparison import product_comparison
from gen_ui_backend.tools.product_tiles import product_tiles


# Define the path for the chat history file
backend_dir = Path(__file__).parent.parent
HISTORY_FILE_PATH = backend_dir / "chat_history.csv"
HISTORY_HEADERS = ["role", "content"]

# Load laptop catalog data
def load_laptop_catalog():
    backend_dir = Path(__file__).parent.parent
    catalog_path = backend_dir / "laptops" / "catalog.csv"
    
    try:
        with open(catalog_path, 'r') as file:
            reader = csv.DictReader(file)
            laptops = list(reader)
            
        # Format the laptop info for the prompt
        catalog_info = []
        for laptop in laptops:
            catalog_info.append(
                f"ID: {laptop['product_id']}, Name: {laptop['name']}, Brand: {laptop['brand']}, "
                f"CPU: {laptop['cpu_family']}, RAM: {laptop['ram_gb']}GB, Storage: {laptop['storage_gb']}GB {laptop['storage_type']}, "
                f"Screen: {laptop['screen_size_inches']}\" {laptop['screen_resolution']}, GPU: {laptop['graphics_card']}, "
                f"Price: {laptop['price']}"
            )
        
        return "\n".join(catalog_info)
    except Exception as e:
        return f"Error loading catalog data: {str(e)}"


# Load chat history from CSV
def load_chat_history() -> List:
    history = []
    if not HISTORY_FILE_PATH.is_file():
        # Create the file with headers if it doesn't exist
        with open(HISTORY_FILE_PATH, 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(HISTORY_HEADERS)
        return history # Return empty history as the file was just created

    try:
        with open(HISTORY_FILE_PATH, 'r', newline='') as file:
            reader = csv.DictReader(file)
            if reader.fieldnames != HISTORY_HEADERS:
                 # Handle case where headers are incorrect/missing
                 print(f"Warning: History file {HISTORY_FILE_PATH} has incorrect headers. Resetting.")
                 reset_chat_history() # Reset the file
                 return [] # Return empty history

            for row in reader:
                if row.get("role") == "human":
                    history.append(HumanMessage(content=row.get("content", "")))
                elif row.get("role") == "ai":
                    # Storing AI responses (including potential tool calls/results summaries)
                    # For simplicity, we store the content as is.
                    # More complex scenarios might require structured storage.
                    history.append(AIMessage(content=row.get("content", "")))
    except Exception as e:
        print(f"Error loading chat history: {str(e)}. Starting fresh.")
        # Optionally reset or just return empty list
        reset_chat_history()
        return []
    return history


# Append a message to the chat history CSV
def append_to_chat_history(role: str, content: str):
    try:
        # Ensure headers exist if file is empty or newly created
        if not HISTORY_FILE_PATH.is_file() or HISTORY_FILE_PATH.stat().st_size == 0:
             with open(HISTORY_FILE_PATH, 'w', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(HISTORY_HEADERS)

        with open(HISTORY_FILE_PATH, 'a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([role, content])
    except Exception as e:
        print(f"Error appending to chat history: {str(e)}")


# Function to reset/clear the chat history file
def reset_chat_history():
    try:
        with open(HISTORY_FILE_PATH, 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(HISTORY_HEADERS) # Write only headers
        print(f"Chat history reset: {HISTORY_FILE_PATH}")
    except Exception as e:
        print(f"Error resetting chat history: {str(e)}")


# Load the catalog data
LAPTOP_CATALOG = load_laptop_catalog()

# Consistent system prompt for all interactions
SYSTEM_PROMPT = (
    "You are a helpful laptop shopping assistant focused on understanding user needs and providing a guided, visual shopping experience. "
    "Your primary goal is to use tools to present information and recommendations, creating a generative UI interaction whenever possible. Focus on how laptop features benefit the user rather than just listing specs. Use the provided laptop catalog to find relevant Product IDs for tool usage.\\n"
    "You have these tools:\\n"
    "1. `laptop-product`: Use to show detailed information about a *single* specific laptop. "
    "   - Input: Requires a `product_id` (int) corresponding to a laptop in the catalog. "
    "   - Usage: Call this when the user asks about a specific laptop model or expresses strong interest in one you've previously shown.\\n"
    "2. `product-comparison`: Use to compare *two* specific laptops side-by-side. "
    "   - Input: Requires `product_id_1` (int) and `product_id_2` (int) for the two laptops to compare. "
    "   - Usage: Call this when the user asks to compare two specific models or wants to see the differences between two options you've presented.\\n"
    "3. `product-tiles`: Use to display *one or more* laptops as a grid of tiles. "
    "   - Input: Requires `product_ids` (a *list* of ints) for the laptops to display. Optionally accepts a `title` (string) for the tile grid (default: 'Recommended Products'). "
    "   - Usage: Call this *proactively* when the user expresses general needs (e.g., 'laptops for gaming', 'budget options', 'laptops under $1000', 'school work laptops'). Select 1-5 relevant product IDs from the catalog based on their query and use this tool to show them.\\\\n"
    "Core Interaction Guidelines:\\\\n"
    "- **Tool-First Approach:** You *must* prioritize using tools. Almost every interaction should involve calling a tool to display laptop information, comparisons, or recommendations. Plain text responses are reserved *only* for queries completely unrelated to laptops or shopping.\\\\n"
    "- **Identify Product IDs:** Before calling a tool, identify the correct `product_id`(s) from the provided catalog based on the user\'s request or your recommendation.\\\\n"
    "- **Proactive Recommendations:** When users state needs (e.g., \'gaming\', \'budget\', \'school work\'), identify suitable laptops from the catalog and *immediately* use `product-tiles` with their `product_ids` to show curated options.\\\\n"
    "- **Detailed Views:** When discussing a specific laptop (e.g., user asks \'tell me more about the XPS 13\'), find its `product_id` and *always* use the `laptop-product` tool.\\\\n"
    "- **Comparisons:** For comparing two specific options, find their `product_ids` and *always* use the `product-comparison` tool.\\\\n"
    "- **Guiding Questions:** Ask clarifying questions about use case, budget, and preferences to better select relevant product IDs for tool-based recommendations.\\\\n"
    "- **Benefit-Oriented:** Explain *why* a recommended laptop (shown via a tool) is a good fit for the user\'s specific needs.\\\\n"
    "- **Minimize Text Specs:** Rely on the tools to present specifications; your text should focus on context, benefits, and guidance.\\\\n"
    "- **Use Markdown:** Use light markdown (like `**bold**` for emphasis or `-` for lists) to format your text responses clearly. Use double line breaks (paragraphs and sentences) to structure longer responses for better readability.\\\\n"
    "Remember: Your default action is to call a tool using the correct Product ID(s) from the catalog. Even if the user doesn\'t explicitly ask, find the most relevant tool and IDs to enhance the conversation and visually guide the user towards the best laptop choice. You can provide explanatory text *after* the tool results are processed."
)

FINAL_RESPONSE_SYSTEM_PROMPT = (
    "You are a helpful laptop shopping assistant. A tool has just presented information to the user (e.g., product details, comparison, recommendations). "
    "Your task is to provide a concise, **benefit-focused** textual response that connects the user's query, the chat history, and the information just displayed by the tool. Your goal is to help the user understand the information in the context of their needs and guide them forward.\\n"
    "Instructions:\\n"
    "- Review the chat history, the user's original input, and the preceding AI message which describes the tool action and its results.\\n"
    "- Briefly acknowledge the information presented via the tool (e.g., 'Okay, I've pulled up the details for that laptop...' or 'Here's the comparison you asked for...').\\n"
    "- Explain the **significance** of the tool's output in relation to the user's stated needs or query. **Focus on the benefits** of the features shown, not just the specs.\\n"
    "- Guide the user on potential next steps (e.g., 'Does this look like a good fit?', 'Would you like to compare it to another model?', 'What other features are important to you?') or ask relevant clarifying questions based on the current context.\\\\n"
    "- Maintain a helpful, conversational, and **benefit-focused** tone throughout.\\\\n"
    "- **Use Markdown:** Use light markdown (like `**bold**` for emphasis or `-` for lists) to format your response clearly. Use double line breaks (paragraphs and sentences) to structure longer responses for better readability.\\\\n"
    "- **Do not suggest using tools or attempt to call any tools yourself.** Your role here is purely to provide a textual summary and guidance based on the *already executed* tool action.\\\\n"
    "- Keep the response relevant and avoid simply repeating raw data already visible in the tool output. Focus on **interpretation, benefits, and next steps**."
)


class GenerativeUIState(TypedDict, total=False):
    input: HumanMessage
    result: Optional[str]
    """Plain text response if no tool was used."""
    tool_calls: Optional[List[dict]]
    """A list of parsed tool calls."""
    tool_result: Optional[dict]
    """The result of a tool call."""
    final_response: Optional[str]
    """Final response after tool results are processed."""


def invoke_model(state: GenerativeUIState, config: RunnableConfig) -> GenerativeUIState:
    tools_parser = JsonOutputToolsParser()
    # Load existing chat history
    history = load_chat_history()

    # Get the current user input message(s)
    current_input_messages = state["input"]
    if not isinstance(current_input_messages, list):
         # Ensure input is always a list for consistent handling
         current_input_messages = [current_input_messages]

    # Append current user input to history file *before* invoking the model
    # Assuming the last message in the list is the newest user input
    last_user_message = current_input_messages[-1]
    if isinstance(last_user_message, HumanMessage):
        append_to_chat_history("human", str(last_user_message.content))
    else:
         # Handle cases where input might not be HumanMessage directly (if structure changes)
         print(f"Warning: Unexpected input type for history logging: {type(last_user_message)}")
         append_to_chat_history("human", str(last_user_message)) # Log string representation


    initial_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                SYSTEM_PROMPT + "\n\n"
                + "Here's the current catalog of available laptops:\n"
                + f"{LAPTOP_CATALOG}",
            ),
            # Combine loaded history with the current input from the state
            *history,
            MessagesPlaceholder("input"),
        ]
    )
    model = ChatOpenAI(model="gpt-4.1-2025-04-14", temperature=0, streaming=True)
    tools = [laptop_product, product_comparison, product_tiles]
    model_with_tools = model.bind_tools(tools)
    chain = initial_prompt | model_with_tools
    result = chain.invoke({"input": state["input"]}, config)

    if not isinstance(result, AIMessage):
        raise ValueError("Invalid result from model. Expected AIMessage.")

    if isinstance(result.tool_calls, list) and len(result.tool_calls) > 0:
        parsed_tools = tools_parser.invoke(result, config)
        # Log AI response (tool call intent)
        append_to_chat_history("ai", f"Tool Calls: {parsed_tools}")
        return {"tool_calls": parsed_tools}
    else:
        # Log AI response (text)
        append_to_chat_history("ai", str(result.content))
        return {"result": str(result.content)}


def invoke_tools_or_return(state: GenerativeUIState) -> str:
    if "result" in state and isinstance(state["result"], str):
        return END
    elif "tool_calls" in state and isinstance(state["tool_calls"], list):
        return "invoke_tools"
    else:
        raise ValueError("Invalid state. No result or tool calls found.")


def invoke_tools(state: GenerativeUIState) -> GenerativeUIState:
    tools_map = {
        "laptop-product": laptop_product,
        "product-comparison": product_comparison,
        "product-tiles": product_tiles,
    }

    if state["tool_calls"] is not None:
        tool = state["tool_calls"][0]
        selected_tool = tools_map[tool["type"]]
        return {"tool_result": selected_tool.invoke(tool["args"])}
    else:
        raise ValueError("No tool calls found in state.")


def generate_final_response(state: GenerativeUIState, config: RunnableConfig) -> GenerativeUIState:
    """
    Generates a final response based on the tool results and original user query.
    """
    if "tool_result" not in state or state["tool_result"] is None:
        # If no tool was run, the response was likely generated directly by invoke_model
        # and logged there. Return early.
        # Ensure final_response is explicitly set to None or an empty string if expected downstream
        return {"final_response": None}

    # Load existing chat history
    history = load_chat_history()

    # Get the tool type and result
    tool_type = state["tool_calls"][0]["type"] if state["tool_calls"] and state["tool_calls"][0] else "unknown tool"
    tool_result = state["tool_result"]
    # tool_args = state["tool_calls"][0]["args"] if state["tool_calls"] and state["tool_calls"][0] else {} # Args might not be needed for the final summary prompt

    # Create a user-friendly description of the tool result for context
    tool_description = ""
    if tool_type == "laptop-product":
        product_name = tool_result.get("name", "the laptop") if isinstance(tool_result, dict) else "the laptop"
        tool_description = f"detailed information about {product_name}"
    elif tool_type == "product-comparison":
        product1_name = "first laptop"
        product2_name = "second laptop"
        if isinstance(tool_result, dict):
            product1_name = tool_result.get("product1", {}).get("name", "first laptop")
            product2_name = tool_result.get("product2", {}).get("name", "second laptop")
        tool_description = f"a comparison between {product1_name} and {product2_name}"
    elif tool_type == "product-tiles":
        title = "products"
        count = 0
        if isinstance(tool_result, dict):
            title = tool_result.get("title", "products")
            count = len(tool_result.get("products", []))
        tool_description = f"a display of {count} laptop products titled '{title}'"
    else:
        tool_description = "some information using a tool"

    tool_context_message = AIMessage(
        content=f"Context: I previously invoked a tool to show the user {tool_description}. The raw result of that tool call was: {tool_result}"
    )

    # Construct the prompt messages using the new system prompt
    system_message = ("system", FINAL_RESPONSE_SYSTEM_PROMPT)

    model = ChatOpenAI(model="gpt-4.1-2025-04-14", temperature=0, streaming=True)

    # Combine history, original input, and tool context
    current_input_messages = state["input"] if isinstance(state["input"], list) else [state["input"]]

    messages = [
        system_message,
        # History should contain the original user message that led to the tool call,
        # and potentially the AI message that decided to call the tool.
        *history,
        # Re-include the original user input for full context if not adequately captured in history
        # *current_input_messages, # This might be redundant if history logging is correct
        tool_context_message # Add the AI message describing tool action/results
    ]

    # Use ChatPromptTemplate for consistency
    final_prompt = ChatPromptTemplate.from_messages(messages)

    chain = final_prompt | model
    # Pass an empty dict for invoke since the necessary context is built into the messages list
    result = chain.invoke({}, config=config)

    if not isinstance(result, AIMessage):
        raise ValueError("Invalid result from model. Expected AIMessage.")

    final_content = str(result.content)
    # Log the final AI response generated after tool execution
    append_to_chat_history("ai", final_content)

    return {"final_response": final_content}


def after_tools_routing(state: GenerativeUIState) -> str:
    """Determines what happens after tools are invoked."""
    if "tool_result" in state and state["tool_result"] is not None:
        return "generate_final_response"
    return END


def create_graph() -> CompiledGraph:
    workflow = StateGraph(GenerativeUIState)

    workflow.add_node("invoke_model", invoke_model)  # type: ignore
    workflow.add_node("invoke_tools", invoke_tools)
    workflow.add_node("generate_final_response", generate_final_response)
    
    workflow.add_conditional_edges("invoke_model", invoke_tools_or_return)
    workflow.add_conditional_edges("invoke_tools", after_tools_routing)
    workflow.add_edge("generate_final_response", END)
    
    workflow.set_entry_point("invoke_model")
    
    graph = workflow.compile()
    return graph
