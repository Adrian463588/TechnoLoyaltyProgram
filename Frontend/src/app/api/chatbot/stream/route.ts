import { NextRequest } from "next/server";
import { getServerToken } from "@/lib/auth";
import { chatbotApi } from "@/lib/api-client";
import { GoogleGenAI } from "@google/genai";

// --- Tool Definitions for Gemini ---
const ALL_TOOLS = [
  {
    name: "get_my_token_summary",
    description: "Mengambil ringkasan saldo token, tier, dan status eligibilitas saya saat ini.",
    role: ["MITRA", "TEAM_LEADER", "HC_PM"]
  },
  {
    name: "get_my_redemption_history",
    description: "Melihat daftar riwayat penukaran hadiah terakhir saya.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "NUMBER", description: "Jumlah riwayat yang ingin ditampilkan (default 5)." }
      }
    },
    role: ["MITRA", "TEAM_LEADER", "HC_PM"]
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
    },
    role: ["MITRA", "TEAM_LEADER", "HC_PM"]
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
    },
    role: ["MITRA", "TEAM_LEADER", "HC_PM"]
  },
  {
    name: "get_team_overview",
    description: "Sebagai Team Leader, melihat statistik ringkas anggota tim di divisi saya.",
    role: ["TEAM_LEADER", "HC_PM"]
  },
  {
    name: "get_token_leaderboard",
    description: "Melihat daftar peringkat mitra dengan saldo token terbanyak. Bisa difilter berdasarkan divisi.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "NUMBER", description: "Jumlah peringkat yang ingin ditampilkan (default 10)." },
        division: { type: "STRING", description: "Filter berdasarkan nama divisi tertentu." }
      }
    },
    role: ["TEAM_LEADER", "HC_PM"]
  },
  {
    name: "get_global_pending_actions",
    description: "Sebagai Admin HC, melihat jumlah tugas penukaran atau klaim yang menunggu persetujuan secara global.",
    role: ["HC_PM"]
  }
];
export async function POST(req: NextRequest) {
  let modelName = "gemini-2.0-flash";
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

    // --- Guard: validate GEMINI_API_KEY before calling API ---
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey.length < 10 || apiKey.includes("your_google_ai")) {
      console.warn("[Chatbot] GEMINI_API_KEY is missing or invalid. Returning mock response.");
      return mockStreamResponse("Chatbot AI belum dikonfigurasi. Hubungi administrator.");
    }

    // --- Filter Tools based on User Role ---
    const allowedTools = ALL_TOOLS
      .filter(t => (t as any).role.includes(userRole))
      .map(({ role, ...toolProps }) => toolProps);

    const toolsConfig = allowedTools.length > 0 ? [{ functionDeclarations: allowedTools }] : [];

    // 2. Build System Prompt based on Role
    let systemInstruction = `Anda adalah asisten virtual bernama "LoyaltyBot" untuk program loyalitas karyawan. Jawablah dengan ramah, profesional, dan dalam bahasa Indonesia. Nama pengguna adalah ${userName}. 

PERATURAN PENTING:
1. Anda WAJIB menggunakan fungsi (tools) yang tersedia untuk menjawab pertanyaan tentang saldo token, riwayat, katalog hadiah, atau data tim. 
2. JANGAN PERNAH menebak atau mengarang (halusinasi) angka saldo, tier, atau stok hadiah. Jika tidak tahu, panggil tool yang relevan.
3. Selalu periksa tool 'get_my_token_summary' terlebih dahulu jika pengguna bertanya tentang rekomendasi atau apa yang bisa mereka ambil.
4. Jika data dari tool tidak ditemukan, sampaikan bahwa data tidak tersedia di database.
5. Gunakan data asli dari database sebagai satu-satunya sumber kebenaran.
`;
    
    if (allowedTools.length > 0) {
      systemInstruction += "Anda memiliki akses ke fungsi (tools) real-time. Gunakan fungsi tersebut sekarang jika pertanyaan membutuhkan data spesifik. ";
    }

    if (userRole === "HC_PM") {
      systemInstruction += "Anda berbicara dengan HC Admin. Bantu mereka mengelola penukaran dan status mitra.";
    } else if (userRole === "TEAM_LEADER") {
      systemInstruction += "Anda berbicara dengan Team Leader. Bantu mereka memonitor saldo token tim dan statistik divisi.";
    } else {
      systemInstruction += "Anda berbicara dengan Mitra/Karyawan. Bantu mereka cek saldo, riwayat, dan katalog hadiah.";
    }

    systemInstruction += "\n\nBatasan: Jangan memberikan informasi sensitif user lain. Jika data tidak ditemukan, sampaikan dengan sopan.";

    // 3. Initialize Model using the new @google/genai SDK
    const ai = new GoogleGenAI({ apiKey: apiKey });
    modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
    console.log(`[Chatbot] Using model: ${modelName}`);

    // 4. Robust cleaning for Gemini API: Diet Context (Last 4 messages)
    const MAX_HISTORY = 4;
    const recentMessages = messages.slice(-MAX_HISTORY - 1, -1);
    
    const rawHistory = recentMessages.map((m: any) => ({
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
    if (history.length > 0 && history[history.length - 1].role === "user") {
      const lastUserMsg = history.pop();
      latestMessageContent = lastUserMsg.parts[0].text + "\n" + latestMessageContent;
    }

    // 5. Send message with retry logic using new SDK
    let response: any;
    let retries = 0;
    const MAX_RETRIES = 2;

    const formattedContents = [
      ...history,
      { role: "user", parts: [{ text: latestMessageContent }] }
    ];

    while (retries <= MAX_RETRIES) {
      try {
        console.log(`[Chatbot] Sending message to Gemini (Attempt ${retries + 1})...`);
        const startCall = Date.now();
        response = await ai.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.1,
            tools: toolsConfig.length > 0 ? toolsConfig as any : undefined,
          },
        });
        console.log(`[Chatbot] Gemini responded in: ${Date.now() - startCall}ms`);
        break;
      } catch (err: any) {
        const is503 = err?.status === 503 || err?.message?.includes("503") || err?.message?.includes("high demand");
        if (is503 && retries < MAX_RETRIES) {
          retries++;
          const delay = 2000 * retries;
          console.warn(`[Chatbot] Gemini Busy (503). Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }

    const functionCalls = response?.candidates?.[0]?.content?.parts
      ?.filter((p: any) => p.functionCall)
      .map((p: any) => p.functionCall) ?? [];

    if (functionCalls.length > 0 && allowedTools.length > 0) {
      const toolStartTime = Date.now();
      
      // Execute all tool calls in PARALLEL for maximum performance
      const functionResponses = await Promise.all(functionCalls.map(async (call: any) => {
        const isAuthorized = ALL_TOOLS.find(t => t.name === call.name && (t as any).role.includes(userRole));
        
        if (!isAuthorized) {
          console.warn(`[Chatbot] AI tried to call unauthorized tool: ${call.name}`);
          return {
            functionResponse: {
              name: call.name,
              response: { error: "Unauthorized" }
            }
          };
        }

        try {
          const apiCallStart = Date.now();
          const toolResult = await chatbotApi.executeTool(token, call.name, call.args);
          console.log(`[Chatbot] Parallel Tool ${call.name} took: ${Date.now() - apiCallStart}ms`);
          
          return {
            functionResponse: {
              name: call.name,
              response: { content: toolResult }
            }
          };
        } catch (error) {
          console.error(`[Chatbot] Tool ${call.name} failed`, error);
          return {
            functionResponse: {
              name: call.name,
              response: { error: "Failed to fetch data" }
            }
          };
        }
      }));

      console.log(`[Chatbot] All tools (${functionCalls.length}) finished in parallel: ${Date.now() - toolStartTime}ms`);

      // Send function responses back to Gemini for final answer
      const followUpContents = [
        ...formattedContents,
        { role: "model", parts: response.candidates[0].content.parts },
        { role: "user", parts: functionResponses.map((fr: any) => ({ functionResponse: fr.functionResponse })) },
      ];

      const streamStartTime = Date.now();
      const finalResponse = await ai.models.generateContentStream({
        model: modelName,
        contents: followUpContents,
        config: { systemInstruction, temperature: 0.1 },
      });
      console.log(`[Chatbot] Final stream start took: ${Date.now() - streamStartTime}ms`);
      return createStreamResponse(finalResponse);
    }

    const textResponse = response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return mockStreamResponse(textResponse);

  } catch (error: any) {
    console.error("[Chatbot Route Error]:", error);
    const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
    const status = error?.status || 500;

    if (status === 429 || errorMessage.includes("429")) {
      return new Response(JSON.stringify({ error: "API Quota Exceeded. Silakan coba lagi nanti." }), { status: 429 });
    }

    if (status === 503 || errorMessage.includes("503") || errorMessage.includes("high demand")) {
      return new Response(JSON.stringify({ error: "Server AI sedang sibuk (High Demand). Silakan coba lagi dalam beberapa saat." }), { status: 503 });
    }

    if (status === 404 || errorMessage.includes("404") || errorMessage.includes("models/")) {
      return new Response(JSON.stringify({ error: `Model AI (${modelName}) tidak ditemukan. Cek konfigurasi GEMINI_MODEL.` }), { status: 404 });
    }

    if (status === 400 || errorMessage.includes("400") || errorMessage.toUpperCase().includes("API_KEY_INVALID")) {
      return new Response(JSON.stringify({ error: "API Key Gemini tidak valid. Hubungi administrator." }), { status: 400 });
    }

    if (status === 401 || errorMessage.includes("401") || errorMessage.toLowerCase().includes("unauthorized")) {
      return new Response(JSON.stringify({ error: "Autentikasi API Gemini gagal. Cek konfigurasi GEMINI_API_KEY." }), { status: 401 });
    }

    return new Response(JSON.stringify({ error: "Internal Server Error", details: errorMessage }), { status: 500 });
  }
}

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
