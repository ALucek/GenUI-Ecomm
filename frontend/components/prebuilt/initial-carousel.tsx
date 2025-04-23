"use client";

import { useEffect, useState } from "react";
import { ProductCarousel } from "./product-carousel";

export default function InitialCarousel() {
  const [productData, setProductData] = useState({
    title: "Featured Products",
    description: "Explore our selection of top products",
    products: [],
    isLoading: true
  });

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Fetch products from the backend API
        const response = await fetch("http://localhost:8000/products", {
          method: "GET",
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        
        const data = await response.json();
        
        // Format the data for the carousel
        setProductData({
          title: "Featured Products",
          description: "Explore our selection of top products",
          products: data.products || [],
          isLoading: false
        });
      } catch (error) {
        console.error("Error loading initial products:", error);
        setProductData(prev => ({
          ...prev,
          isLoading: false,
          error: "Could not load products"
        }));
      }
    }
    
    fetchProducts();
  }, []);

  return <ProductCarousel {...productData} />;
} 