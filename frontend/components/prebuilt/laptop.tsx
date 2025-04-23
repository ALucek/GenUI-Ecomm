import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

interface LaptopData {
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
  error?: string;
}

export function LaptopLoading() {
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

export function Laptop({ product_id, name, brand, cpu_family, ram_gb, storage_gb, storage_type, screen_size_inches, screen_resolution, screen_type, graphics_card, battery_life_hours, weight_kg, price, marketing_link, datasheet_link, has_image, image_url, error }: LaptopData) {
  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto my-4">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Laptop</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
          <a 
            href={marketing_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
          >
            View Product
          </a>
        </div>
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
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-x-2 gap-y-3">
              <div>
                <p className="text-sm text-gray-500">Processor</p>
                <p className="font-medium">{cpu_family}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Memory</p>
                <p className="font-medium">{ram_gb} GB</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Storage</p>
                <p className="font-medium">{storage_gb} GB {storage_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Graphics</p>
                <p className="font-medium">{graphics_card}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Display</p>
                <p className="font-medium">{screen_size_inches}" {screen_type}</p>
                <p className="text-sm">{screen_resolution}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Weight</p>
                <p className="font-medium">{weight_kg} kg</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary">{screen_size_inches}" Display</Badge>
            <Badge variant="secondary">{ram_gb}GB RAM</Badge>
            <Badge variant="secondary">{storage_gb}GB {storage_type}</Badge>
            {battery_life_hours && <Badge variant="secondary">{battery_life_hours}</Badge>}
          </div>
          
          <div className="pt-2">
            <a 
              href={datasheet_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 text-sm underline"
            >
              View Full Specifications
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 