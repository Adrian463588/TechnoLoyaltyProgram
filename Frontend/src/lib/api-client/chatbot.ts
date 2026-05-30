import { fetchWithAuth } from "./fetch-wrapper";

export const chatbotApi = {
  /**
   * Executes a database tool via the backend
   * @param toolName The name of the tool to execute
   * @param args Arguments for the tool
   * @param token Authentication token
   */
  executeTool: async (toolName: string, args: any, token: string) => {
    return fetchWithAuth("/api/chatbot/execute-tool", {
      method: "POST",
      body: JSON.stringify({ toolName, args }),
    }, token);
  },
};
