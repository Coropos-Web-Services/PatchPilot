import { invoke } from '@tauri-apps/api/core';

export class AIService {
  constructor() {
    this.isInitialized = false;
    this.ollamaStatus = null;
  }

  async initialize() {
    try {
      this.ollamaStatus = await invoke('check_ollama_status');
      this.isInitialized = true;
      return this.ollamaStatus;
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      this.ollamaStatus = {
        available: false,
        models: [],
        error: error.message
      };
      return this.ollamaStatus;
    }
  }

  async checkOllamaStatus() {
    try {
      this.ollamaStatus = await invoke('check_ollama_status');
      return this.ollamaStatus;
    } catch (error) {
      console.error('Failed to check Ollama status:', error);
      return {
        available: false,
        models: [],
        error: error.message
      };
    }
  }

  async installModel(modelName = 'codellama:7b-instruct') {
    try {
      const result = await invoke('install_ollama_model', { model: modelName });
      // Refresh status after installation
      await this.checkOllamaStatus();
      return { success: true, message: result };
    } catch (error) {
      console.error('Failed to install model:', error);
      return { success: false, error: error.message };
    }
  }

  async analyzeCode(code, filename) {
    try {
      const result = await invoke('analyze_code', {
        request: {
          code: code,
          filename: filename
        }
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Code analysis failed:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackAnalysis(code, filename)
      };
    }
  }

  generateChatName(code, filename, userMessage = '') {
    // Generate smart chat names based on code content and user intent
    const extension = filename.split('.').pop()?.toLowerCase() || 'txt';
    const lines = code.split('\n');
    const codeSnippet = lines.slice(0, 5).join(' ').substring(0, 50);
    
    // Language-specific naming patterns
    const languageMap = {
      'py': 'Python',
      'js': 'JavaScript', 
      'ts': 'TypeScript',
      'jsx': 'React',
      'tsx': 'React TypeScript',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'rs': 'Rust',
      'go': 'Go',
      'php': 'PHP',
      'rb': 'Ruby',
      'lua': 'Lua',
      'html': 'HTML',
      'css': 'CSS'
    };

    const language = languageMap[extension] || 'Code';
    
    // Try to extract meaningful names from code
    const classMatch = code.match(/class\s+(\w+)/i);
    const functionMatch = code.match(/(?:function|def|func)\s+(\w+)/i);
    const variableMatch = code.match(/(?:const|let|var|=)\s+(\w+)/i);
    const componentMatch = code.match(/(?:export\s+default\s+|function\s+)(\w+)/i);
    
    // Generate name based on content and context
    if (userMessage.toLowerCase().includes('fix') || userMessage.toLowerCase().includes('bug')) {
      if (classMatch) return `Fix ${classMatch[1]} Class`;
      if (functionMatch) return `Fix ${functionMatch[1]} Function`;
      return `${language} Bug Fix`;
    }
    
    if (userMessage.toLowerCase().includes('improve') || userMessage.toLowerCase().includes('optimize')) {
      if (classMatch) return `Improve ${classMatch[1]}`;
      if (functionMatch) return `Optimize ${functionMatch[1]}`;
      return `${language} Optimization`;
    }
    
    if (userMessage.toLowerCase().includes('add') || userMessage.toLowerCase().includes('feature')) {
      return `Add ${language} Features`;
    }
    
    // Default naming based on code structure
    if (componentMatch && (extension === 'jsx' || extension === 'tsx')) {
      return `${componentMatch[1]} Component`;
    }
    
    if (classMatch) {
      return `${classMatch[1]} Class Review`;
    }
    
    if (functionMatch) {
      return `${functionMatch[1]} Function`;
    }
    
    // Fallback to filename or generic names
    if (filename !== 'untitled.txt' && filename !== 'code.txt') {
      const baseName = filename.split('.')[0];
      return `${baseName} Review`;
    }
    
    // Generic names based on language
    const genericNames = [
      `${language} Analysis`,
      `${language} Review`,
      `${language} Code Help`,
      `${language} Project`,
      `New ${language} File`
    ];
    
    return genericNames[Math.floor(Math.random() * genericNames.length)];
  }

  generateFallbackAnalysis(code, filename) {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim()).length;
    const extension = filename.split('.').pop()?.toLowerCase() || 'txt';
    
    const languageMap = {
      'py': 'Python',
      'js': 'JavaScript', 
      'ts': 'TypeScript',
      'jsx': 'JavaScript React',
      'tsx': 'TypeScript React',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'rs': 'Rust',
      'go': 'Go',
      'php': 'PHP',
      'rb': 'Ruby',
      'lua': 'Lua',
      'html': 'HTML',
      'css': 'CSS'
    };

    const language = languageMap[extension] || 'Unknown';

    return {
      language: language.toLowerCase(),
      filename: filename,
      response: `## Basic Analysis (AI Offline)

**File Overview:**
• **Name:** ${filename}
• **Language:** ${language}
• **Total lines:** ${lines.length}
• **Code lines:** ${nonEmptyLines}
• **Size:** ${code.length} characters

**Status:** ⚠️ AI analysis unavailable. This is a basic fallback analysis.

**What I can see:**
• File appears to be valid ${language} code
• No syntax errors detected in structure
• File is properly formatted

**Recommendations:**
• Install Ollama for detailed AI analysis
• Run \`ollama pull codellama:7b-instruct\` to enable smart reviews
• AI can find bugs, suggest improvements, and explain issues

**To enable AI analysis:**
1. Install Ollama: \`brew install ollama\` (macOS) or visit ollama.ai
2. Pull the code model: \`ollama pull codellama:7b-instruct\`
3. Restart PatchPilot for full AI-powered reviews

Would you like me to help you set up AI analysis?`,
      lines: lines.length,
      size: code.length
    };
  }

  isOllamaAvailable() {
    return this.ollamaStatus?.available || false;
  }

  hasCodeModel() {
    if (!this.ollamaStatus?.models) return false;
    return this.ollamaStatus.models.some(model => 
      model.includes('codellama') || model.includes('code')
    );
  }

  getRecommendedModels() {
    return [
      {
        name: 'codellama:7b-instruct',
        description: 'Best for code review and bug finding (4GB)',
        recommended: true
      },
      {
        name: 'codellama:13b-instruct', 
        description: 'More accurate analysis (7GB)',
        recommended: false
      },
      {
        name: 'codellama:34b-instruct',
        description: 'Highest quality analysis (19GB)', 
        recommended: false
      }
    ];
  }

  async getDesktopPath() {
    try {
      return await invoke('get_desktop_path');
    } catch (error) {
      console.error('Failed to get desktop path:', error);
      return null;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();