import { NextRequest } from "next/server";
import { getServerToken } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { chatbotApi } from "@/lib/api-client";

// Initialize the Gemini API with the stable SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

// --- Tool Definitions for Gemini ---
const tools = [
  {
    functionDeclarations: [
      {
        name: "get_my_token_summary",
        description: "Mengambil ringkasan saldo token, tier, dan status eligibilitas saya saat ini.",
      },
      {
        name: "get_my_redemption_history",
        description: "Melihat daftar riwayat penukaran hadiah terakhir saya.",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: { type: "NUMBER", description: "Jumlah riwayat yang ingin ditampilkan (default 5)." }
          }
        }
      },
      {
        name: "get_reward_catalog",
        description: "Mencari daftar hadiah yang tersedia untuk ditukarkan.",
        parameters: {
          type: "OBJECT",
          properties: {
            maxPrice: { type: "NUMBER", description: "Filter hadiah dengan harga token maksimal tertentu." },
            category: { type: "STRING", description: "Filter berdasarkan kategori hadiah." }
          }
        }
      },
      {
        name: "get_reward_detail",
        description: "Melihat detail spesifik tentang suatu hadiah berdasarkan namanya.",
        parameters: {
          type: "OBJECT",
          properties: {
            rewardName: { type: "STRING", description: "Nama hadiah yang ingin dicari detailnya." }
          },
          required: ["rewardName"]
        }
      },
      {
        name: "get_team_overview",
        description: "Sebagai Team Leader, melihat statistik ringkas anggota tim di divisi saya.",
      },
      {
        name: "get_global_pending_actions",
        description: "Sebagai Admin HC, melihat jumlah tugas penukaran atau klaim yang menunggu persetujuan secara global.",
      }
    ]
  }
];

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Authentication
    const token = await getServerToken();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    
    const body = await req.json();
    const { messages, userRole = "MITRA", userName = "User" } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("your_google_ai")) {
      return mockStreamResponse("Saya adalah AI Mock. Konfigurasi API Key belum benar.");
    }

    // 2. Build System Prompt based on Role
    let systemInstruction = `Anda adalah asisten virtual bernama "LoyaltyBot" untuk program loyalitas karyawan. Jawablah dengan ramah, profesional, dan dalam bahasa Indonesia. Nama pengguna adalah ${userName}. Anda memiliki akses ke beberapa fungsi (tools) untuk mengambil data asli dari database program loyalitas secara real-time. `;
    
    if (userRole === "HC_PM") {
      systemInstruction += "Anda berbicara dengan HC Admin (Pengelola Program). Anda dapat membantu mereka memahami cara menyetujui penukaran (redemption), mengelola status mitra, dan melihat analitik token secara global.";
    } else if (userRole === "TEAM_LEADER") {
      systemInstruction += "Anda berbicara dengan Team Leader. Anda dapat membantu mereka memonitor performa tim mereka, melihat sisa token tim, dan memberikan tips untuk meningkatkan loyalitas tim.";
    } else {
      systemInstruction += "Anda berbicara dengan Mitra/Karyawan. Anda dapat membantu mereka memahami cara mendapatkan token, menukarkan reward, dan melihat status penukaran mereka sendiri.";
    }

    systemInstruction += "\n\nBatasan: Jangan pernah memberikan informasi sensitif pengguna lain kecuali Anda berbicara dengan role yang berwenang (seperti Leader melihat timnya sendiri atau Admin melihat data global). Jika ada fungsi yang gagal atau data tidak ditemukan, sampaikan dengan sopan.";

    // 3. Initialize Model with Tools
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      systemInstruction: systemInstruction,
      tools: tools as any,
    });

    // 4. Robust cleaning for Gemini API: 
    // - Must start with 'user'
    // - Roles must alternate (user, model, user, model...)
    const rawHistory = messages.slice(0, -1).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const history: any[] = [];
    rawHistory.forEach((msg: any) => {
      if (history.length === 0) {
        if (msg.role === "user") {
          history.push(msg);
        }
      } else {
        const lastMsg = history[history.length - 1];
        if (lastMsg.role === msg.role) {
          lastMsg.parts[0].text += "\n" + msg.parts[0].text;
        } else {
          history.push(msg);
        }
      }
    });

    let latestMessageContent = messages[messages.length - 1].content;
    // Ensure the last message in history is 'model' before sending a new 'user' message
    if (history.length > 0 && history[history.length - 1].role === "user") {
      const lastUserMsg = history.pop();
      latestMessageContent = lastUserMsg.parts[0].text + "\n" + latestMessageContent;
    }

    // 5. Start Chat
    const chat = model.startChat({
      history: history,
      generationConfig: {
        temperature: 0.7,
      },
    });

    // --- Handling Function Calling (Recursive / Loop) ---
    let response = await chat.sendMessage(latestMessageContent);
    let functionCalls = response.response.functionCalls();

    if (functionCalls) {
      const functionResponses = [];
      
      for (const call of functionCalls) {
        console.log(`[Chatbot] AI requested tool: ${call.name}`, call.args);
        
        try {
          // Execute the tool via our Backend API
          const toolResult = await chatbotApi.executeTool(token, call.name, call.args);
          
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { content: toolResult }
            }
          });
        } catch (error) {
          console.error(`[Chatbot] Tool execution failed: ${call.name}`, error);
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: "Gagal mengambil data dari database." }
            }
          });
        }
      }

      // Send the function results back to the model for the final response
      const finalResult = await chat.sendMessageStream(functionResponses);
      return createStreamResponse(finalResult);
    }

    // Fallback: If no tools were called, return the response as a stream
    return mockStreamResponse(response.response.text());

  } catch (error: any) {
    console.error("[Chatbot Route Error]:", error);
    const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
    const status = error?.status || 500;

    if (status === 429 || errorMessage.includes("429")) {
      return new Response(JSON.stringify({ error: "API Quota Exceeded. Silakan coba lagi nanti." }), { status: 429 });
    }

    if (status === 404 || errorMessage.includes("404")) {
      return new Response(JSON.stringify({ error: "Model AI tidak ditemukan. Cek konfigurasi GEMINI_MODEL." }), { status: 404 });
    }

    return new Response(JSON.stringify({ error: "Internal Server Error", details: errorMessage }), { status: 500 });
  }
}

/**
 * Helper to create a streaming response for the frontend (SSE)
 */
function createStreamResponse(result: any) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          const data = JSON.stringify({ text: chunkText });
          await writer.write(encoder.encode(`data: ${data}\n\n`));
        }
      }
      await writer.write(encoder.encode(`data: [DONE]\n\n`));
      await writer.close();
    } catch (err: any) {
      console.error("[Chatbot Stream Error]:", err);
      const errorMsg = JSON.stringify({ error: "Terjadi kesalahan saat streaming jawaban." });
      await writer.write(encoder.encode(`data: ${errorMsg}\n\n`));
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

function mockStreamResponse(message: string) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  (async () => {
    try {
      const words = message.split(" ");
      for (const word of words) {
        // Simple delay to simulate streaming
        await new Promise((r) => setTimeout(r, 50));
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
