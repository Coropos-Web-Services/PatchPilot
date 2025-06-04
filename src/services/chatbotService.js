import { invoke } from '@tauri-apps/api/core';

export class ChatbotService {
  async ask(question) {
    try {
      const response = await invoke('ask_question', { question });
      return { success: true, response };
    } catch (error) {
      console.error('Chatbot failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export const chatbotService = new ChatbotService();
