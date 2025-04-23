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

from gen_ui_backend.tools.product_details import product_details
from gen_ui_backend.tools.product_comparison import product_comparison
from gen_ui_backend.tools.product_tiles import product_tiles
from gen_ui_backend.config import (
    CATALOG_PATH, 
    PRODUCT_TYPE, 
    get_system_prompt, 
    get_final_response_system_prompt
)


# Define the path for the chat history file
backend_dir = Path(__file__).parent.parent
HISTORY_FILE_PATH = backend_dir / "chat_history.csv"
HISTORY_HEADERS = ["role", "content"]

# Define the initial AI message
INITIAL_AI_MESSAGE_CONTENT = f"Welcome! I'm your helpful {PRODUCT_TYPE} shopping assistant. How can I help you find the perfect {PRODUCT_TYPE} today?"
INITIAL_AI_MESSAGE = AIMessage(content=INITIAL_AI_MESSAGE_CONTENT)

# Load product catalog data
def load_product_catalog():
    try:
        with open(CATALOG_PATH, 'r') as file:
            reader = csv.DictReader(file)
            products = list(reader)
            
        # Format the product info for the prompt
        # This needs to be dynamic based on the available fields in the catalog
        catalog_info = []
        
        for product in products:
            # Get all fields from the product dictionary
            product_info = [f"ID: {product['product_id']}"]
            
            # Add all other fields except product_id (which we already added)
            for key, value in product.items():
                if key != 'product_id':
                    product_info.append(f"{key}: {value}")
            
            # Join the fields with commas
            catalog_info.append(", ".join(product_info))
        
        return "\n".join(catalog_info)
    except Exception as e:
        return f"Error loading catalog data: {str(e)}"


# Load chat history from CSV
def load_chat_history() -> List:
    history = []
    if not HISTORY_FILE_PATH.is_file() or HISTORY_FILE_PATH.stat().st_size == 0:
        # Create the file with headers and initial AI message if it doesn't exist or is empty
        try:
            with open(HISTORY_FILE_PATH, "w", newline="") as file:
                writer = csv.writer(file)
                writer.writerow(HISTORY_HEADERS)
                writer.writerow(["ai", INITIAL_AI_MESSAGE_CONTENT])
            # Return only the initial AI message for a new session
            return [INITIAL_AI_MESSAGE]
        except Exception as e:
             print(f"Error creating initial history file: {str(e)}. Returning empty history.")
             return []

    try:
        with open(HISTORY_FILE_PATH, "r", newline="") as file:
            reader = csv.DictReader(file)
            if reader.fieldnames != HISTORY_HEADERS:
                 # Handle case where headers are incorrect/missing
                 print(f"Warning: History file {HISTORY_FILE_PATH} has incorrect headers. Resetting.")
                 reset_chat_history() # This will reset and add the initial message
                 return [INITIAL_AI_MESSAGE] # Return the initial message after reset

            rows = list(reader)
            # Check if the file only contains headers (or less), implying it was reset/corrupted somehow
            # Or if the first message isn't the expected initial AI message
            if not rows or (rows[0].get("role") != "ai" or rows[0].get("content") != INITIAL_AI_MESSAGE_CONTENT):
                 print(f"Warning: History file {HISTORY_FILE_PATH} seems incomplete or missing initial message. Resetting.")
                 reset_chat_history() # Reset to ensure initial message consistency
                 return [INITIAL_AI_MESSAGE]

            # Build history from rows, skipping the first row if it's the initial AI message
            # The initial message is handled implicitly by the frontend or initial state
            # Update: No, the history passed to the LLM needs the full context including the initial message.
            for row in rows:
                if row.get("role") == "human":
                    history.append(HumanMessage(content=row.get("content", "")))
                elif row.get("role") == "ai":
                    history.append(AIMessage(content=row.get("content", "")))

    except Exception as e:
        print(f"Error loading chat history: {str(e)}. Resetting history.")
        reset_chat_history() # Reset on error
        return [INITIAL_AI_MESSAGE] # Return initial message after reset

    # If history loaded successfully but is somehow empty (should not happen with checks above), return initial
    if not history:
        return [INITIAL_AI_MESSAGE]

    return history


