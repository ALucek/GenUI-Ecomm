import os
import csv
from typing import Optional, List
from pathlib import Path

from langchain.pydantic_v1 import BaseModel, Field
from langchain_core.tools import tool

from gen_ui_backend.config import CATALOG_PATH, IMAGES_DIR, PRODUCT_IMAGES_ENDPOINT, PRODUCT_TYPE


class ProductTilesInput(BaseModel):
    product_ids: List[str] = Field(..., description=f"A list of product IDs to display as tiles")
    title: str = Field(default="Recommended Products", description=f"Optional title for the {PRODUCT_TYPE} tiles section")
    description: str = Field(default="", description=f"Optional generative content to display with the {PRODUCT_TYPE} tiles, based on the conversation context")


@tool("product-tiles", args_schema=ProductTilesInput, return_direct=True)
def product_tiles(product_ids: List[str], title: str = "Recommended Products", description: str = "") -> dict:
    """Display multiple products as tiles with basic information."""
    try:
        with open(CATALOG_PATH, 'r') as file:
            reader = csv.DictReader(file)
            all_products = list(reader)
        
        # Find the products with the matching product IDs
        found_products = []
        not_found_ids = []
        
        for product_id in product_ids:
            product = next((p for p in all_products if p["product_id"] == product_id), None)
            if product:
                # Check if an image exists for this product
                image_path = IMAGES_DIR / f"{product_id}.jpg"
                has_image = image_path.exists()
                
                # Add product data to results
                product_with_image = {
                    **product,
                    "has_image": has_image,
                    "image_url": f"{PRODUCT_IMAGES_ENDPOINT}/{product_id}" if has_image else None
                }
                found_products.append(product_with_image)
            else:
                not_found_ids.append(product_id)
        
        if not found_products:
            return {
                "error": f"No {PRODUCT_TYPE} found with the provided product IDs: {', '.join(product_ids)}",
                "available_ids": [p["product_id"] for p in all_products]
            }
        
        # Return the data
        result = {
            "title": title,
            "products": found_products,
            "description": description
        }
        
        if not_found_ids:
            result["warning"] = f"Some product IDs were not found: {', '.join(not_found_ids)}"
            
        return result
    
    except Exception as e:
        return {"error": f"Error loading {PRODUCT_TYPE} tiles: {str(e)}"} 