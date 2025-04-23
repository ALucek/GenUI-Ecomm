import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

interface ProductTileData {
  product_id: string;
  name: string;
  brand: string;
  price: string;
  ram_gb: string;
  storage_gb: string;
  storage_type: string;
  screen_size_inches: string;
  cpu_family: string;
  marketing_link: string;
  has_image: boolean;
  image_url: string | null;
}

interface ProductTilesData {
  title: string;
  products: ProductTileData[];
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

export function ProductTiles({ title, products, warning, error }: ProductTilesData) {
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
                
                <div className="flex flex-wrap gap-1 mt-3">
                  <Badge variant="outline" className="text-xs">{product.ram_gb}GB</Badge>
                  <Badge variant="outline" className="text-xs">{product.storage_gb}GB {product.storage_type}</Badge>
                  <Badge variant="outline" className="text-xs">{product.screen_size_inches}"</Badge>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <a 
                  href={product.marketing_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm w-full text-center"
                >
                  View Details
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 