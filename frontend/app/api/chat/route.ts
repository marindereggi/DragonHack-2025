import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

type Message = {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
};

// Helper function to simulate AI response
function generateResponse(message: string): string {
  if (message.toLowerCase().includes("enhance") || message.toLowerCase().includes("suggestion")) {
    return "I recommend increasing contrast by 10%, applying a subtle sharpening filter, and adjusting white balance for more vibrant colors.";
  } else if (message.toLowerCase().includes("color") || message.toLowerCase().includes("palette") || message.toLowerCase().includes("barv")) {
    return "The image contains a vibrant color palette with cool blues and purples contrasted with warm pinks. This creates a dynamic visual tension that draws the viewer's eye.";
  } else if (message.toLowerCase().includes("export") || message.toLowerCase().includes("format")) {
    return "For web use, I recommend exporting as WebP for the best balance of quality and file size. For print, use TIFF or high-quality PNG.";
  } else {
    return "I'm here to help with your image analysis. You can ask about colors, composition, technical details, or enhancement suggestions.";
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is missing or invalid' }, { status: 400 });
    }

    // Generate response
    const responseContent = generateResponse(message);
    
    const aiMessage: Message = {
      id: Date.now().toString(),
      content: responseContent,
      sender: "ai",
      timestamp: new Date()
    };

    // Simulate a small delay as in an actual implementation
    await new Promise(resolve => setTimeout(resolve, 200));

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json({ error: 'An error occurred while processing the message' }, { status: 500 });
  }
} 