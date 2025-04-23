import os
import csv
from typing import Optional
from pathlib import Path

from langchain.pydantic_v1 import BaseModel, Field
from langchain_core.tools import tool


class LaptopInput(BaseModel):
    product_id: str = Field(..., description="The product ID of the laptop to display")


@tool("laptop-product", args_schema=LaptopInput, return_direct=True)
def laptop_product(product_id: str) -> dict:
    """Get details about a laptop from the catalog based on its product ID."""
    # Get the path to the laptops directory
    backend_dir = Path(__file__).parent.parent.parent
    laptops_dir = backend_dir / "laptops"
    catalog_path = laptops_dir / "catalog.csv"
    
    # Load the laptop data from the CSV file
    try:
        with open(catalog_path, 'r') as file:
            reader = csv.DictReader(file)
            laptops = list(reader)
        
        # Find the laptop with the matching product ID
        laptop = next((l for l in laptops if l["product_id"] == product_id), None)
        
        if not laptop:
            return {
                "error": f"No laptop found with product ID: {product_id}",
                "available_ids": [l["product_id"] for l in laptops]
            }
        
        # Check if an image exists for this laptop
        image_path = laptops_dir / "images" / f"{product_id}.jpg"
        has_image = image_path.exists()
        
        # Return the laptop data with image info
        return {
            **laptop,
            "has_image": has_image,
            "image_url": f"/api/laptop-images/{product_id}" if has_image else None
        }
    
    except Exception as e:
        return {"error": f"Error loading laptop data: {str(e)}"} 