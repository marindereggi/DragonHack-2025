import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Attempt to parse data from the request
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ error: 'Image was not provided' }, { status: 400 });
    }

    // Convert image to base64 format
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:${imageFile.type};base64,${base64Image}`;

    // For now we're returning simulated results
    // In a real application we would call external APIs or perform image processing
    const response = {
      originalImage: dataUrl,
      processedImage: dataUrl, // Currently returning the same image for demonstration purposes
      fileName: imageFile.name,
      analysis: {
        resolution: '1920x1080px',
        format: 'JPEG',
        colorProfile: 'sRGB',
        dominantColors: ['#3a86ff', '#8338ec', '#ff006e']
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json({ error: 'An error occurred while processing the image' }, { status: 500 });
  }
} 