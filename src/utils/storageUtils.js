// Storage utility for chat persistence
// In the browser we fall back to localStorage. When running inside Tauri we
// store large file contents on disk using the fs plugin and only persist file
// metadata in localStorage. This avoids localStorage quota issues.

import { writeTextFile, readTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';

const isTauri = typeof window !== 'undefined' && window.__TAURI__;
const DATA_DIR = 'patchpilot_files';

const STORAGE_KEYS = {
  CHATS: 'patchpilot_chats',
  CURRENT_CHAT: 'patchpilot_current_chat',
  CHAT_FILES: 'patchpilot_chat_files',
  APP_SETTINGS: 'patchpilot_settings'
};

export const storageUtils = {
  // Save all chats to storage
  saveChats: (chats) => {
    try {
      const chatsToSave = chats.map(chat => ({
        ...chat,
        // Convert timestamp to string for storage
        lastModified: typeof chat.lastModified === 'number' ? chat.lastModified : Date.now(),
        messages: chat.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.getTime() : msg.timestamp
        }))
      }));
      
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chatsToSave));
      console.log('✅ Chats saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to save chats:', error);
      return false;
    }
  },

  // Load all chats from storage
  loadChats: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHATS);
      if (!stored) return [];
      
      const chats = JSON.parse(stored);
      
      // Convert timestamps back to proper types
      return chats.map(chat => ({
        ...chat,
        lastModified: typeof chat.lastModified === 'string' ? parseInt(chat.lastModified) : chat.lastModified,
        messages: chat.messages.map(msg => ({
          ...msg,
          timestamp: new Date(typeof msg.timestamp === 'string' ? parseInt(msg.timestamp) : msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('❌ Failed to load chats:', error);
      return [];
    }
  },

  // Save current chat ID
  saveCurrentChatId: (chatId) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT, chatId);
      return true;
    } catch (error) {
      console.error('❌ Failed to save current chat ID:', error);
      return false;
    }
  },

  // Load current chat ID
  loadCurrentChatId: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT);
    } catch (error) {
      console.error('❌ Failed to load current chat ID:', error);
      return null;
    }
  },

  // Save chat files (organized by chat ID)
  saveChatFiles: async (chatId, files) => {
    try {
      const allChatFiles = storageUtils.loadAllChatFiles();
      const meta = [];

      if (isTauri) {
        await mkdir(`${DATA_DIR}/${chatId}`, { dir: BaseDirectory.AppData, recursive: true });
      }

      for (const file of files) {
        const base = {
          id: file.id,
          name: file.name,
          path: file.path,
          extension: file.extension,
          size: file.size,
          addedAt: typeof file.addedAt === 'number' ? file.addedAt : Date.now(),
          lastModified: typeof file.lastModified === 'number' ? file.lastModified : Date.now()
        };

        if (isTauri && file.content) {
          const storagePath = `${DATA_DIR}/${chatId}/${file.id}_${file.name}`;
          await writeTextFile(storagePath, file.content, { dir: BaseDirectory.AppData });
          meta.push({ ...base, storagePath });
        } else {
          meta.push({ ...base, content: file.content });
        }
      }

      allChatFiles[chatId] = meta;
      localStorage.setItem(STORAGE_KEYS.CHAT_FILES, JSON.stringify(allChatFiles));
      return true;
    } catch (error) {
      console.error('❌ Failed to save chat files:', error);
      return false;
    }
  },

  // Load files for a specific chat
  loadChatFiles: async (chatId) => {
    try {
      const allChatFiles = storageUtils.loadAllChatFiles();
      const stored = allChatFiles[chatId] || [];

      const files = [];
      for (const f of stored) {
        let content = f.content || '';
        if (!content && isTauri && f.storagePath) {
          try {
            content = await readTextFile(f.storagePath, { dir: BaseDirectory.AppData });
          } catch (err) {
            console.warn('Failed to read stored file', f.storagePath, err);
          }
        }
        files.push({ ...f, content });
      }

      return files;
    } catch (error) {
      console.error('❌ Failed to load chat files:', error);
      return [];
    }
  },

  // Load all chat files
  loadAllChatFiles: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_FILES);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ Failed to load all chat files:', error);
      return {};
    }
  },

  // Delete files for a specific chat
  deleteChatFiles: (chatId) => {
    try {
      const allChatFiles = storageUtils.loadAllChatFiles();
      delete allChatFiles[chatId];
      localStorage.setItem(STORAGE_KEYS.CHAT_FILES, JSON.stringify(allChatFiles));
      return true;
    } catch (error) {
      console.error('❌ Failed to delete chat files:', error);
      return false;
    }
  },

  // Save app settings
  saveSettings: (settings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      return false;
    }
  },

  // Load app settings
  loadSettings: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      const defaults = {
        sidebarOpen: true,
        fileTrackerOpen: true,
        internetAccess: false,
        theme: 'dark'
      };
      if (!stored) return defaults;
      const parsed = JSON.parse(stored);
      return { ...defaults, ...parsed };
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      return {
        sidebarOpen: true,
        fileTrackerOpen: true,
        internetAccess: false,
        theme: 'dark'
      };
    }
  },

  // Clear all storage (for reset functionality)
  clearAll: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('✅ All storage cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear storage:', error);
      return false;
    }
  },

  // Export data for backup
  exportData: () => {
    try {
      const data = {
        chats: storageUtils.loadChats(),
        currentChatId: storageUtils.loadCurrentChatId(),
        chatFiles: storageUtils.loadAllChatFiles(),
        settings: storageUtils.loadSettings(),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      return null;
    }
  },

  // Import data from backup
  importData: (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.chats) {
        storageUtils.saveChats(data.chats);
      }
      
      if (data.currentChatId) {
        storageUtils.saveCurrentChatId(data.currentChatId);
      }
      
      if (data.chatFiles) {
        localStorage.setItem(STORAGE_KEYS.CHAT_FILES, JSON.stringify(data.chatFiles));
      }
      
      if (data.settings) {
        storageUtils.saveSettings(data.settings);
      }
      
      console.log('✅ Data imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to import data:', error);
      return false;
    }
  },

  // Get storage statistics
  getStorageStats: () => {
    try {
      const chats = storageUtils.loadChats();
      const allFiles = storageUtils.loadAllChatFiles();
      
      let totalMessages = 0;
      let totalFiles = 0;
      let totalFileSize = 0;
      
      chats.forEach(chat => {
        totalMessages += chat.messages?.length || 0;
      });
      
      Object.values(allFiles).forEach(chatFiles => {
        totalFiles += chatFiles.length;
        chatFiles.forEach(file => {
          totalFileSize += file.size || 0;
        });
      });
      
      return {
        totalChats: chats.length,
        totalMessages,
        totalFiles,
        totalFileSize: Math.round(totalFileSize / 1024), // KB
        storageUsed: Math.round(JSON.stringify({
          chats,
          files: allFiles
        }).length / 1024) // KB
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return {
        totalChats: 0,
        totalMessages: 0,
        totalFiles: 0,
        totalFileSize: 0,
        storageUsed: 0
      };
    }
  }
};
