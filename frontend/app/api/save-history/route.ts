import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // In a real application, this data would be stored in a database
    // For now we're just simulating successful storage
    
    const data = await request.json();
    
    if (!data || !data.assessment) {
      return NextResponse.json({ error: 'Assessment data is missing' }, { status: 400 });
    }
    
    // In a real application we would perform data validation and database storage here
    
    // Simulate a small delay as we would have with an actual database
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Assessment was successfully saved',
      id: `history_${Date.now()}` // Generate a random ID that we would otherwise get from the database
    });
    
  } catch (error) {
    console.error('Error saving history:', error);
    return NextResponse.json({ error: 'An error occurred while saving the assessment' }, { status: 500 });
  }
} 