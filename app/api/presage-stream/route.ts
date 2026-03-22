import { NextResponse } from "next/server";

export async function GET() {
  const encoder = new TextEncoder();
  
  const customReadable = new ReadableStream({
    start(controller) {
      // Simulate the Presage C++ Engine processing 1 frame per second
      const interval = setInterval(() => {
        // Generates a realistic resting heart rate (65-75 BPM) and breathing rate (12-16 BPM)
        const mockPulse = (65 + Math.random() * 10).toFixed(1);
        const mockBreathing = (12 + Math.random() * 4).toFixed(1);
        
        // This is the exact JSON structure your C++ app would pipe out!
        const payload = JSON.stringify({ pulse: mockPulse, breathing: mockBreathing });
        
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      }, 1000);

      // Clean up when the user closes the Aura Lens
      return () => clearInterval(interval);
    }
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
