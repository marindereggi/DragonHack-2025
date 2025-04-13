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

// Define type for Python API suture data
type PythonSuture = {
  angle: number;
  angle_deviation: number;
  is_parallel: boolean;
  even_spacing?: boolean;
  distance_deviation?: number;
  line: [number, number][];
  overall_good: boolean;
};

// Function to map the Python API response to our frontend expected format
function mapApiResponseToFrontendFormat(apiResponse: any): {
  originalImage: string;
  processedImage: string;
  analysis: SutureAnalysis;
} {
  console.log('Mapping API response to frontend format');
  console.log('Suture analysis data:', JSON.stringify(apiResponse.suture_analysis, null, 2));
  
  // Map the suture analysis from the API response or provide defaults
  let analysis: SutureAnalysis;
  
  if (apiResponse.suture_analysis) {
    // Try to map the Python backend format to our frontend format
    try {
      // Extract data from the Python response format
      const sutureData = apiResponse.suture_analysis;
      
      // Count sutures and evaluate parallelism and spacing
      const individualSutures = sutureData.individual_sutures || [];
      const sutureCount = sutureData.sutures_detected || individualSutures.length || 0;
      
      // Check parallelism - at least 60% need to be parallel for the badge to show "Yes"
      const parallelSutures = individualSutures.filter((s: PythonSuture) => s.is_parallel === true).length;
      const parallelPercentage = sutureCount > 0 ? (parallelSutures / sutureCount) * 100 : 0;
      const isParallel = parallelPercentage >= 60;
      
      // Check spacing - at least 60% need to be evenly spaced for the badge to show "Yes"
      const evenlySpacedSutures = individualSutures.filter((s: PythonSuture) => s.even_spacing === true).length;
      const evenSpacingPercentage = sutureCount > 0 ? (evenlySpacedSutures / sutureCount) * 100 : 0;
      const isEquallySpaced = evenSpacingPercentage >= 60;
      
      // Calculate a more gracious score (0-100)
      // We'll evaluate individual suture quality with a higher base score
      // and give partial credit for parallelism and spacing
      
      // Base score - start at 50 as a minimum if there are any sutures
      let score = sutureCount > 0 ? 50 : 0;
      
      // Add up to 20 points for parallelism, scaled by percentage
      const parallelismScore = Math.round((parallelPercentage / 100) * 20);
      score += parallelismScore;
      
      // Add up to 20 points for even spacing, scaled by percentage
      const spacingScore = Math.round((evenSpacingPercentage / 100) * 20);
      score += spacingScore;
      
      // Count good sutures for remaining scoring (up to 10 points)
      const goodSutures = individualSutures.filter((s: PythonSuture) => s.overall_good === true).length;
      const goodSuturePercentage = sutureCount > 0 ? (goodSutures / sutureCount) * 100 : 0;
      const sutureQualityScore = Math.round((goodSuturePercentage / 100) * 10);
      score += sutureQualityScore;
      
      // Ensure score stays within 0-100 range
      score = Math.min(100, Math.max(0, score));
      
      // Generate feedback based on the analysis
      const feedback = [];
      
      if (isParallel) {
        feedback.push("Your sutures are relatively parallel, which is excellent.");
      } else {
        const parallelPercent = Math.round(parallelPercentage);
        feedback.push(`Only about ${parallelPercent}% of your sutures are parallel. Try to hold the needle at a consistent angle for each suture.`);
      }
      
      if (isEquallySpaced) {
        feedback.push("Your sutures have good even spacing.");
      } else {
        const evenPercent = Math.round(evenSpacingPercentage);
        feedback.push(`Only about ${evenPercent}% of your sutures are evenly spaced. Try marking suture points in advance for better consistency.`);
      }
      
      const badSutures = sutureCount - goodSutures;
      if (badSutures > 0) {
        feedback.push(`${badSutures} out of ${sutureCount} sutures need improvement. See comments for individual sutures.`);
      } else if (sutureCount > 0) {
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
      
      // Map the sutures from the API format to our frontend format
      const sutures = individualSutures.map((s: PythonSuture, index: number) => {
        // Each suture has line coordinates [x1,y1], [x2,y2]
        const line = s.line || [[0, 0], [0, 0]];
        const isGood = s.overall_good === true;
        
        // Generate issues array based on the data
        const issues = [];
        if (s.is_parallel === false) {
          issues.push("Not parallel with other sutures");
        }
        if (s.even_spacing === false && s.distance_deviation !== undefined) {
          issues.push("Uneven spacing");
        }
        if (s.angle_deviation > 10) {
          issues.push("Incorrect angle");
        }
        
        return {
          id: index,
          x1: line[0][0] || 0,
          y1: line[0][1] || 0,
          x2: line[1][0] || 0,
          y2: line[1][1] || 0,
          isGood,
          issues
        };
      });
      
      // Create the analysis object
      analysis = {
        isParallel,
        isEquallySpaced,
        sutureCount,
        sutures,
        score,
        feedback
      };
    } catch (error) {
      console.error('Error mapping suture analysis:', error);
      analysis = createDefaultAnalysis();
    }
  } else {
    console.warn('No suture_analysis in API response, using defaults');
    analysis = createDefaultAnalysis();
  }
  
  // Original image as passed to the function
  const originalImageDataUrl = apiResponse.original_image || '';
  
  // Processed image from the API - use the backend's visualization
  let processedImageDataUrl = '';
  if (apiResponse.result_image_base64) {
    console.log('Result image received from API, using directly');
    processedImageDataUrl = `data:image/png;base64,${apiResponse.result_image_base64}`;
  } else {
    console.log('No result image in API response, falling back to original image');
    processedImageDataUrl = originalImageDataUrl;
  }
  
  console.log('API response mapping complete');
  
  return {
    originalImage: originalImageDataUrl,
    processedImage: processedImageDataUrl,
    analysis
  };
}

// Helper function to create default analysis when API data is missing
function createDefaultAnalysis(): SutureAnalysis {
  return {
    isParallel: false,
    isEquallySpaced: false,
    sutureCount: 0,
    sutures: [],
    score: 0,
    feedback: ['No analysis data available']
  };
}

export async function POST(request: NextRequest) {
  console.log('POST request received at /api/analyze-suture');
  
  try {
    // Get data from the request
    console.log('Extracting form data from request');
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      console.error('No image provided in request');
      return NextResponse.json({ error: 'Image was not provided' }, { status: 400 });
    }

    console.log(`Image received: ${imageFile.name}, type: ${imageFile.type}, size: ${imageFile.size} bytes`);

    // Convert image to base64 format for our frontend display
    console.log('Converting image to base64');
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const originalImageDataUrl = `data:${imageFile.type};base64,${base64Image}`;
    console.log('Image converted to base64');

    // Create a new FormData to send to the Python API
    console.log('Preparing request for Python backend');
    const apiFormData = new FormData();
    apiFormData.append('image', imageFile);
    
    // Send the request to the Python API
    const apiUrl = "https://dragonhack-2025.fly.dev/process_image";
    console.log(`Sending request to Python API: ${apiUrl}`);
    
    const startTime = Date.now();
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: apiFormData,
    });
    const endTime = Date.now();
    console.log(`API response received in ${endTime - startTime}ms, status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', response.status, errorText);
      return NextResponse.json({ 
        error: `API returned error: ${response.status} ${response.statusText}` 
      }, { status: 502 });
    }
    
    // Parse the API response
    console.log('Parsing API response');
    const apiResponseData = await response.json();
    console.log('API response structure:', Object.keys(apiResponseData));
    
    if (apiResponseData.result_image_base64) {
      console.log('Processed image received from backend');
    } else {
      console.warn('No processed image in API response');
    }
    
    // Add the original image to the API response for mapping
    apiResponseData.original_image = originalImageDataUrl;
    
    // Map the API response to our frontend format
    console.log('Mapping API response to frontend format');
    const frontendResponse = mapApiResponseToFrontendFormat(apiResponseData);
    console.log('Response mapping complete');

    // Return results
    console.log('Returning response to frontend');
    return NextResponse.json(frontendResponse);

  } catch (error) {
    console.error('Error analyzing image:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json({ error: 'An error occurred while analyzing the image' }, { status: 500 });
  }
} 