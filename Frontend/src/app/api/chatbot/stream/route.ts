import { NextRequest } from "next/server";
import { getServerToken } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

// Optional: Use Redis for history, but for simplicity we'll just allow the client 
// to pass the conversation history in the request payload for this demo.
// A production app would store this securely on the server.

export async function POST(req: NextRequest) {
  try {
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || "missing"
    });
    // 1. Verify Authentication
    const token = await getServerToken();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    
    // In a real scenario, we decode the JWT token to get the user's role and ID.
    // For this demo, we'll extract it from the client payload or assume MITRA.
    const body = await req.json();
    const { messages, userRole = "MITRA", userName = "User" } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_google_ai_api_key_here") {
      // MOCK MODE: If no real API key is provided, return a simulated stream.
      return mockStreamResponse("Saya adalah AI Mock. Anda belum memasukkan GEMINI_API_KEY di .env. Silakan masukkan key untuk melihat respons asli!");
    }

    // 2. Build System Prompt based on Role
    let systemInstruction = `Anda adalah asisten virtual bernama "LoyaltyBot" untuk program loyalitas karyawan. Jawablah dengan ramah, profesional, dan dalam bahasa Indonesia. Nama pengguna adalah ${userName}. `;
    
    if (userRole === "HC_PM") {
      systemInstruction += "Anda berbicara dengan HC Admin (Pengelola Program). Anda dapat membantu mereka memahami cara menyetujui penukaran (redemption), mengelola status mitra, dan melihat analitik token.";
    } else if (userRole === "TEAM_LEADER") {
      systemInstruction += "Anda berbicara dengan Team Leader. Anda dapat membantu mereka memonitor performa tim mereka, melihat siapa yang aktif mendapatkan token, dan memberikan tips untuk meningkatkan loyalitas tim.";
    } else {
      systemInstruction += "Anda berbicara dengan Mitra/Karyawan. Anda dapat membantu mereka memahami cara mendapatkan token, menukarkan reward, dan melihat status penukaran mereka.";
    }

    systemInstruction += "\n\nBatasan: Jangan pernah memberikan informasi sensitif pengguna lain. Jika Anda tidak tahu jawabannya, katakan saja Anda tidak tahu dan arahkan mereka untuk menghubungi tim HC.";

    // 3. Convert messages to Gemini format
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // 4. Call Gemini API with Streaming
    const responseStream = await ai.models.generateContentStream({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    // 5. Create a TransformStream to convert Gemini chunks to Server-Sent Events (SSE)
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Process stream asynchronously
    (async () => {
      try {
        for await (const chunk of responseStream) {
          if (chunk.text) {
            // SSE format: data: <payload>\n\n
            const data = JSON.stringify({ text: chunk.text });
            await writer.write(encoder.encode(`data: ${data}\n\n`));
          }
        }
        await writer.write(encoder.encode(`data: [DONE]\n\n`));
        await writer.close();
      } catch (err: any) {
        console.error("[Chatbot Stream Error]:", err);
        
        // If quota exceeded during streaming
        if (err.status === 429 || err.message?.includes("429") || err.message?.includes("quota")) {
          const errorMsg = JSON.stringify({ error: "Quota Gemini habis. Mohon tunggu sebentar." });
          await writer.write(encoder.encode(`data: ${errorMsg}\n\n`));
        }
        
        await writer.abort(err);
      }
    })();

    // 6. Return the stream response
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("[Chatbot Route Error]:", error);
    
    // Menangkap pesan error spesifik dari Google API
    const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
    
    return new Response(JSON.stringify({ 
      error: "Internal Server Error",
      details: errorMessage
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// --- Helper for Mock Mode ---
function mockStreamResponse(message: string) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  const words = message.split(" ");
  
  (async () => {
    try {
      for (const word of words) {
        await new Promise((r) => setTimeout(r, 100)); // simulate 100ms per word
        const data = JSON.stringify({ text: word + " " });
        await writer.write(encoder.encode(`data: ${data}\n\n`));
      }
      await writer.write(encoder.encode(`data: [DONE]\n\n`));
      await writer.close();
    } catch (err) {
      await writer.abort(err);
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
