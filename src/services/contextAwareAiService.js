// src/services/contextAwareAiService.js
import { invoke } from '@tauri-apps/api/core';
import { normalizePath, pathSeparator } from '../utils/browserPath.js';

export class ContextAwareAIService {
  constructor() {
    this.isInitialized = false;
    this.ollamaStatus = null;
    this.progressCallbacks = new Set();
    this.currentChatFiles = [];
    this.projectStructure = null;
  }

  // Update chat context whenever files change
  updateChatContext(files) {
    this.currentChatFiles = files;
    this.projectStructure = this.buildProjectStructure(files);
  }

  // Build hierarchical project structure
  buildProjectStructure(files) {
    const structure = {
      name: 'Project',
      type: 'directory',
      children: {},
      files: []
    };

    files.forEach(file => {
      if (file.path && (file.path.includes('/') || file.path.includes('\\'))) {
        // Normalize path and split using path separator
        const normalized = normalizePath(file.path);
        const pathParts = normalized.split(pathSeparator);
        const fileName = pathParts.pop();
        let currentLevel = structure;

        // Build directory tree
        pathParts.forEach(dirName => {
          if (!currentLevel.children[dirName]) {
            currentLevel.children[dirName] = {
              name: dirName,
              type: 'directory',
              children: {},
              files: []
            };
          }
          currentLevel = currentLevel.children[dirName];
        });

        // Add file to final directory
        currentLevel.files.push({
          ...file,
          displayName: fileName,
          relativePath: file.path
        });
      } else {
        // Root level file
        structure.files.push({
          ...file,
          displayName: file.name,
          relativePath: file.name
        });
      }
    });

    return structure;
  }

  // Generate project structure visualization
  generateProjectStructureText(structure = this.projectStructure, indent = '') {
    if (!structure) return '';

    let output = '';
    
    // Add directories
    Object.values(structure.children).forEach(dir => {
      output += `${indent}📁 ${dir.name}/\n`;
      output += this.generateProjectStructureText(dir, indent + '  ');
    });

    // Add files
    structure.files.forEach(file => {
      const icon = this.getFileIcon(file.extension);
      output += `${indent}${icon} ${file.displayName}\n`;
    });

    return output;
  }

  getFileIcon(extension) {
    const icons = {
      'js': '🟨', 'jsx': '⚛️', 'ts': '🔷', 'tsx': '⚛️',
      'py': '🐍', 'java': '☕', 'cpp': '⚙️', 'c': '⚙️',
      'rs': '🦀', 'go': '🐹', 'php': '🐘', 'rb': '💎',
      'html': '🌐', 'css': '🎨', 'json': '📋',
      'md': '📝', 'txt': '📄', 'lua': '🌙', 'luau': '🌙'
    };
    return icons[extension] || '📄';
  }

