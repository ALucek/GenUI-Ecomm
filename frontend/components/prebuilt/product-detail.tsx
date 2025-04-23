import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { currentConfig, formatFieldLabel, formatFieldValue } from "./config";
import ReactMarkdown from "react-markdown";

interface ProductDetailData {
  [key: string]: any;
}

export function ProductDetailLoading() {
  return (
    <Card className="w-full max-w-4xl mx-auto my-4">
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex justify-center">
          <Skeleton className="h-40 w-40 rounded-md" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <div className="pt-2 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductDetail(props: ProductDetailData) {
  const { error, description } = props;
  
  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto my-4">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Product Details</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Extract core fields used in the header
  const name = props.name;
  const brand = props.brand;
  const price = props.price;
  const marketing_link = props.marketing_link;
  const has_image = props.has_image;
  const image_url = props.image_url;
  
  // Get detail fields to display from config, excluding any missing fields
  const detailFieldsToShow = currentConfig.detailFields.filter(
    field => field in props && !['name', 'brand', 'price'].includes(field)
  );

  // Get badge fields to display from config
  const badgeFieldsToShow = currentConfig.badgeFields.filter(
    field => field in props
  );

  return (
    <Card className="w-full max-w-4xl mx-auto my-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{name}</CardTitle>
            <CardDescription className="text-lg">
              <span className="font-medium">{brand}</span> · {price}
            </CardDescription>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            asChild
            className="group"
          >
            <a 
              href={marketing_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              View Product
              <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </Button>
        </div>
        {description && (
          <div className="mt-4">
            <ReactMarkdown className="text-muted-foreground">{description}</ReactMarkdown>
          </div>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex justify-center items-center">
          {has_image && image_url ? (
            <div className="relative h-48 w-48">
              <Image 
                src={image_url} 
                alt={name}
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
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-x-2 gap-y-3">
            {detailFieldsToShow.map(field => (
              <div key={field}>
                <p className="text-sm text-gray-500">
                  {formatFieldLabel(field)}
                </p>
                <p className="font-medium">{props[field]}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {badgeFieldsToShow.map(field => (
              <Badge key={field} variant="secondary">
                {formatFieldValue(field, props[field])}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 