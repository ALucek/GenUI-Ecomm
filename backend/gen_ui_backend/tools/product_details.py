import os
import csv
from typing import Optional
from pathlib import Path

from langchain.pydantic_v1 import BaseModel, Field
from langchain_core.tools import tool

from gen_ui_backend.config import CATALOG_PATH, IMAGES_DIR, PRODUCT_IMAGES_ENDPOINT, PRODUCT_TYPE


class ProductDetailsInput(BaseModel):
    product_id: str = Field(..., description=f"The product ID of the {PRODUCT_TYPE} item to display")


@tool("product-details", args_schema=ProductDetailsInput, return_direct=True)
def product_details(product_id: str) -> dict:
    """Get details about a product from the catalog based on its product ID."""
    # Load the product data from the CSV file
    try:
        with open(CATALOG_PATH, 'r') as file:
            reader = csv.DictReader(file)
            products = list(reader)
        
        # Find the product with the matching product ID
        product = next((p for p in products if p["product_id"] == product_id), None)
        
        if not product:
            return {
                "error": f"No {PRODUCT_TYPE} item found with product ID: {product_id}",
                "available_ids": [p["product_id"] for p in products]
            }
        
        # Check if an image exists for this product
        image_path = IMAGES_DIR / f"{product_id}.jpg"
        has_image = image_path.exists()
        
        # Return the product data with image info
        return {
            **product,
            "has_image": has_image,
            "image_url": f"{PRODUCT_IMAGES_ENDPOINT}/{product_id}" if has_image else None
        }
    
    except Exception as e:
        return {"error": f"Error loading {PRODUCT_TYPE} data: {str(e)}"}