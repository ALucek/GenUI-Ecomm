import os
import csv
from typing import Optional, List
from pathlib import Path

from langchain.pydantic_v1 import BaseModel, Field
from langchain_core.tools import tool


class ProductTilesInput(BaseModel):
    product_ids: List[str] = Field(..., description="A list of product IDs to display as tiles")
    title: str = Field(default="Recommended Products", description="Optional title for the product tiles section")


@tool("product-tiles", args_schema=ProductTilesInput, return_direct=True)
def product_tiles(product_ids: List[str], title: str = "Recommended Products") -> dict:
    """Display multiple laptop products as tiles with basic information."""
    # Get the path to the laptops directory
    backend_dir = Path(__file__).parent.parent.parent
    laptops_dir = backend_dir / "laptops"
    catalog_path = laptops_dir / "catalog.csv"
    
    try:
        with open(catalog_path, 'r') as file:
            reader = csv.DictReader(file)
            all_laptops = list(reader)
        
        # Find the laptops with the matching product IDs
        found_laptops = []
        not_found_ids = []
        
        for product_id in product_ids:
            laptop = next((l for l in all_laptops if l["product_id"] == product_id), None)
            if laptop:
                # Check if an image exists for this laptop
                image_path = laptops_dir / "images" / f"{product_id}.jpg"
                has_image = image_path.exists()
                
                # Add simplified laptop data to results
                found_laptops.append({
                    "product_id": laptop["product_id"],
                    "name": laptop["name"],
                    "brand": laptop["brand"],
                    "price": laptop["price"],
                    "ram_gb": laptop["ram_gb"],
                    "storage_gb": laptop["storage_gb"],
                    "storage_type": laptop["storage_type"],
                    "screen_size_inches": laptop["screen_size_inches"],
                    "cpu_family": laptop["cpu_family"],
                    "marketing_link": laptop["marketing_link"],
                    "has_image": has_image,
                    "image_url": f"/api/laptop-images/{product_id}" if has_image else None
                })
            else:
                not_found_ids.append(product_id)
        
        if not found_laptops:
            return {
                "error": f"No laptops found with the provided product IDs: {', '.join(product_ids)}",
                "available_ids": [l["product_id"] for l in all_laptops]
            }
        
        # Return the data
        result = {
            "title": title,
            "products": found_laptops
        }
        
        if not_found_ids:
            result["warning"] = f"Some product IDs were not found: {', '.join(not_found_ids)}"
            
        return result
    
    except Exception as e:
        return {"error": f"Error loading product tiles: {str(e)}"} 