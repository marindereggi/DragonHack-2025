import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

type SutureAnalysis = {
  isParallel: boolean;
  isEquallySpaced: boolean;
  sutureCount: number;
  sutures: Suture[];
  score: number;
  feedback: string[];
};

type Suture = {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isGood: boolean;
  issues?: string[];
};

// Helper function to simulate suture analysis
function simulateSutureAnalysis(width: number, height: number): SutureAnalysis {
  // Number of sutures between 5 and 8
  const sutureCount = Math.floor(Math.random() * 4) + 5;
  
  // Random parallelism (more likely to be good than bad)
  const isParallel = Math.random() > 0.3;
  
  // Random spacing (more likely to be good than bad)
  const isEquallySpaced = Math.random() > 0.3;
  
  // Generate sutures
  const sutures: Suture[] = [];
  const verticalCenter = height / 2;
  const spacing = width / (sutureCount + 1);
  
  for (let i = 0; i < sutureCount; i++) {
    // Base position
    const baseX = spacing * (i + 1);
    
    // Add some randomness to simulate errors in parallelism
    const parallel = isParallel ? 
      Math.random() * 20 - 10 : // Minor error
      Math.random() * 60 - 30;  // Major error
    
    // Add some randomness to simulate errors in spacing
    const evenSpacing = isEquallySpaced ?
      Math.random() * 10 - 5 : // Minor error
      Math.random() * 30 - 15; // Major error
    
    // Determine if the suture is good (75% chance to be good)
    const isGood = Math.random() > 0.25;
    
    // Create suture
    const suture: Suture = {
      id: i,
      x1: baseX + evenSpacing,
      y1: verticalCenter - 50 + parallel,
      x2: baseX + evenSpacing,
      y2: verticalCenter + 50 + parallel,
      isGood,
      issues: isGood ? [] : [
        // Randomly select issues for bad sutures
        ...(Math.random() > 0.5 ? ["Improper tension"] : []),
        ...(Math.random() > 0.5 ? ["Uneven depth"] : []),
        ...(Math.random() > 0.6 ? ["Incorrect angle"] : [])
      ]
    };
    
    sutures.push(suture);
  }
  
  // Calculate score
  const parallelScore = isParallel ? 30 : 15;
  const spacingScore = isEquallySpaced ? 30 : 15;
  const sutureQualityScore = Math.floor(sutures.filter(s => s.isGood).length / sutureCount * 40);
  const score = parallelScore + spacingScore + sutureQualityScore;
  
  // Prepare feedback
  const feedback = [];
  
  if (isParallel) {
    feedback.push("Your sutures are relatively parallel, which is excellent.");
  } else {
    feedback.push("Your sutures should be more parallel. Try to hold the needle at a consistent angle for each suture.");
  }
  
  if (isEquallySpaced) {
    feedback.push("Your sutures have good even spacing.");
  } else {
    feedback.push("The spacing between your sutures is not even enough. Try marking suture points in advance for better consistency.");
  }
  
  const badSutures = sutures.filter(s => !s.isGood).length;
  if (badSutures > 0) {
    feedback.push(`${badSutures} out of ${sutureCount} sutures need improvement. See comments for individual sutures.`);
  } else {
    feedback.push("All your sutures are well executed. Excellent work!");
  }
  
  // General feedback on the result
  if (score >= 90) {
    feedback.push("Overall: Excellent work! Your sutures are nearly perfect.");
  } else if (score >= 70) {
    feedback.push("Overall: Very good work. With a little practice you'll achieve excellence.");
  } else if (score >= 50) {
    feedback.push("Overall: Good work, but you need more practice for consistency.");
  } else {
    feedback.push("Overall: You need more practice. Focus on needle holding technique and consistent force application.");
  }
  
  return {
    isParallel,
    isEquallySpaced,
    sutureCount,
    sutures,
    score,
    feedback
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get data from the request
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ error: 'Image was not provided' }, { status: 400 });
    }

    // Convert image to base64 format
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:${imageFile.type};base64,${base64Image}`;

    // Simulate analysis (for development we use simulated data)
    // In a production application we would use an ML model to analyze the image
    const width = 800; // Assumed image width
    const height = 600; // Assumed image height
    const analysis = simulateSutureAnalysis(width, height);

    // Return results
    return NextResponse.json({
      originalImage: dataUrl,
      processedImage: dataUrl, // In a production application we would return a processed image
      analysis
    });

  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json({ error: 'An error occurred while analyzing the image' }, { status: 500 });
  }
} 