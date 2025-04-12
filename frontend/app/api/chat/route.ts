import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const runtime = 'edge';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Messages array is missing or invalid' }, { status: 400 });
    }

    // Create a system message defining the assistant's role
    const system = 'You are a medical education AI assistant specialized in helping medical students practice suturing techniques. You can provide detailed feedback on suture placement, technique, and suggestions for improvement based on medical best practices. Be concise, educational, and supportive.'

    // Create the prompt
    const result = streamText({
      model: google('gemini-2.0-flash'),
      system,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error processing message:', error);
    return Response.json({ error: 'An error occurred while processing the message' }, { status: 500 });
  }
}
