import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Check, ExternalLink } from "lucide-react";
import { currentConfig, formatFieldLabel, formatFieldValue } from "./config";
import ReactMarkdown from "react-markdown";

interface ProductComparisonData {
  [key: string]: any;
}

export function ComparisonLoading() {
  return (
    <Card className="w-full max-w-6xl mx-auto my-4">
      <CardHeader className="space-y-2 text-center">
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-1/3 mx-auto" />
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* First product */}
        <div className="space-y-4">
          <div className="text-center">
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-1/3 mx-auto mt-2" />
          </div>
          <div className="flex justify-center">
            <Skeleton className="h-40 w-40 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        
        {/* Second product */}
        <div className="space-y-4">
          <div className="text-center">
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-1/3 mx-auto mt-2" />
          </div>
          <div className="flex justify-center">
            <Skeleton className="h-40 w-40 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Comparison(props: ProductComparisonData) {
  const { product1, product2, description, error } = props;
  if (error) {
    return (
      <Card className="w-full max-w-6xl mx-auto my-4">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Product Comparison</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get comparison fields from config that exist in both products
  const fieldsToCompare = currentConfig.comparisonFields.filter(
    field => field in product1 && field in product2 && 
            !currentConfig.hiddenFields.includes(field)
  );

  // Determine which product is better for each numeric field
  const comparisons: Record<string, { winner: 'product1' | 'product2' | null }> = {};
  
  // Helper to compare numeric values
  const compareValues = (field: string, value1: any, value2: any) => {
    // Skip non-numeric values
    if (isNaN(Number(value1)) || isNaN(Number(value2))) {
      return null;
    }
    
    const num1 = Number(value1);
    const num2 = Number(value2);
    
    // For price, lower is better; for most other specs, higher is better
    const isLowerBetter = field === 'price' || field === 'weight_kg';
    
    if (isLowerBetter) {
      return num1 < num2 ? 'product1' : num1 > num2 ? 'product2' : null;
    } else {
      return num1 > num2 ? 'product1' : num1 < num2 ? 'product2' : null;
    }
  };
  
  // Compute comparisons for all fields
  fieldsToCompare.forEach(field => {
    comparisons[field] = { 
      winner: compareValues(field, product1[field], product2[field]) 
    };
  });

  return (
    <Card className="w-full max-w-6xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">Product Comparison</CardTitle>
        <CardDescription className="text-center">
          Compare features and specifications side-by-side
        </CardDescription>
        {description && (
          <div className="mt-4">
            <ReactMarkdown className="text-muted-foreground text-center">{description}</ReactMarkdown>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product 1 */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold">{product1.name}</h3>
              <p className="text-muted-foreground">{product1.brand} · {product1.price}</p>
            </div>
            
            {/* Product 1 Image */}
            <div className="flex justify-center">
              {product1.has_image && product1.image_url ? (
                <div className="relative h-48 w-48">
                  <Image 
                    src={product1.image_url} 
                    alt={product1.name}
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="(max-width: 768px) 100vw, 192px"
                  />
                </div>
              ) : (
                <div className="h-48 w-48 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                  No Image Available
                </div>
              )}
            </div>
            
            {/* Product 1 Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-y-3">
                {fieldsToCompare.map(field => (
                  field !== 'name' && field !== 'brand' && (
                    <div key={field} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{formatFieldLabel(field)}</p>
                        <p className="font-medium">{formatFieldValue(field, product1[field])}</p>
                      </div>
                      {comparisons[field]?.winner === 'product1' && 
                        <Check className="text-green-500 h-4 w-4" />
                      }
                    </div>
                  )
                ))}
              </div>
              
              {/* View Product Link */}
              <div className="pt-4">
                <Button 
                  variant="default" 
                  size="sm"
                  className="group"
                  asChild
                >
                  <a 
                    href={product1.marketing_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    View Product
                    <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Product 2 */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold">{product2.name}</h3>
              <p className="text-muted-foreground">{product2.brand} · {product2.price}</p>
            </div>
            
            {/* Product 2 Image */}
            <div className="flex justify-center">
              {product2.has_image && product2.image_url ? (
                <div className="relative h-48 w-48">
                  <Image 
                    src={product2.image_url} 
                    alt={product2.name}
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="(max-width: 768px) 100vw, 192px"
                  />
                </div>
              ) : (
                <div className="h-48 w-48 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                  No Image Available
                </div>
              )}
            </div>
            
            {/* Product 2 Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-y-3">
                {fieldsToCompare.map(field => (
                  field !== 'name' && field !== 'brand' && (
                    <div key={field} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{formatFieldLabel(field)}</p>
                        <p className="font-medium">{formatFieldValue(field, product2[field])}</p>
                      </div>
                      {comparisons[field]?.winner === 'product2' && 
                        <Check className="text-green-500 h-4 w-4" />
                      }
                    </div>
                  )
                ))}
              </div>
              
              {/* View Product Link */}
              <div className="pt-4">
                <Button 
                  variant="default" 
                  size="sm"
                  className="group"
                  asChild
                >
                  <a 
                    href={product2.marketing_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    View Product
                    <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 