"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { currentConfig, formatFieldValue } from "./config";
import ReactMarkdown from "react-markdown";

interface ProductCarouselProps {
  title?: string;
  description?: string;
  products?: any[];  // Will be populated from the API
  isLoading?: boolean;
}

export function ProductCarousel({ 
  title = "Featured Products", 
  description = "Browse our selection of products", 
  products = [], 
  isLoading = false 
}: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [manualNavigationTime, setManualNavigationTime] = useState<number | null>(null);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Constants
  const AUTO_SCROLL_INTERVAL = 5000; // 5 seconds
  const MANUAL_NAVIGATION_COOLDOWN = 10000; // 10 seconds before auto-scroll resumes
  
  // Setup auto-scroll timer
  useEffect(() => {
    setIsClient(true);
    
    // Start auto-scroll if enabled and we have products
    const startAutoScroll = () => {
      // Only auto-scroll if:
      // 1. We have more than one product
      // 2. Auto-scroll is enabled
      // 3. Either there was no manual navigation, or enough time has passed since manual navigation
      const shouldAutoScroll = 
        products.length > 1 && 
        autoScrollEnabled && 
        (!manualNavigationTime || (Date.now() - manualNavigationTime > MANUAL_NAVIGATION_COOLDOWN));
      
      if (shouldAutoScroll) {
        autoScrollTimerRef.current = setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
        }, AUTO_SCROLL_INTERVAL);
      } else if (manualNavigationTime && (Date.now() - manualNavigationTime > MANUAL_NAVIGATION_COOLDOWN)) {
        // Reset manual navigation time once the cooldown period is over
        setManualNavigationTime(null);
      }
    };
    
    // Clear existing timer and start a new one
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
    }
    
    startAutoScroll();
    
    // Cleanup on unmount
    return () => {
      if (autoScrollTimerRef.current) {
        clearTimeout(autoScrollTimerRef.current);
      }
    };
  }, [products.length, currentIndex, autoScrollEnabled, manualNavigationTime]);

  const handleManualNavigation = (newIndex: number) => {
    // Record the time of manual navigation
    setManualNavigationTime(Date.now());
    
    // Clear any existing auto-scroll timer
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
    }
    
    // Set the new index
    setCurrentIndex(newIndex);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % products.length;
    handleManualNavigation(nextIndex);
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + products.length) % products.length;
    handleManualNavigation(prevIndex);
  };

  const jumpToIndex = (index: number) => {
    if (index === currentIndex) return;
    handleManualNavigation(index);
  };

  // Pause auto-scroll when user hovers over the carousel
  const handleMouseEnter = () => {
    setAutoScrollEnabled(false);
  };

  // Resume auto-scroll when user leaves the carousel
  const handleMouseLeave = () => {
    setAutoScrollEnabled(true);
  };

  // Handle empty or loading states
  if (isLoading) {
    return (
      <Card className="w-full max-w-6xl mx-auto my-12 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Loading Products...</CardTitle>
          <CardDescription>Please wait while we fetch the latest products</CardDescription>
        </CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-32 w-32 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="w-full max-w-6xl mx-auto my-12 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          <p className="text-gray-500">No products available to display</p>
        </CardContent>
      </Card>
    );
  }

  // Get badge fields from config that exist in the first product
  const badgeFieldsToShow = currentConfig.badgeFields.filter(
    field => field in products[0]
  );

  // Only show navigation controls if we have more than one product
  const showControls = products.length > 1;

  // Calculate seconds remaining until auto-scroll resumes (for debugging)
  const cooldownRemaining = manualNavigationTime 
    ? Math.max(0, Math.ceil((MANUAL_NAVIGATION_COOLDOWN - (Date.now() - manualNavigationTime)) / 1000))
    : 0;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 min-h-[70vh]">
      <Card className="w-full max-w-5xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && (
            <CardDescription className="mt-2 max-w-2xl mx-auto">
              <ReactMarkdown>{description}</ReactMarkdown>
            </CardDescription>
          )}
        </CardHeader>
        
        {/* Main carousel container */}
        <CardContent 
          className="relative p-0 overflow-hidden" 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {products.map((product, index) => (
              <div key={product.product_id} className="w-full flex-shrink-0">
                <div className="flex flex-col md:flex-row items-center gap-8 py-10 px-8">
                  {/* Product Image */}
                  <div className="relative h-56 w-56 flex-shrink-0 transition-all duration-300 transform hover:scale-105">
                    {product.has_image && product.image_url ? (
                      <div className="relative h-full w-full rounded-lg overflow-hidden shadow-md">
                        <Image 
                          src={product.image_url} 
                          alt={product.name}
                          fill
                          style={{ objectFit: 'contain' }}
                          sizes="(max-width: 768px) 100vw, 224px"
                          className="p-2"
                        />
                      </div>
                    ) : (
                      <div className="h-full w-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm shadow-md">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-grow space-y-5 text-center md:text-left py-4">
                    <h2 className="text-3xl font-bold line-clamp-1">{product.name}</h2>
                    <p className="text-lg text-muted-foreground">{product.brand}</p>
                    <p className="text-2xl font-semibold text-primary">{product.price}</p>
                    
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {badgeFieldsToShow.map(field => (
                        <Badge key={field} variant="outline" className="px-3 py-1 text-sm">
                          {formatFieldValue(field, product[field])}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button 
                      variant="default" 
                      size="lg"
                      className="mt-6 group transform transition-transform hover:scale-105"
                      asChild
                    >
                      <a 
                        href={product.marketing_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1"
                      >
                        View Details
                        <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Carousel Controls */}
          {isClient && showControls && (
            <>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute left-8 bottom-4 rounded-full opacity-70 hover:opacity-100 z-10 shadow-md"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute right-8 bottom-4 rounded-full opacity-70 hover:opacity-100 z-10 shadow-md"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              
              {/* Enhanced dots indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {products.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === currentIndex ? 'bg-primary w-8 shadow-sm' : 'bg-gray-300 w-2.5 hover:bg-gray-400'
                    }`}
                    onClick={() => jumpToIndex(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              
              {/* Progress indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${(currentIndex + 1) * (100 / products.length)}%` }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 