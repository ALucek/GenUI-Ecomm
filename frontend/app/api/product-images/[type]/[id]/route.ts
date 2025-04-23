import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string, id: string } }
) {
  const { type, id } = params;
  
  // Define path to the image based on product type
  const imagePath = path.join(process.cwd(), '..', 'backend', type, 'images', `${id}.jpg`);
  
  try {
    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`Image not found at path: ${imagePath}`);
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Read the file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Return the image
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Error serving image', { status: 500 });
  }
}