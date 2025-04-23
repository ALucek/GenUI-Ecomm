import os
import csv
from typing import Optional, List
from pathlib import Path

from langchain.pydantic_v1 import BaseModel, Field
from langchain_core.tools import tool


class ProductComparisonInput(BaseModel):
    product_id_1: str = Field(..., description="The product ID of the first laptop to compare")
    product_id_2: str = Field(..., description="The product ID of the second laptop to compare")


@tool("product-comparison", args_schema=ProductComparisonInput, return_direct=True)
def product_comparison(product_id_1: str, product_id_2: str) -> dict:
    """Compare two laptops side-by-side based on their product IDs."""
    # Get the path to the laptops directory
    backend_dir = Path(__file__).parent.parent.parent
    laptops_dir = backend_dir / "laptops"
    catalog_path = laptops_dir / "catalog.csv"
    
    try:
        with open(catalog_path, 'r') as file:
            reader = csv.DictReader(file)
            laptops = list(reader)
        
        # Find the laptops with the matching product IDs
        laptop1 = next((l for l in laptops if l["product_id"] == product_id_1), None)
        laptop2 = next((l for l in laptops if l["product_id"] == product_id_2), None)
        
        errors = []
        if not laptop1:
            errors.append(f"No laptop found with product ID: {product_id_1}")
        if not laptop2:
            errors.append(f"No laptop found with product ID: {product_id_2}")
        
        if errors:
            return {
                "error": ". ".join(errors),
                "available_ids": [l["product_id"] for l in laptops]
            }
        
        # Check if images exist for these laptops
        image_path1 = laptops_dir / "images" / f"{product_id_1}.jpg"
        image_path2 = laptops_dir / "images" / f"{product_id_2}.jpg"
        has_image1 = image_path1.exists()
        has_image2 = image_path2.exists()
        
        # Prepare comparison data
        comparison = {
            "product1": {
                **laptop1,
                "has_image": has_image1,
                "image_url": f"/api/laptop-images/{product_id_1}" if has_image1 else None
            },
            "product2": {
                **laptop2,
                "has_image": has_image2,
                "image_url": f"/api/laptop-images/{product_id_2}" if has_image2 else None
            },
            # Add comparison highlights
            "comparison": {
                "price_difference": abs(float(laptop1["price"].replace("$", "").replace(",", "")) - 
                                       float(laptop2["price"].replace("$", "").replace(",", ""))),
                "ram_difference": abs(int(laptop1["ram_gb"]) - int(laptop2["ram_gb"])),
                "storage_difference": abs(int(laptop1["storage_gb"]) - int(laptop2["storage_gb"])),
                "screen_size_difference": abs(float(laptop1["screen_size_inches"]) - float(laptop2["screen_size_inches"]))
            }
        }
        
        return comparison
    
    except Exception as e:
        return {"error": f"Error comparing laptops: {str(e)}"} 