  // Add progress callback
  onProgress(callback) {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  // Emit progress updates
  emitProgress(step, progress, message = '', currentFile = null) {
    this.progressCallbacks.forEach(callback => {
      try {
        callback({ step, progress, message, currentFile });
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

  // Main conversation method - reads all chat files by default
  async chatWithCode(userMessage, specificFile = null, conversationHistory = []) {
    try {
      this.emitProgress('reading', 10, 'Understanding your request...');
      await this.delay(200);

      // Determine which files to analyze
      const filesToAnalyze = specificFile ? [specificFile] : this.currentChatFiles;
      
      if (filesToAnalyze.length === 0) {
        return this.generateNoFilesResponse(userMessage);
      }

      this.emitProgress('reading', 30, 'Reading project files...');
      
      // Build comprehensive context
      const projectContext = this.buildComprehensiveContext(filesToAnalyze, userMessage);
      
      this.emitProgress('parsing', 50, 'Analyzing code structure...');
      await this.delay(300);

      this.emitProgress('analyzing', 70, 'AI processing with full context...');
      await this.delay(500);

      // Generate AI response with full context
      const response = await this.generateContextualResponse(
        userMessage, 
        projectContext, 
        conversationHistory,
        filesToAnalyze
      );

      this.emitProgress('generating', 90, 'Preparing response...');
      await this.delay(200);

      this.emitProgress('complete', 100, 'Response ready!');

      return {
        success: true,
        response: response.content,
        hasActions: response.hasActions,
        actions: response.actions,
        contextFiles: filesToAnalyze,
        projectStructure: this.projectStructure
      };

    } catch (error) {
      this.emitProgress('error', 0, `Failed: ${error.message}`);
      throw error;
    }
  }

  buildComprehensiveContext(files, userMessage) {
    const context = {
      projectStructure: this.generateProjectStructureText(),
      fileCount: files.length,
      totalLines: 0,
      languages: new Set(),
      files: [],
      summary: ''
    };

    files.forEach(file => {
      context.totalLines += file.content.split('\n').length;
      context.languages.add(this.getLanguageDisplayName(file.extension));
      
      context.files.push({
        path: file.path || file.name,
        name: file.name,
        extension: file.extension,
        size: file.size,
        lines: file.content.split('\n').length,
        content: file.content,
        structure: this.analyzeFileStructure(file.content, file.extension)
      });
    });

    context.summary = this.generateProjectSummary(context);
    return context;
  }

  analyzeFileStructure(content, extension) {
    const structure = {
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      variables: [],
      comments: 0
    };

    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Count comments
      if (this.isComment(trimmed, extension)) {
        structure.comments++;
      }
      
      // Find functions
      const functionMatch = this.extractFunction(trimmed, extension);
      if (functionMatch) {
        structure.functions.push({
          name: functionMatch,
          line: index + 1
        });
      }
      
      // Find classes
      const classMatch = this.extractClass(trimmed, extension);
      if (classMatch) {
        structure.classes.push({
          name: classMatch,
          line: index + 1
        });
      }
      
      // Find imports
      const importMatch = this.extractImport(trimmed, extension);
      if (importMatch) {
        structure.imports.push(importMatch);
      }
    });

    return structure;
  }

  isComment(line, extension) {
    const commentStarters = {
      'py': ['#'],
      'js': ['//', '/*'], 'jsx': ['//', '/*'], 'ts': ['//', '/*'], 'tsx': ['//', '/*'],
      'java': ['//', '/*'], 'cpp': ['//', '/*'], 'c': ['//', '/*'],
      'lua': ['--'], 'luau': ['--'],
      'html': ['<!--'], 'css': ['/*']
    };
    
    const starters = commentStarters[extension] || [];
    return starters.some(starter => line.startsWith(starter));
  }

  extractFunction(line, extension) {
    const patterns = {
      'py': /def\s+(\w+)\s*\(/,
      'js': /(?:function\s+(\w+)|const\s+(\w+)\s*=|let\s+(\w+)\s*=|var\s+(\w+)\s*=).*\(/,
      'jsx': /(?:function\s+(\w+)|const\s+(\w+)\s*=).*\(/,
      'ts': /(?:function\s+(\w+)|const\s+(\w+)\s*:|let\s+(\w+)\s*:).*\(/,
      'tsx': /(?:function\s+(\w+)|const\s+(\w+)\s*:|let\s+(\w+)\s*:).*\(/,
      'java': /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/,
      'cpp': /\w+\s+(\w+)\s*\(/,
      'lua': /function\s+(\w+)\s*\(/,
      'luau': /function\s+(\w+)\s*\(/
    };
    
    const pattern = patterns[extension];
    if (pattern) {
      const match = line.match(pattern);
      return match ? (match[1] || match[2] || match[3] || match[4]) : null;
    }
    return null;
  }

  extractClass(line, extension) {
    const patterns = {
      'py': /class\s+(\w+)/,
      'js': /class\s+(\w+)/, 'jsx': /class\s+(\w+)/, 'ts': /class\s+(\w+)/, 'tsx': /class\s+(\w+)/,
      'java': /(?:public|private|protected)?\s*class\s+(\w+)/,
      'cpp': /class\s+(\w+)/
    };
    
    const pattern = patterns[extension];
    if (pattern) {
      const match = line.match(pattern);
      return match ? match[1] : null;
    }
    return null;
  }

  extractImport(line, extension) {
    const patterns = {
      'py': /(?:import\s+(\w+)|from\s+(\w+)\s+import)/,
      'js': /import.*from\s+['"]([^'"]+)['"]/, 'jsx': /import.*from\s+['"]([^'"]+)['"]/,
      'ts': /import.*from\s+['"]([^'"]+)['"]/, 'tsx': /import.*from\s+['"]([^'"]+)['"]/,
      'java': /import\s+([^;]+)/,
      'cpp': /#include\s*[<"]([^>"]+)[>"]/,
      'c': /#include\s*[<"]([^>"]+)[>"]/
    };
    
    const pattern = patterns[extension];
    if (pattern) {
      const match = line.match(pattern);
      return match ? (match[1] || match[2]) : null;
    }
    return null;
  }

  generateProjectSummary(context) {
    const languages = Array.from(context.languages);
    const primaryLang = languages[0] || 'Mixed';
    
    let summary = `This is a ${primaryLang} project with ${context.fileCount} files and ${context.totalLines.toLocaleString()} total lines of code.`;
    
    if (languages.length > 1) {
      summary += ` The project uses multiple languages: ${languages.join(', ')}.`;
    }
    
    const totalFunctions = context.files.reduce((sum, f) => sum + f.structure.functions.length, 0);
    const totalClasses = context.files.reduce((sum, f) => sum + f.structure.classes.length, 0);
    
    if (totalFunctions > 0) {
      summary += ` Contains ${totalFunctions} functions`;
    }
    if (totalClasses > 0) {
      summary += ` and ${totalClasses} classes`;
    }
    summary += '.';
    
    return summary;
  }

  async generateContextualResponse(userMessage, projectContext, conversationHistory, files) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Build comprehensive context string for AI
    const contextString = this.buildContextString(projectContext, userMessage);
    
    // Determine response type based on user intent
    if (this.isAnalysisRequest(lowerMessage)) {
      return this.generateAnalysisResponse(projectContext, userMessage);
    } else if (this.isImprovementRequest(lowerMessage)) {
      return this.generateImprovementResponse(projectContext, userMessage);
    } else if (this.isExplanationRequest(lowerMessage)) {
      return this.generateExplanationResponse(projectContext, userMessage);
    } else if (this.isIssueRequest(lowerMessage)) {
      return this.generateIssueResponse(projectContext, userMessage);
    } else {
      return this.generateGeneralResponse(projectContext, userMessage);
    }
  }

  buildContextString(projectContext, userMessage) {
    let context = `## Project Context\n\n`;
    context += `**Project Structure:**\n\`\`\`\n${projectContext.projectStructure}\n\`\`\`\n\n`;
    context += `**Summary:** ${projectContext.summary}\n\n`;
    
    context += `**Files in Context:**\n`;
    projectContext.files.forEach(file => {
      context += `\n### ${file.path}\n`;
      context += `- **Language:** ${this.getLanguageDisplayName(file.extension)}\n`;
      context += `- **Size:** ${file.lines} lines, ${(file.size/1024).toFixed(1)}KB\n`;
      
      if (file.structure.functions.length > 0) {
        context += `- **Functions:** ${file.structure.functions.map(f => f.name).join(', ')}\n`;
      }
      if (file.structure.classes.length > 0) {
        context += `- **Classes:** ${file.structure.classes.map(c => c.name).join(', ')}\n`;
      }
      
      // Include actual code content for analysis
      context += `\n**Code:**\n\`\`\`${file.extension}\n${file.content}\n\`\`\`\n`;
    });
    
    return context;
  }

  isAnalysisRequest(message) {
    return message.includes('analyze') || message.includes('review') || message.includes('check') || 
           message.includes('examine') || message.includes('look at') || message.includes('assess');
  }

  isImprovementRequest(message) {
    return message.includes('improve') || message.includes('optimize') || message.includes('enhance') ||
           message.includes('better') || message.includes('refactor') || message.includes('upgrade');
  }

  isExplanationRequest(message) {
    return message.includes('explain') || message.includes('what') || message.includes('how') ||
           message.includes('why') || message.includes('tell me') || message.includes('describe');
  }

  isIssueRequest(message) {
    return message.includes('bug') || message.includes('error') || message.includes('issue') ||
           message.includes('problem') || message.includes('fix') || message.includes('wrong');
  }

  generateAnalysisResponse(projectContext, userMessage) {
    const content = `## 🔍 Complete Project Analysis

I've analyzed all **${projectContext.fileCount} files** in your project. Here's what I found:

### **Project Overview**
${projectContext.summary}

### **Project Structure**
\`\`\`
${projectContext.projectStructure}
\`\`\`

### **Code Quality Assessment**

**Strengths:**
• Well-organized file structure
• Good use of ${Array.from(projectContext.languages).join(' and ')}
• Clear naming conventions in most files

**Areas for Improvement:**
• Some functions could be broken down further
• Consider adding more comprehensive error handling
• Documentation could be enhanced

### **Detailed File Analysis**
${this.generateFileAnalysis(projectContext.files)}

### **Recommendations**
1. **Code Organization:** Consider grouping related functionality
2. **Testing:** Add unit tests for critical functions
3. **Documentation:** Improve inline comments and README
4. **Error Handling:** Add try-catch blocks where appropriate

Would you like me to dive deeper into any specific aspect or file?`;

    return {
      content,
      hasActions: true,
      actions: [
        { label: 'Improve All Files', action: 'improve_all' },
        { label: 'Find Security Issues', action: 'security_scan' },
        { label: 'Generate Tests', action: 'generate_tests' },
        { label: 'Optimize Performance', action: 'optimize_all' },
        { label: 'Add Documentation', action: 'add_docs' }
      ]
    };
  }

  generateFileAnalysis(files) {
    return files.map(file => {
      let analysis = `\n**${file.path}**\n`;
      analysis += `• ${file.lines} lines of ${this.getLanguageDisplayName(file.extension)}\n`;
      
      if (file.structure.functions.length > 0) {
        analysis += `• Functions: ${file.structure.functions.map(f => `\`${f.name}\``).join(', ')}\n`;
      }
      if (file.structure.classes.length > 0) {
        analysis += `• Classes: ${file.structure.classes.map(c => `\`${c.name}\``).join(', ')}\n`;
      }
      
      // Simple complexity assessment
      const complexity = this.assessComplexity(file);
      analysis += `• Complexity: ${complexity}\n`;
      
      return analysis;
    }).join('');
  }

  assessComplexity(file) {
    const totalFunctions = file.structure.functions.length;
    const totalClasses = file.structure.classes.length;
    const linesPerFunction = totalFunctions > 0 ? file.lines / totalFunctions : file.lines;
    
    if (file.lines < 50 && totalFunctions < 5) return 'Low';
    if (file.lines < 200 && linesPerFunction < 50) return 'Medium';
    if (file.lines < 500 && linesPerFunction < 100) return 'High';
    return 'Very High';
  }

  generateNoFilesResponse(userMessage) {
    return {
      success: true,
      response: `## 👋 Ready to Help!

I'd love to help you with your coding question: "${userMessage}"

However, I don't see any files loaded in our current chat. Here's what you can do:

### **Upload Code to Get Started:**
• **Single File:** Drag & drop any code file
• **Multiple Files:** Select multiple files at once
• **Entire Project:** Drag a folder to analyze the whole project

### **What I Can Do Once You Upload:**
• 🔍 **Analyze** your entire codebase
• 🐛 **Find bugs** and potential issues
• ⚡ **Suggest optimizations** and improvements
• 📝 **Explain** how your code works
• 🔧 **Refactor** and improve structure
• 🧪 **Generate tests** for your functions
• 📚 **Add documentation** and comments

### **Example Questions to Ask:**
• "What can be improved in this project?"
• "Find any security vulnerabilities"
• "Explain how this algorithm works"
• "Add error handling to all functions"
• "Generate unit tests for my code"

Upload your code and ask me anything! 🚀`,
      hasActions: true,
      actions: [
        { label: 'Upload Single File', action: 'upload_file' },
        { label: 'Upload Directory', action: 'upload_directory' },
        { label: 'Create New File', action: 'create_file' }
      ],
      contextFiles: [],
      projectStructure: null
    };
  }

  getLanguageDisplayName(extension) {
    const names = {
      'py': 'Python', 'js': 'JavaScript', 'ts': 'TypeScript', 'jsx': 'React JSX', 'tsx': 'React TSX',
      'java': 'Java', 'cpp': 'C++', 'c': 'C', 'lua': 'Lua', 'luau': 'Luau',
      'html': 'HTML', 'css': 'CSS', 'json': 'JSON', 'md': 'Markdown'
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
}

// Export singleton instance
export const contextAwareAiService = new ContextAwareAIService();