# Append a message to the chat history CSV
def append_to_chat_history(role: str, content: str):
    # Prevent appending the initial AI message redundantly
    if role == "ai" and content == INITIAL_AI_MESSAGE_CONTENT:
        # Check if the file already contains this exact message as the first message
        try:
            if HISTORY_FILE_PATH.is_file() and HISTORY_FILE_PATH.stat().st_size > 0:
                 with open(HISTORY_FILE_PATH, "r", newline="") as file:
                    reader = csv.reader(file)
                    header = next(reader, None) # Skip header
                    first_message = next(reader, None)
                    if first_message and first_message == ["ai", INITIAL_AI_MESSAGE_CONTENT]:
                        # print("Skipping redundant append of initial AI message.") # Debugging line
                        return # Don't append if it's already the first message
        except Exception as e:
             print(f"Error checking history before append: {str(e)}")
             # Proceed with append if check fails, might lead to duplicates in rare cases

    try:
        # Ensure headers exist if file is empty or newly created (shouldn't be needed with load_chat_history changes)
        # Mode 'a' will create the file if it doesn't exist, but load_chat_history should handle the initial state.
        # We still need headers if somehow the file exists but is empty after load_chat_history ran? Unlikely.
        # Adding a check just in case.
        needs_headers = not HISTORY_FILE_PATH.is_file() or HISTORY_FILE_PATH.stat().st_size == 0

        with open(HISTORY_FILE_PATH, "a", newline="") as file:
            writer = csv.writer(file)
            if needs_headers:
                writer.writerow(HISTORY_HEADERS)
                # If we are writing headers, it implies the file was empty,
                # so we should also write the initial AI message IF the message
                # being appended isn't the initial one itself.
                if not (role == "ai" and content == INITIAL_AI_MESSAGE_CONTENT):
                    writer.writerow(["ai", INITIAL_AI_MESSAGE_CONTENT])

            writer.writerow([role, content])
    except Exception as e:
        print(f"Error appending to chat history: {str(e)}")


# Function to reset/clear the chat history file
def reset_chat_history():
    try:
        with open(HISTORY_FILE_PATH, "w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(HISTORY_HEADERS) # Write headers
            writer.writerow(["ai", INITIAL_AI_MESSAGE_CONTENT]) # Write initial AI message
        print(f"Chat history reset: {HISTORY_FILE_PATH}")
    except Exception as e:
        print(f"Error resetting chat history: {str(e)}")


# Load the catalog data
PRODUCT_CATALOG = load_product_catalog()


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
                get_system_prompt() + "\n\n"
                + f"Here's the current catalog of available {PRODUCT_TYPE}:\n"
                + f"{PRODUCT_CATALOG}",
            ),
            # Combine loaded history with the current input from the state
            *history,
            MessagesPlaceholder("input"),
        ]
    )
    model = ChatOpenAI(model="gpt-4.1-2025-04-14", temperature=0, streaming=True)
    tools = [product_details, product_comparison, product_tiles]
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
        "product-details": product_details,
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

    # Create a user-friendly description of the tool result for context
    tool_description = ""
    marketing_content = ""
    
    if tool_type == "product-details":
        product_name = tool_result.get("name", f"the {PRODUCT_TYPE} item") if isinstance(tool_result, dict) else f"the {PRODUCT_TYPE} item"
        tool_description = f"detailed information about {product_name}"
        # Include marketing content if available
        if isinstance(tool_result, dict) and "marketing_content" in tool_result and tool_result["marketing_content"]:
            marketing_content = f"\n\nMarketing Content for {product_name}:\n{tool_result['marketing_content']}"
    elif tool_type == "product-comparison":
        product1_name = f"first {PRODUCT_TYPE} item"
        product2_name = f"second {PRODUCT_TYPE} item"
        if isinstance(tool_result, dict):
            if "product1" in tool_result and isinstance(tool_result["product1"], dict):
                product1_name = tool_result["product1"].get("name", f"first {PRODUCT_TYPE} item")
                # Include marketing content for product 1 if available
                if "marketing_content" in tool_result["product1"] and tool_result["product1"]["marketing_content"]:
                    marketing_content += f"\n\nMarketing Content for {product1_name}:\n{tool_result['product1']['marketing_content']}"
            
            if "product2" in tool_result and isinstance(tool_result["product2"], dict):
                product2_name = tool_result["product2"].get("name", f"second {PRODUCT_TYPE} item")
                # Include marketing content for product 2 if available
                if "marketing_content" in tool_result["product2"] and tool_result["product2"]["marketing_content"]:
                    marketing_content += f"\n\nMarketing Content for {product2_name}:\n{tool_result['product2']['marketing_content']}"
        
        tool_description = f"a comparison between {product1_name} and {product2_name}"
    elif tool_type == "product-tiles":
        title = f"{PRODUCT_TYPE}"
        count = 0
        if isinstance(tool_result, dict):
            title = tool_result.get("title", f"{PRODUCT_TYPE}")
            count = len(tool_result.get("products", []))
        tool_description = f"a display of {count} {PRODUCT_TYPE} titled '{title}'"
    else:
        tool_description = "some information using a tool"

    tool_context_message = AIMessage(
        content=f"Context: I previously invoked a tool to show the user {tool_description}. The raw result of that tool call was: {tool_result}{marketing_content}"
    )

    # Construct the prompt messages using the new system prompt
    system_message = ("system", get_final_response_system_prompt())

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
