import os
import csv
from typing import Optional, List
from pathlib import Path

from langchain.pydantic_v1 import BaseModel, Field
from langchain_core.tools import tool

from gen_ui_backend.config import CATALOG_PATH, IMAGES_DIR, PRODUCT_IMAGES_ENDPOINT, PRODUCT_TYPE, load_marketing_content


class ProductComparisonInput(BaseModel):
    product_id_1: str = Field(..., description=f"The product ID of the first {PRODUCT_TYPE} item to compare")
    product_id_2: str = Field(..., description=f"The product ID of the second {PRODUCT_TYPE} item to compare")
    description: str = Field(default="", description=f"Optional generative content to display with the {PRODUCT_TYPE} comparison, based on the conversation context")


@tool("product-comparison", args_schema=ProductComparisonInput, return_direct=True)
def product_comparison(product_id_1: str, product_id_2: str, description: str = "") -> dict:
    """Compare two products side-by-side based on their product IDs."""
    try:
        with open(CATALOG_PATH, 'r') as file:
            reader = csv.DictReader(file)
            products = list(reader)
        
        # Find the products with the matching product IDs
        product1 = next((p for p in products if p["product_id"] == product_id_1), None)
        product2 = next((p for p in products if p["product_id"] == product_id_2), None)
        
        errors = []
        if not product1:
            errors.append(f"No {PRODUCT_TYPE} item found with product ID: {product_id_1}")
        if not product2:
            errors.append(f"No {PRODUCT_TYPE} item found with product ID: {product_id_2}")
        
        if errors:
            return {
                "error": ". ".join(errors),
                "available_ids": [p["product_id"] for p in products]
            }
        
        # Check if images exist for these products
        image_path1 = IMAGES_DIR / f"{product_id_1}.jpg"
        image_path2 = IMAGES_DIR / f"{product_id_2}.jpg"
        has_image1 = image_path1.exists()
        has_image2 = image_path2.exists()
        
        # Load marketing content for both products
        marketing_content1 = load_marketing_content(product_id_1)
        marketing_content2 = load_marketing_content(product_id_2)
        
        # Prepare comparison data
        comparison_data = {
            "product1": {
                **product1,
                "has_image": has_image1,
                "image_url": f"{PRODUCT_IMAGES_ENDPOINT}/{product_id_1}" if has_image1 else None,
                "marketing_content": marketing_content1
            },
            "product2": {
                **product2,
                "has_image": has_image2,
                "image_url": f"{PRODUCT_IMAGES_ENDPOINT}/{product_id_2}" if has_image2 else None,
                "marketing_content": marketing_content2
            },
            "description": description
        }
        
        # Add comparison highlights if products have the necessary fields
        # (This will depend on the product type)
        comparison_highlights = {}
        
        # Common price comparison if price field exists
        if "price" in product1 and "price" in product2:
            try:
                price1 = float(product1["price"].replace("$", "").replace(",", ""))
                price2 = float(product2["price"].replace("$", "").replace(",", ""))
                comparison_highlights["price_difference"] = abs(price1 - price2)
            except (ValueError, AttributeError):
                # Handle case where price is not a valid number or doesn't have replace method
                pass
                
        # Add other field comparisons based on what's available in both products
        # This makes the comparison system work for different product types
        numeric_fields = ["ram_gb", "storage_gb", "screen_size_inches"]
        for field in numeric_fields:
            if field in product1 and field in product2:
                try:
                    val1 = float(product1[field])
                    val2 = float(product2[field])
                    comparison_highlights[f"{field}_difference"] = abs(val1 - val2)
                except (ValueError, TypeError):
                    # Skip fields that can't be converted to numbers
                    pass
        
        comparison_data["comparison"] = comparison_highlights
        return comparison_data
    
    except Exception as e:
        return {"error": f"Error comparing {PRODUCT_TYPE} items: {str(e)}"} 