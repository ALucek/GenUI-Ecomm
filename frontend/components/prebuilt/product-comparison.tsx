import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { ArrowDown, ArrowUp, Minus, Check } from "lucide-react";

interface ProductData {
  product_id: string;
  name: string;
  brand: string;
  cpu_family: string;
  ram_gb: string;
  storage_gb: string;
  storage_type: string;
  screen_size_inches: string;
  screen_resolution: string;
  screen_type: string;
  graphics_card: string;
  battery_life_hours: string;
  weight_kg: string;
  price: string;
  marketing_link: string;
  datasheet_link: string;
  has_image: boolean;
  image_url: string | null;
}

interface ComparisonData {
  price_difference: number;
  ram_difference: number;
  storage_difference: number;
  screen_size_difference: number;
}

interface ProductComparisonData {
  product1: ProductData;
  product2: ProductData;
  comparison: ComparisonData;
  error?: string;
}

export function ProductComparisonLoading() {
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

export function ProductComparison({ product1, product2, comparison, error }: ProductComparisonData) {
  if (error) {
    return (
      <Card className="w-full max-w-6xl mx-auto my-4">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Comparison</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatPrice = (price: string) => {
    // Ensure price is just the number without dollar sign
    return parseFloat(price.replace(/[$,]/g, ''));
  };

  const compareValues = (value1: number, value2: number) => {
    if (value1 > value2) return { icon: <ArrowUp className="text-green-500 h-4 w-4" />, better: 'product1' };
    if (value1 < value2) return { icon: <ArrowDown className="text-red-500 h-4 w-4" />, better: 'product2' };
    return { icon: <Minus className="text-gray-500 h-4 w-4" />, better: null };
  };

  const price1 = formatPrice(product1.price);
  const price2 = formatPrice(product2.price);
  const ram1 = parseInt(product1.ram_gb);
  const ram2 = parseInt(product2.ram_gb);
  const storage1 = parseInt(product1.storage_gb);
  const storage2 = parseInt(product2.storage_gb);
  const screenSize1 = parseFloat(product1.screen_size_inches);
  const screenSize2 = parseFloat(product2.screen_size_inches);
  
  // For price, lower is better (so we invert the comparison)
  const priceComparison = compareValues(price2, price1);
  const ramComparison = compareValues(ram1, ram2);
  const storageComparison = compareValues(storage1, storage2);
  const screenSizeComparison = compareValues(screenSize1, screenSize2);

  return (
    <Card className="w-full max-w-6xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">Product Comparison</CardTitle>
        <CardDescription className="text-center">
          Compare features and specifications side-by-side
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* First product */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-bold">{product1.name}</h3>
            <p className="text-muted-foreground">{product1.brand} · {product1.price}</p>
          </div>
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
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-2 gap-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Processor</p>
                  <p className="font-medium">{product1.cpu_family}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Memory</p>
                  <p className="font-medium">{product1.ram_gb} GB</p>
                </div>
                {ramComparison.better === 'product1' && <Check className="text-green-500 h-4 w-4" />}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Storage</p>
                  <p className="font-medium">{product1.storage_gb} GB {product1.storage_type}</p>
                </div>
                {storageComparison.better === 'product1' && <Check className="text-green-500 h-4 w-4" />}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Graphics</p>
                  <p className="font-medium">{product1.graphics_card}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Display</p>
                  <p className="font-medium">{product1.screen_size_inches}" {product1.screen_type}</p>
                  <p className="text-sm">{product1.screen_resolution}</p>
                </div>
                {screenSizeComparison.better === 'product1' && <Check className="text-green-500 h-4 w-4" />}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-medium">{product1.weight_kg} kg</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">{product1.price}</p>
                </div>
                {priceComparison.better === 'product1' && <Check className="text-green-500 h-4 w-4" />}
              </div>
            </div>
            
            <div className="pt-4">
              <a 
                href={product1.marketing_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm inline-block"
              >
                View Product
              </a>
            </div>
          </div>
        </div>
        
        {/* Second product */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-bold">{product2.name}</h3>
            <p className="text-muted-foreground">{product2.brand} · {product2.price}</p>
          </div>
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
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-2 gap-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Processor</p>
                  <p className="font-medium">{product2.cpu_family}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Memory</p>
                  <p className="font-medium">{product2.ram_gb} GB</p>
                </div>
                {ramComparison.better === 'product2' && <Check className="text-green-500 h-4 w-4" />}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Storage</p>
                  <p className="font-medium">{product2.storage_gb} GB {product2.storage_type}</p>
                </div>
                {storageComparison.better === 'product2' && <Check className="text-green-500 h-4 w-4" />}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Graphics</p>
                  <p className="font-medium">{product2.graphics_card}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Display</p>
                  <p className="font-medium">{product2.screen_size_inches}" {product2.screen_type}</p>
                  <p className="text-sm">{product2.screen_resolution}</p>
                </div>
                {screenSizeComparison.better === 'product2' && <Check className="text-green-500 h-4 w-4" />}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-medium">{product2.weight_kg} kg</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">{product2.price}</p>
                </div>
                {priceComparison.better === 'product2' && <Check className="text-green-500 h-4 w-4" />}
              </div>
            </div>
            
            <div className="pt-4">
              <a 
                href={product2.marketing_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm inline-block"
              >
                View Product
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 