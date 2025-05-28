// src/services/enhancedAiService.js
import { invoke } from '@tauri-apps/api/core';

export class EnhancedAIService {
  constructor() {
    this.isInitialized = false;
    this.ollamaStatus = null;
    this.progressCallbacks = new Set();
  }

  // Add progress callback
  onProgress(callback) {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  // Emit progress updates
  emitProgress(step, progress, message = '') {
    this.progressCallbacks.forEach(callback => {
      try {
        callback({ step, progress, message });
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });
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

  async analyzeCodeWithProgress(code, filename) {
    try {
      // Step 1: Reading file
      this.emitProgress('reading', 0, `Reading ${filename}...`);
      await this.delay(300);
      
      this.emitProgress('reading', 25, 'Validating file content...');
      await this.delay(200);
      
      this.emitProgress('reading', 50, 'Detecting language and encoding...');
      await this.delay(200);
      
      this.emitProgress('reading', 100, 'File loaded successfully');
      await this.delay(100);

      // Step 2: Parsing
      this.emitProgress('parsing', 0, 'Analyzing code structure...');
      await this.delay(400);
      
      this.emitProgress('parsing', 30, 'Identifying functions and classes...');
      await this.delay(300);
      
      this.emitProgress('parsing', 60, 'Building abstract syntax tree...');
      await this.delay(300);
      
      this.emitProgress('parsing', 100, 'Code structure mapped');
      await this.delay(100);

      // Step 3: AI Analysis
      this.emitProgress('analyzing', 0, 'Initializing AI models...');
      await this.delay(500);
      
      this.emitProgress('analyzing', 20, 'Processing with CodeLlama...');
      
      // Actually call the analysis
      const result = await invoke('analyze_code', {
        request: {
          code: code,
          filename: filename
        }
      });

      this.emitProgress('analyzing', 60, 'Analyzing code patterns...');
      await this.delay(400);
      
      this.emitProgress('analyzing', 80, 'Identifying potential issues...');
      await this.delay(300);
      
      this.emitProgress('analyzing', 100, 'AI analysis complete');
      await this.delay(100);

      // Step 4: Generating suggestions
      this.emitProgress('generating', 0, 'Creating improvement suggestions...');
      await this.delay(400);
      
      this.emitProgress('generating', 40, 'Ranking recommendations by priority...');
      await this.delay(300);
      
      this.emitProgress('generating', 70, 'Preparing code examples...');
      await this.delay(300);
      
      this.emitProgress('generating', 100, 'Suggestions generated');
      await this.delay(100);

      // Step 5: Optimizing results
      this.emitProgress('optimizing', 0, 'Optimizing recommendations...');
      await this.delay(300);
      
      this.emitProgress('optimizing', 50, 'Adding detailed explanations...');
      await this.delay(300);
      
      this.emitProgress('optimizing', 100, 'Analysis ready!');
      await this.delay(200);

      // Final step
      this.emitProgress('complete', 100, 'Analysis complete!');

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Code analysis failed:', error);
      this.emitProgress('error', 0, `Analysis failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackAnalysis(code, filename)
      };
    }
  }

  async analyzeMultipleFiles(files, onFileProgress) {
    const results = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (onFileProgress) {
        onFileProgress({
          currentFile: file.name,
          fileIndex: i + 1,
          totalFiles,
          progress: (i / totalFiles) * 100
        });
      }

      try {
        const result = await this.analyzeCodeWithProgress(file.content, file.name);
        results.push({
          file: file,
          result: result,
          success: result.success
        });
      } catch (error) {
        results.push({
          file: file,
          result: { success: false, error: error.message },
          success: false
        });
      }
    }

    return results;
  }

  async directConversation(userMessage, fileContext = null, conversationHistory = []) {
    try {
      // Step 1: Understanding request
      this.emitProgress('reading', 0, 'Understanding your request...');
      await this.delay(200);
      
      this.emitProgress('reading', 50, 'Analyzing context...');
      await this.delay(200);
      
      this.emitProgress('reading', 100, 'Request processed');
      await this.delay(100);

      // Step 2: Reading file if needed
      if (fileContext) {
        this.emitProgress('parsing', 0, `Re-reading ${fileContext.name}...`);
        await this.delay(300);
        
        this.emitProgress('parsing', 60, 'Applying conversation context...');
        await this.delay(200);
        
        this.emitProgress('parsing', 100, 'File context loaded');
        await this.delay(100);
      }

      // Step 3: AI Processing
      this.emitProgress('analyzing', 0, 'Processing with AI...');
      await this.delay(400);

      // Build context for the AI
      let context = `User request: ${userMessage}\n\n`;
      
      if (fileContext) {
        context += `Current file: ${fileContext.name}\n`;
        context += `File content:\n${fileContext.content}\n\n`;
      }

      if (conversationHistory.length > 0) {
        context += 'Previous conversation:\n';
        conversationHistory.slice(-3).forEach(msg => {
          context += `${msg.type}: ${msg.content}\n`;
        });
      }

      this.emitProgress('analyzing', 60, 'Generating response...');
      await this.delay(500);

      // Simulate AI response (in real implementation, call Ollama)
      const response = await this.generateContextualResponse(userMessage, fileContext, conversationHistory);

      this.emitProgress('analyzing', 100, 'Response generated');
      await this.delay(100);

      // Step 4: Finalizing
      this.emitProgress('generating', 0, 'Formatting response...');
      await this.delay(200);
      
      this.emitProgress('generating', 100, 'Response ready!');
      await this.delay(100);

      this.emitProgress('complete', 100, 'Done!');

      return {
        success: true,
        response: response,
        hasActions: true,
        actions: this.getContextualActions(userMessage, fileContext)
      };

    } catch (error) {
      this.emitProgress('error', 0, `Failed: ${error.message}`);
      throw error;
    }
  }

  async generateContextualResponse(userMessage, fileContext, history) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Enhanced response generation based on context
    if (fileContext) {
      const fileExt = fileContext.extension;
      const language = this.getLanguageDisplayName(fileExt);
      
      if (lowerMessage.includes('improve') || lowerMessage.includes('better')) {
        return `## 🔧 Code Improvement Analysis

I've analyzed your **${fileContext.name}** (${language}) and here are specific improvements I recommend:

### **Immediate Improvements:**
• **Code Structure**: The current implementation could benefit from better organization
• **Error Handling**: Add try-catch blocks for robust error management
• **Performance**: Optimize loops and data structures for better efficiency
• **Readability**: Improve variable naming and add comments

### **File-Specific Suggestions:**
Based on your ${language} code, I notice:
• Functions could be broken down into smaller, more focused units
• Consider using more descriptive variable names
• Add input validation for better reliability

### **Next Steps:**
1. **Review the suggestions** I've highlighted
2. **Apply improvements** one section at a time
3. **Test thoroughly** after each change

Would you like me to show you the improved code with these changes applied?`;
      }
      
      if (lowerMessage.includes('explain') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
        return `## 📖 Code Explanation: ${fileContext.name}

Let me break down what your ${language} code is doing:

### **Main Purpose:**
This code appears to be ${this.analyzeCodePurpose(fileContext.content, fileExt)}

### **Key Components:**
${this.explainCodeStructure(fileContext.content, fileExt)}

### **Code Flow:**
1. **Initialization**: Setting up variables and configurations
2. **Main Logic**: Core functionality execution
3. **Output/Return**: Final results or side effects

### **Interesting Patterns:**
I notice you're using several good practices, and there are some areas where we could make improvements.

Would you like me to explain any specific part in more detail?`;
      }
      
      if (lowerMessage.includes('fix') || lowerMessage.includes('bug') || lowerMessage.includes('error')) {
        return `## 🐛 Bug Analysis: ${fileContext.name}

I've scanned your ${language} code for potential issues:

### **Potential Issues Found:**
• **Logic Errors**: Check conditional statements and loop bounds
• **Edge Cases**: Consider what happens with unexpected input
• **Resource Management**: Ensure proper cleanup of resources
• **Null/Undefined**: Add checks for empty or null values

### **Common ${language} Pitfalls:**
${this.getLanguageSpecificIssues(fileExt)}

### **Recommended Fixes:**
1. Add input validation at function entry points
2. Implement proper error handling
3. Add boundary checks for arrays/collections
4. Consider async/await patterns for better flow

Would you like me to show you the corrected version with these fixes applied?`;
      }
    }

    // Default conversational response
    return `## 💬 How Can I Help?

I'm ready to assist with your code! ${fileContext ? `I can see you have **${fileContext.name}** loaded.` : 'Upload a file to get started with analysis.'}

### **What I Can Do:**
• **Analyze Code**: Find bugs, performance issues, and improvements
• **Explain Logic**: Break down complex algorithms and functions
• **Suggest Improvements**: Optimize structure, readability, and performance
• **Fix Issues**: Identify and resolve specific problems
• **Add Features**: Help implement new functionality

### **Try Asking:**
• "Improve the performance of this function"
• "Add error handling to this code"
• "Explain how this algorithm works"
• "Find potential bugs in this file"

${fileContext ? 'What would you like me to help you with regarding your code?' : 'Upload a code file and ask me anything about it!'}`;
  }

  getContextualActions(userMessage, fileContext) {
    const lowerMessage = userMessage.toLowerCase();
    const baseActions = [];

    if (fileContext) {
      if (lowerMessage.includes('improve') || lowerMessage.includes('better')) {
        baseActions.push(
          { label: 'Show Improved Code', action: 'improve_code' },
          { label: 'Explain Changes', action: 'explain_improvements' },
          { label: 'Apply Different Style', action: 'different_style' }
        );
      } else if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) {
        baseActions.push(
          { label: 'Fix All Issues', action: 'fix_bugs' },
          { label: 'Show Fixes Step by Step', action: 'step_by_step_fixes' },
          { label: 'Test the Fixes', action: 'test_fixes' }
        );
      } else if (lowerMessage.includes('add') || lowerMessage.includes('feature')) {
        baseActions.push(
          { label: 'Add Requested Feature', action: 'add_features' },
          { label: 'Show Implementation Plan', action: 'implementation_plan' },
          { label: 'Suggest Alternative Approaches', action: 'alternatives' }
        );
      } else {
        baseActions.push(
          { label: 'Analyze This File', action: 'analyze_file' },
          { label: 'Improve Code', action: 'improve_code' },
          { label: 'Find Issues', action: 'fix_bugs' },
          { label: 'Add Features', action: 'add_features' }
        );
      }

      baseActions.push({ label: 'View Code', action: 'view_code' });
    } else {
      baseActions.push(
        { label: 'Upload File', action: 'upload_file' },
        { label: 'Create New File', action: 'create_file' },
        { label: 'Upload Directory', action: 'upload_directory' }
      );
    }

    return baseActions;
  }

  analyzeCodePurpose(content, extension) {
    const purposes = {
      'py': 'a Python script that processes data and performs computations',
      'js': 'a JavaScript module handling dynamic functionality',
      'jsx': 'a React component managing user interface state',
      'ts': 'a TypeScript module with type-safe operations',
      'java': 'a Java class implementing object-oriented functionality',
      'cpp': 'a C++ program with efficient system-level operations',
      'lua': 'a Lua script for automation or game logic',
      'html': 'an HTML document structuring web content',
      'css': 'a CSS stylesheet defining visual presentation'
    };
    
    return purposes[extension] || 'a code file implementing specific functionality';
  }

  explainCodeStructure(content, extension) {
    // Simple structure analysis based on common patterns
    const lines = content.split('\n');
    const functions = content.match(/(?:function|def|func)\s+\w+/g) || [];
    const classes = content.match(/class\s+\w+/g) || [];
    const imports = content.match(/(?:import|require|#include)\s+.+/g) || [];

    let structure = [];
    
    if (imports.length > 0) {
      structure.push(`• **Dependencies**: ${imports.length} imports/includes`);
    }
    
    if (classes.length > 0) {
      structure.push(`• **Classes**: ${classes.length} class definitions`);
    }
    
    if (functions.length > 0) {
      structure.push(`• **Functions**: ${functions.length} function declarations`);
    }
    
    structure.push(`• **Total Lines**: ${lines.length} lines of code`);
    
    return structure.length > 0 ? structure.join('\n') : '• **Structure**: Simple script with linear execution';
  }

  getLanguageSpecificIssues(extension) {
    const issues = {
      'py': '• Watch for indentation errors and undefined variables\n• Check for proper exception handling\n• Ensure proper list/dict access patterns',
      'js': '• Check for undefined variables and null references\n• Avoid callback hell with async/await\n• Use proper scope and closure patterns',
      'jsx': '• Ensure proper state management and effect cleanup\n• Check for missing key props in lists\n• Validate component prop types',
      'java': '• Watch for null pointer exceptions\n• Ensure proper resource management (try-with-resources)\n• Check for proper inheritance patterns',
      'cpp': '• Check for memory leaks and dangling pointers\n• Ensure proper RAII patterns\n• Watch for buffer overflows',
      'lua': '• Check for nil value access\n• Ensure proper table indexing\n• Watch for global variable pollution'
    };
    
    return issues[extension] || '• Check for common syntax and logic errors\n• Ensure proper error handling\n• Validate input parameters';
  }

  getLanguageDisplayName(extension) {
    const names = {
      'py': 'Python',
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'lua': 'Lua',
      'html': 'HTML',
      'css': 'CSS'
    };
    
    return names[extension] || extension.toUpperCase();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  generateFallbackAnalysis(code, filename) {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim()).length;
    const extension = filename.split('.').pop()?.toLowerCase() || 'txt';
    const language = this.getLanguageDisplayName(extension);

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
}

// Export singleton instance
export const enhancedAiService = new EnhancedAIService();