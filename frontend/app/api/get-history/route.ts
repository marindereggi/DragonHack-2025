import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// This is just a simulated example - in a real application we would get data from a database
const mockHistoryItems = [
  {
    id: 'history_1',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    filename: 'suture_sample_1.jpg',
    score: 78,
    imageUrl: '/images/sample-suture-1.jpg' // This would be the path to the stored image
  },
  {
    id: 'history_2',
    timestamp: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), // 1 day ago
    filename: 'suture_sample_2.jpg',
    score: 85,
    imageUrl: '/images/sample-suture-2.jpg'
  },
  {
    id: 'history_3',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    filename: 'suture_sample_3.jpg',
    score: 92,
    imageUrl: '/images/sample-suture-3.jpg'
  }
];

export async function GET(request: NextRequest) {
  try {
    // In a real application we would make a database query here
    
    // Simulate a small delay as with an actual database
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock data
    return NextResponse.json({ 
      history: mockHistoryItems
    });
    
  } catch (error) {
    console.error('Error retrieving history:', error);
    return NextResponse.json({ error: 'An error occurred while retrieving history' }, { status: 500 });
  }
} 