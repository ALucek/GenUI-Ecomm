import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
import csv
import os

from gen_ui_backend.chain import create_graph, reset_chat_history, load_chat_history
from gen_ui_backend.types import ChatInputType
from gen_ui_backend.config import CATALOG_PATH, PRODUCT_TYPE, IMAGES_DIR, PRODUCT_IMAGES_ENDPOINT

# Needed for proper JSON serialization of LangChain messages
from langchain_core.messages import AIMessage, HumanMessage

# Load environment variables from .env file
load_dotenv()


def start() -> None:
    app = FastAPI(
        title="Gen UI Backend",
        version="1.0",
        description="A simple api server using Langchain's Runnable interfaces",
    )

    # Configure CORS
    origins = [
        "http://localhost",
        "http://localhost:3000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    graph = create_graph()

    runnable = graph.with_types(input_type=ChatInputType, output_type=dict)

    add_routes(app, runnable, path="/chat", playground_type="chat")

    # Add endpoint to reset chat history
    @app.post("/reset")
    async def reset_history_endpoint():
        reset_chat_history()
        return {"message": "Chat history reset successfully"}
    
    # Add endpoint to get current chat history
    @app.get("/history")
    async def get_history_endpoint():
        """
        Loads and returns the current chat history, ensuring the initial
        AI message is present for new or reset histories.
        Returns history in a format suitable for the frontend.
        """
        history_messages = load_chat_history()
        # Convert LangChain message objects to simple dicts/lists for JSON response
        history_serializable = []
        for msg in history_messages:
            role = "human" if isinstance(msg, HumanMessage) else "ai"
            history_serializable.append([role, str(msg.content)])
        return {"history": history_serializable}

    # Add endpoint to get all products for the carousel
    @app.get("/products")
    async def get_products():
        try:
            with open(CATALOG_PATH, 'r') as file:
                reader = csv.DictReader(file)
                products = list(reader)
            
            # Add image information for each product
            enhanced_products = []
            for product in products:
                product_id = product["product_id"]
                image_path = IMAGES_DIR / f"{product_id}.jpg"
                has_image = image_path.exists()
                
                enhanced_products.append({
                    **product,
                    "has_image": has_image,
                    "image_url": f"{PRODUCT_IMAGES_ENDPOINT}/{product_id}" if has_image else None
                })
                
            return {
                "products": enhanced_products,
                "product_type": PRODUCT_TYPE
            }
        except Exception as e:
            return {"error": f"Error loading {PRODUCT_TYPE} data: {str(e)}"}

    print("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
