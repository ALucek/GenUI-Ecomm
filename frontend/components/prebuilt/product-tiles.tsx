import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { Fragment } from "react";
import { currentConfig, formatFieldLabel, formatFieldValue } from "./config";
import ReactMarkdown from "react-markdown";

interface ProductTilesData {
  title: string;
  products: any[];
  description?: string;
  warning?: string;
  error?: string;
}

export function ProductTilesLoading() {
  return (
    <Card className="w-full max-w-6xl mx-auto my-4">
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/4 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="p-2 flex justify-center">
                <Skeleton className="h-28 w-28 rounded-md" />
              </div>
              <CardContent className="p-4 pt-2">
                <Skeleton className="h-5 w-4/5 mb-2" />
                <Skeleton className="h-4 w-2/3 mb-1" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <div className="flex flex-wrap gap-1 mt-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Skeleton className="h-8 w-full rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductTiles({ title, products, description, warning, error }: ProductTilesData) {
  // Get badge fields from config that exist in the first product
  const badgeFieldsToShow = products.length > 0
    ? currentConfig.badgeFields.filter(
        field => field in products[0]
      )
    : [];

  if (error) {
    return (
      <Card className="w-full max-w-6xl mx-auto my-4">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Products</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto my-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription className="mt-2">
            <ReactMarkdown>{description}</ReactMarkdown>
          </CardDescription>
        )}
        {warning && <CardDescription className="text-amber-500">{warning}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.product_id} className="overflow-hidden h-full flex flex-col">
              <div className="p-4 flex justify-center">
                {product.has_image && product.image_url ? (
                  <div className="relative h-28 w-28">
                    <Image 
                      src={product.image_url} 
                      alt={product.name}
                      fill
                      style={{ objectFit: 'contain' }}
                      sizes="(max-width: 768px) 100vw, 112px"
                    />
                  </div>
                ) : (
                  <div className="h-28 w-28 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <CardContent className="p-4 pt-0 flex-grow">
                <h3 className="text-md font-bold line-clamp-2">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.brand}</p>
                <p className="text-md font-semibold text-primary mt-1">{product.price}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {badgeFieldsToShow.map(field => (
                    <Badge key={field} variant="outline" className="text-xs">
                      {formatFieldValue(field, product[field])}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button 
                  variant="default" 
                  size="sm"
                  className="w-full group"
                  asChild
                >
                  <a 
                    href={product.marketing_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1"
                  >
                    View Details
                    <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 