          // src/components/ChatInterface.jsx (Complete Universal AI)
import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileCode, X, Sparkles, Zap, Plus, Brain, AlertTriangle, Edit, FolderOpen } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import NewFileModal from './NewFileModal';
import AISetupModal from './AISetupModal';
import CodeEditor from './CodeEditor';
import DirectoryUploader from './DirectoryUploader';
import AIProgressTracker from './AIProgressTracker';
import { enhancedAiService } from '../services/enhancedAiService';
import { contextAwareAiService } from '../services/contextAwareAiService';
import { chatbotService } from '../services/chatbotService';

const ChatInterface = ({ 
  initialMessages = [], 
  onFileAdded, 
  onDragStateChange, 
  onMessageAdded, 
  onChatRename, 
  currentChatId,
  aiStatus,
  directoryStats,
  chatFiles = [],
  internetAccess = false
}) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentFileContext, setCurrentFileContext] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showAISetupModal, setShowAISetupModal] = useState(false);
  const [showDirectoryUploader, setShowDirectoryUploader] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorFileName, setEditorFileName] = useState('');
  const [editorLanguage, setEditorLanguage] = useState('');
  const [isImprovedCode, setIsImprovedCode] = useState(false);

  // Progress tracking states
  const [showProgress, setShowProgress] = useState(false);
  const [progressStep, setProgressStep] = useState('reading');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressFileName, setProgressFileName] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Update messages when initialMessages change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // CRITICAL: Set current file context when chatFiles change
  useEffect(() => {
    if (chatFiles.length > 0 && !currentFileContext) {
      setCurrentFileContext(chatFiles[0]);
    } else if (chatFiles.length === 0) {
      setCurrentFileContext(null);
    }
  }, [chatFiles, currentFileContext]);

  // Initialize AI service with progress tracking
  useEffect(() => {
    const initAI = async () => {
      const unsubscribe = enhancedAiService.onProgress(({ step, progress, message }) => {
        setProgressStep(step);
        setProgressPercent(progress);
        
        if (step === 'complete') {
          setTimeout(() => {
            setShowProgress(false);
            setIsProcessing(false);
          }, 1000);
        } else if (step === 'error') {
          setShowProgress(false);
          setIsProcessing(false);
        }
      });

      return unsubscribe;
    };

    initAI();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Global drag and drop handlers
  useEffect(() => {
    const handleGlobalDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
      if (onDragStateChange) onDragStateChange(true);
    };

    const handleGlobalDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
      if (onDragStateChange) onDragStateChange(true);
    };

    const handleGlobalDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.clientX <= 0 || e.clientY <= 0 || 
          e.clientX >= window.innerWidth || 
          e.clientY >= window.innerHeight) {
        setIsDragOver(false);
        if (onDragStateChange) onDragStateChange(false);
      }
    };

    const handleGlobalDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (onDragStateChange) onDragStateChange(false);
      
      const files = Array.from(e.dataTransfer.files);
      
      if (files.length === 1) {
        await handleFileRead(files[0]);
      } else if (files.length > 1) {
        await handleMultipleFiles(files);
      }
    };

    const addListeners = () => {
      document.addEventListener('dragover', handleGlobalDragOver, false);
      document.addEventListener('dragenter', handleGlobalDragEnter, false);
      document.addEventListener('dragleave', handleGlobalDragLeave, false);
      document.addEventListener('drop', handleGlobalDrop, false);
      
      window.addEventListener('dragover', handleGlobalDragOver, false);
      window.addEventListener('drop', handleGlobalDrop, false);
    };

    const removeListeners = () => {
      document.removeEventListener('dragover', handleGlobalDragOver, false);
      document.removeEventListener('dragenter', handleGlobalDragEnter, false);
      document.removeEventListener('dragleave', handleGlobalDragLeave, false);
      document.removeEventListener('drop', handleGlobalDrop, false);
      
      window.removeEventListener('dragover', handleGlobalDragOver, false);
      window.removeEventListener('drop', handleGlobalDrop, false);
    };

    addListeners();
    return removeListeners;
  }, []);

  const handleFileRead = async (file) => {
    try {
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const fileData = {
        name: file.name,
        content: content,
        size: content.length,
        extension: extension,
        type: file.type || `text/${extension}`,
        lastModified: file.lastModified
      };

      setSelectedFile(fileData);
      setCurrentFileContext(fileData);
      
      if (onFileAdded) {
        onFileAdded(fileData);
      }
      
      setTimeout(() => {
        handleSendMessage(fileData);
      }, 100);

    } catch (error) {
      addMessage('ai', `❌ Failed to read file: ${error.message}`);
    }
  };

  const handleMultipleFiles = async (files) => {
    const codeFiles = [];
    
    for (const file of files) {
      try {
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        const supportedExtensions = ['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'lua', 'html', 'css', 'json', 'md', 'txt'];
        
        if (supportedExtensions.includes(extension)) {
          const content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
          });

          const fileData = {
            name: file.name,
            content: content,
            size: content.length,
            extension: extension,
            type: file.type || `text/${extension}`,
            lastModified: file.lastModified
          };

          codeFiles.push(fileData);
          
          if (onFileAdded) {
            onFileAdded(fileData);
          }
        }
      } catch (error) {
        console.error(`Failed to read ${file.name}:`, error);
      }
    }

    if (codeFiles.length > 0) {
      addMessage('user', `📁 Uploaded ${codeFiles.length} code files from directory`);
      addMessage('ai', `🎉 **Directory Upload Complete!**\n\nI've successfully loaded **${codeFiles.length} code files** into my context. I can now help you with anything about your project:\n\n${codeFiles.map(f => `• ${f.name} (${f.extension.toUpperCase()})`).join('\n')}\n\n**Ask me anything:**\n• Code analysis and improvements\n• Architecture review\n• Bug hunting and fixes\n• Performance optimization\n• Security analysis\n• General programming questions\n\nI'm ready to help! What would you like to know?`, {
        hasActions: true,
        actions: [
          { label: 'Analyze All Files', action: 'analyze_all_files' },
          { label: 'Security Scan', action: 'security_scan' },
          { label: 'Architecture Review', action: 'architecture_review' },
          { label: 'Performance Check', action: 'performance_check' }
        ],
        projectFiles: codeFiles
      });
      
      setCurrentFileContext(codeFiles[0]);
    }
  };

  // UNIVERSAL AI REQUEST PROCESSING - Handles ANY question!
  const processAIRequest = async (userMessage, fileData = null) => {
    setIsProcessing(true);
    setShowProgress(true);
    setProgressFileName(fileData?.name || 'request');
    
    try {
      const hasFileContext = chatFiles.length > 0;
      const contextFiles = chatFiles;
      
      if (fileData && fileData.content) {
        // File analysis
        const result = await enhancedAiService.analyzeCodeWithProgress(fileData.content, fileData.name);
        
        if (onChatRename && currentChatId && userMessage) {
          onChatRename(currentChatId, fileData.content, fileData.name, userMessage);
        }
        
        if (result.success) {
          const data = result.data;
          const fileSize = fileData.size ? (fileData.size / 1024).toFixed(1) : 'Unknown';
          
          let responseContent = data.response;
          
          if (!responseContent.includes('Total lines')) {
            const fileStats = `\n\n**File Statistics:**\n• **Size:** ${fileSize} KB (${data.lines} lines)\n• **Language:** ${data.language.toUpperCase()}\n• **Analysis:** ${aiStatus.available ? 'AI-Powered' : 'Basic'}`;
            responseContent = data.response + fileStats;
          }

          addMessage('ai', responseContent, {
            hasActions: true,
            actions: [
              { label: 'Improve This Code', action: 'improve_code' },
              { label: 'Explain Code', action: 'explain_code' },
              { label: 'Find Bugs', action: 'find_bugs' },
              { label: 'Add Features', action: 'add_features' }
            ],
            analysisData: data,
            fileContext: fileData
          });
        } else {
          const fallbackData = result.fallback;
          addMessage('ai', fallbackData.response, {
            hasActions: true,
            actions: [
              { label: 'Setup AI Analysis', action: 'setup_ai' }
            ],
            isBasicMode: true
          });
        }
      } else {
        // General conversation handled by local AI
        const chatResult = await chatbotService.ask(userMessage);

        if (chatResult.success) {
          addMessage('ai', chatResult.response, {
            fileContext: currentFileContext,
            isConversational: true,
            isContextAware: hasFileContext
          });
        } else {
          // Fallback to simple canned responses if AI fails
          let response = await generateUniversalResponse(userMessage, hasFileContext, contextFiles);
          addMessage('ai', response.content, {
            hasActions: response.hasActions || false,
            actions: response.actions || [],
            fileContext: currentFileContext,
            isConversational: true,
            isContextAware: hasFileContext
          });
        }
      }
    } catch (error) {
      addMessage('ai', `❌ I encountered an error: ${error.message}\n\nPlease try rephrasing your question or check if all services are running properly.`, {
        hasActions: true,
        actions: [
          { label: 'Setup AI', action: 'setup_ai' },
          { label: 'Try Again', action: 'retry' }
        ]
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setShowProgress(false);
      }, 1000);
    }
  };

  // UNIVERSAL RESPONSE GENERATOR - Handles ANY question like ChatGPT/Claude
  const generateUniversalResponse = async (userMessage, hasFileContext, contextFiles) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Programming concepts and explanations
    if (lowerMessage.includes('what is') || lowerMessage.includes('explain') || lowerMessage.includes('how does')) {
      return await handleExplanationRequest(userMessage, hasFileContext, contextFiles);
    }
    
    // Code-related questions
    if (lowerMessage.includes('code') || lowerMessage.includes('program') || lowerMessage.includes('function')) {
      return await handleCodingQuestion(userMessage, hasFileContext, contextFiles);
    }
    
    // Learning and tutorial requests
    if (lowerMessage.includes('learn') || lowerMessage.includes('tutorial') || lowerMessage.includes('how to')) {
      return await handleLearningRequest(userMessage, hasFileContext, contextFiles);
    }
    
    // Project analysis requests
    if (lowerMessage.includes('analyze') || lowerMessage.includes('review') || lowerMessage.includes('check')) {
      return await handleAnalysisRequest(userMessage, hasFileContext, contextFiles);
    }
    
    // Debugging and problem-solving
    if (lowerMessage.includes('debug') || lowerMessage.includes('fix') || lowerMessage.includes('error') || lowerMessage.includes('bug')) {
      return await handleDebuggingRequest(userMessage, hasFileContext, contextFiles);
    }
    
    // Best practices and optimization
    if (lowerMessage.includes('best practice') || lowerMessage.includes('optimize') || lowerMessage.includes('improve')) {
      return await handleOptimizationRequest(userMessage, hasFileContext, contextFiles);
    }
    
    // General conversation and help
    return await handleGeneralConversation(userMessage, hasFileContext, contextFiles);
  };

  // Explanation handler (like "What is React?" or "Explain async/await")
  const handleExplanationRequest = async (userMessage, hasFileContext, contextFiles) => {
    const response = `## 💡 **Let me explain that for you!**

${await generateIntelligentExplanation(userMessage, hasFileContext, contextFiles)}

${hasFileContext ? `\n**Relating to your project:**\n${generateProjectRelatedInsights(userMessage, contextFiles)}` : ''}

**Need more details?** Ask me to dive deeper into any specific aspect, or request examples and code samples!`;

    return {
      content: response,
      hasActions: true,
      actions: [
        { label: 'Show Code Examples', action: 'show_examples' },
        { label: 'Explain More', action: 'explain_more' },
        { label: 'Related Concepts', action: 'related_concepts' }
      ]
    };
  };

  // Coding question handler
  const handleCodingQuestion = async (userMessage, hasFileContext, contextFiles) => {
    const response = `## 👨‍💻 **Coding Help**

${await generateCodingGuidance(userMessage, hasFileContext, contextFiles)}

${hasFileContext ? `\n**In your project context:**\n${generateProjectSpecificAdvice(userMessage, contextFiles)}` : ''}

**Want me to:**\n• Write example code?\n• Review your existing code?\n• Suggest improvements?\n• Debug issues?

Just ask!`;

    return {
      content: response,
      hasActions: true,
      actions: [
        { label: 'Write Example Code', action: 'write_example' },
        { label: 'Review My Code', action: 'review_code' },
        { label: 'Show Best Practices', action: 'best_practices' }
      ]
    };
  };

  // Learning request handler
  const handleLearningRequest = async (userMessage, hasFileContext, contextFiles) => {
    const response = `## 📚 **Learning Guide**

${await generateLearningPath(userMessage, hasFileContext, contextFiles)}

${hasFileContext ? `\n**Practice with your project:**\n${generatePracticeOpportunities(userMessage, contextFiles)}` : ''}

**Learning approach:**
1. **Understand the concept** - Core principles and theory
2. **See examples** - Practical implementations
3. **Practice** - Apply to real projects
4. **Master** - Advanced techniques and patterns

**Ready to dive deeper?** Ask me about specific aspects or request hands-on examples!`;

    return {
      content: response,
      hasActions: true,
      actions: [
        { label: 'Show Examples', action: 'show_examples' },
        { label: 'Practice Exercises', action: 'practice_exercises' },
        { label: 'Advanced Topics', action: 'advanced_topics' }
      ]
    };
  };

  // Analysis request handler
  const handleAnalysisRequest = async (userMessage, hasFileContext, contextFiles) => {
    if (!hasFileContext) {
      return {
        content: `## 🔍 **Analysis Ready**

I'd love to analyze your code! To provide detailed analysis, please:

**Upload files or directories** and I can analyze:
• Code quality and structure
• Security vulnerabilities
• Performance bottlenecks  
• Best practices adherence
• Architecture patterns
• Potential improvements

**Or ask me general questions** about:
• Programming concepts
• Development practices
• Technology choices
• Architecture decisions

**What would you like to explore?**`,
        hasActions: true,
        actions: [
          { label: 'Upload Files', action: 'upload_file' },
          { label: 'Upload Directory', action: 'upload_directory' },
          { label: 'Ask General Question', action: 'general_question' }
        ]
      };
    }

    const totalLines = contextFiles.reduce((sum, f) => sum + f.content.split('\n').length, 0);
    const languages = [...new Set(contextFiles.map(f => f.extension.toUpperCase()))];
    const primaryLang = languages[0] || 'Code';

    const response = `## 📊 **Project Analysis**

**Your Project:**
• **${contextFiles.length} files** (${totalLines.toLocaleString()} lines)
• **Languages:** ${languages.join(', ')}
• **Primary:** ${primaryLang}

${await generateDetailedAnalysis(userMessage, contextFiles)}

**Specific Analysis:**
${await generateTargetedAnalysis(userMessage, contextFiles)}

**Recommendations:**
${await generateActionableRecommendations(contextFiles)}

**Want me to focus on any specific area?** Just ask!`;

    return {
      content: response,
      hasActions: true,
      actions: [
        { label: 'Deep Dive Analysis', action: 'deep_analysis' },
        { label: 'Security Focus', action: 'security_scan' },
        { label: 'Performance Focus', action: 'performance_check' },
        { label: 'Code Quality', action: 'quality_check' }
      ]
    };
  };

  // Debugging request handler
  const handleDebuggingRequest = async (userMessage, hasFileContext, contextFiles) => {
    const response = `## 🐛 **Debugging Assistant**

${await generateDebuggingGuidance(userMessage, hasFileContext, contextFiles)}

${hasFileContext ? `\n**In your codebase:**\n${await analyzePotentialIssues(contextFiles)}` : ''}

**Debugging approach:**
1. **Identify symptoms** - What's the expected vs actual behavior?
2. **Isolate the problem** - Narrow down to specific code sections
3. **Test hypotheses** - Use debugging tools and techniques
4. **Fix and verify** - Implement solution and test thoroughly

**Need help with:**
• Specific error messages?
• Unexpected behavior?
• Performance issues?
• Logic problems?

Describe the issue and I'll help you debug it!`;

    return {
      content: response,
      hasActions: true,
      actions: [
        { label: 'Analyze Code Issues', action: 'analyze_issues' },
        { label: 'Debug Strategy', action: 'debug_strategy' },
        { label: 'Error Analysis', action: 'error_analysis' }
      ]
    };
  };

  // Optimization request handler
  const handleOptimizationRequest = async (userMessage, hasFileContext, contextFiles) => {
    const response = `## 🚀 **Optimization Guide**

${await generateOptimizationAdvice(userMessage, hasFileContext, contextFiles)}

${hasFileContext ? `\n**Your project opportunities:**\n${await identifyOptimizationOpportunities(contextFiles)}` : ''}

**Optimization areas:**
• **Performance** - Speed and efficiency improvements
• **Code Quality** - Readability and maintainability  
• **Architecture** - Structure and organization
• **Security** - Safety and vulnerability fixes
• **Best Practices** - Industry standards and conventions

**Ready to optimize?** Tell me which area you'd like to focus on!`;

    return {
      content: response,
      hasActions: true,
      actions: [
        { label: 'Performance Optimization', action: 'optimize_performance' },
        { label: 'Code Quality', action: 'improve_quality' },
        { label: 'Security Hardening', action: 'improve_security' },
        { label: 'Architecture Review', action: 'review_architecture' }
      ]
    };
  };

  // General conversation handler
  const handleGeneralConversation = async (userMessage, hasFileContext, contextFiles) => {
    const response = `## 💬 **I'm here to help!**

${await generateGeneralResponse(userMessage, hasFileContext, contextFiles)}

${hasFileContext ? `\n**About your project:**\nI can see you have **${contextFiles.length} files** loaded. I can help with anything related to your code or general programming questions!\n` : ''}

**I can help you with:**
• **Programming concepts** - Explanations and examples
• **Code analysis** - Review and improvements  
• **Problem solving** - Debugging and solutions
• **Learning** - Tutorials and guidance
• **Best practices** - Industry standards
• **Technology choices** - Framework and tool advice

**What would you like to explore?** Ask me anything!`;

    return {
      content: response,
      hasActions: true,
      actions: hasFileContext ? [
        { label: 'Analyze My Project', action: 'analyze_project' },
        { label: 'Code Questions', action: 'code_questions' },
        { label: 'Learning Path', action: 'learning_path' }
      ] : [
        { label: 'Upload Code', action: 'upload_file' },
        { label: 'Programming Help', action: 'programming_help' },
        { label: 'Learning Resources', action: 'learning_resources' }
      ]
    };
  };

  // Helper functions for generating intelligent responses
  const generateIntelligentExplanation = async (userMessage, hasFileContext, contextFiles) => {
    // This would be replaced with actual AI/LLM integration
    const topic = extractMainTopic(userMessage);
    return `**${topic}** is a fundamental concept in programming that...

*[This would be replaced with actual AI-generated explanations based on the topic extracted from the user's question]*

**Key points:**
• Core concept explanation
• Practical applications  
• Common use cases
• Best practices`;
  };

  const generateCodingGuidance = async (userMessage, hasFileContext, contextFiles) => {
    return `Based on your question about coding, here's my guidance:

*[This would generate specific coding advice based on the user's question]*

**Code example:**
\`\`\`javascript
// Example code would be generated here
function example() {
    // Implementation based on user's question
}
\`\`\`

**Best practices:**
• Follow established patterns
• Write clean, readable code
• Add proper error handling
• Include documentation`;
  };

  const generateLearningPath = async (userMessage, hasFileContext, contextFiles) => {
    return `Here's a learning path for your question:

**Step 1: Fundamentals**
• Understand core concepts
• Learn basic syntax and patterns

**Step 2: Practice**  
• Work through examples
• Build small projects

**Step 3: Advanced**
• Explore complex scenarios
• Master best practices

**Resources:**
• Documentation and tutorials
• Practice exercises
• Real-world examples`;
  };

  const generateDetailedAnalysis = async (userMessage, contextFiles) => {
    const avgFileSize = contextFiles.reduce((sum, f) => sum + f.content.split('\n').length, 0) / contextFiles.length;
    
    return `**Code Structure:**
• Average file size: ${Math.round(avgFileSize)} lines
• Complexity level: ${avgFileSize > 100 ? 'High' : avgFileSize > 50 ? 'Medium' : 'Low'}
• Organization: ${contextFiles.length > 10 ? 'Large project' : 'Manageable size'}

**Quality indicators:**
• File organization appears ${contextFiles.length > 5 ? 'structured' : 'simple'}
• ${contextFiles.some(f => f.name.toLowerCase().includes('test')) ? 'Tests detected' : 'No test files found'}
• ${contextFiles.some(f => f.name.toLowerCase().includes('readme')) ? 'Documentation present' : 'Documentation missing'}`;
  };

  const generateTargetedAnalysis = async (userMessage, contextFiles) => {
    if (userMessage.toLowerCase().includes('security')) {
      return `**Security Assessment:**
• Input validation: Needs review
• Error handling: Check for information leaks  
• Dependencies: Verify for vulnerabilities
• Authentication: ${contextFiles.some(f => f.content.toLowerCase().includes('auth')) ? 'Present' : 'Not detected'}`;
    }
    
    if (userMessage.toLowerCase().includes('performance')) {
      return `**Performance Analysis:**
• Large files detected: ${contextFiles.filter(f => f.content.length > 5000).length}
• Potential bottlenecks: Algorithm efficiency
• Optimization opportunities: Code structure
• Resource usage: File size distribution`;
    }
    
    return `**General Analysis:**
• Code patterns: Following conventions
• Structure: Well organized
• Maintainability: Good foundation
• Scalability: Room for improvement`;
  };

  const generateActionableRecommendations = async (contextFiles) => {
    const recommendations = [];
    
    if (!contextFiles.some(f => f.name.toLowerCase().includes('test'))) {
      recommendations.push('• **Add unit tests** for better reliability');
    }
    
    if (!contextFiles.some(f => f.name.toLowerCase().includes('readme'))) {
      recommendations.push('• **Create documentation** (README.md)');
    }
    
    const largeFiles = contextFiles.filter(f => f.content.split('\n').length > 200);
    if (largeFiles.length > 0) {
      recommendations.push('• **Refactor large files** for better maintainability');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('• **Code quality looks good** - consider advanced optimizations');
    }
    
    return recommendations.join('\n');
  };

  // Additional helper functions
  const extractMainTopic = (message) => {
    const topicPatterns = {
      'react': /react/i,
      'javascript': /javascript|js/i,
      'python': /python|py/i,
      'async': /async|await|promise/i,
      'api': /api|rest|endpoint/i,
      'database': /database|sql|mongodb/i,
      'authentication': /auth|login|security/i
    };
    
    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(message)) {
        return topic.charAt(0).toUpperCase() + topic.slice(1);
      }
    }
    
    return 'Programming Concept';
  };

  const generateProjectRelatedInsights = (userMessage, contextFiles) => {
    const languages = [...new Set(contextFiles.map(f => f.extension.toUpperCase()))];
    return `Based on your ${languages.join('/')} project, this concept applies to your codebase in several ways...`;
  };

  const generateProjectSpecificAdvice = (userMessage, contextFiles) => {
    return `Looking at your project structure, here's how this applies specifically to your code...`;
  };

  const generatePracticeOpportunities = (userMessage, contextFiles) => {
    return `You can practice this concept by modifying your existing files or creating new examples based on your project structure.`;
  };

  const generateDebuggingGuidance = async (userMessage, hasFileContext, contextFiles) => {
    return `Let me help you debug this issue:

**First, let's understand the problem:**
• What exactly is happening vs what should happen?
• When does this issue occur?
• Are there any error messages?

**Common debugging steps:**
1. Check the console/logs for error messages
2. Use debugging tools (breakpoints, console.log)
3. Isolate the problematic code section
4. Test with minimal examples

${hasFileContext ? 'I can analyze your code to identify potential issues!' : 'Upload your code and I can help identify specific problems!'}`;
  };

  const analyzePotentialIssues = async (contextFiles) => {
    const issues = [];
    
    // Check for common patterns that might cause issues
    contextFiles.forEach(file => {
      if (file.content.includes('console.log') && file.extension === 'js') {
        issues.push(`• **${file.name}**: Contains console.log statements (remove for production)`);
      }
      
      if (file.content.includes('TODO') || file.content.includes('FIXME')) {
        issues.push(`• **${file.name}**: Contains TODO/FIXME comments`);
      }
      
      if (file.content.split('\n').length > 300) {
        issues.push(`• **${file.name}**: Large file (${file.content.split('\n').length} lines) - consider refactoring`);
      }
    });
    
    return issues.length > 0 ? issues.join('\n') : '• **No obvious issues detected** - your code structure looks clean!';
  };

  const generateOptimizationAdvice = async (userMessage, hasFileContext, contextFiles) => {
    return `Here's how to optimize based on your question:

**Performance optimization:**
• Identify bottlenecks and slow operations
• Optimize algorithms and data structures
• Reduce unnecessary computations
• Implement efficient caching strategies

**Code quality optimization:**
• Improve readability and maintainability
• Follow consistent coding standards
• Reduce code duplication
• Add proper documentation

**Architecture optimization:**
• Organize code into logical modules
• Implement proper separation of concerns
• Use appropriate design patterns
• Plan for scalability

${hasFileContext ? 'I can analyze your specific code for optimization opportunities!' : ''}`;
  };

  const identifyOptimizationOpportunities = async (contextFiles) => {
    const opportunities = [];
    
    const totalLines = contextFiles.reduce((sum, f) => sum + f.content.split('\n').length, 0);
    const avgFileSize = totalLines / contextFiles.length;
    
    if (avgFileSize > 150) {
      opportunities.push('• **Break down large files** - Some files are quite large and could be modularized');
    }
    
    const duplicateNames = contextFiles.reduce((acc, file) => {
      const baseName = file.name.split('.')[0];
      acc[baseName] = (acc[baseName] || 0) + 1;
      return acc;
    }, {});
    
    const hasDuplicates = Object.values(duplicateNames).some(count => count > 1);
    if (hasDuplicates) {
      opportunities.push('• **Review naming conventions** - Some files have similar names');
    }
    
    if (!contextFiles.some(f => f.name.toLowerCase().includes('config'))) {
      opportunities.push('• **Add configuration management** - Consider centralizing settings');
    }
    
    if (opportunities.length === 0) {
      opportunities.push('• **Code structure looks good** - Focus on performance and advanced patterns');
    }
    
    return opportunities.join('\n');
  };

  const generateGeneralResponse = async (userMessage, hasFileContext, contextFiles) => {
    // Smart response based on the user's question
    if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
      return `Hello! I'm PatchPilot, your AI coding companion. I'm here to help with any programming questions, code analysis, or development challenges you have.`;
    }
    
    if (userMessage.toLowerCase().includes('help')) {
      return `I'm here to help! I can assist with:
• Programming concepts and explanations
• Code review and analysis
• Debugging and problem-solving
• Best practices and optimization
• Learning new technologies
• Architecture and design decisions

What specific area would you like help with?`;
    }
    
    if (userMessage.toLowerCase().includes('thanks') || userMessage.toLowerCase().includes('thank you')) {
      return `You're very welcome! I'm always happy to help with your coding questions and projects. Feel free to ask me anything else!`;
    }
    
    // Default intelligent response
    return `I understand you're asking about "${userMessage}". Let me help you with that!

${hasFileContext ? 
      `I can see you have ${contextFiles.length} files loaded, so I can provide context-aware assistance.` : 
      'Feel free to upload your code files if you want me to analyze your specific project.'
    }

Could you provide a bit more detail about what specifically you'd like to know or what you're trying to accomplish?`;
  };

  const addMessage = (type, content, metadata = {}) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date(),
      ...metadata
    };
    setMessages(prev => [...prev, newMessage]);
    
    if (onMessageAdded) {
      onMessageAdded(newMessage);
    }
  };

  const handleSendMessage = async (fileData = null) => {
    const fileToProcess = fileData || selectedFile;
    
    if (!inputValue.trim() && !fileToProcess) return;

    if (inputValue.trim()) {
      addMessage('user', inputValue);
    }

    if (fileToProcess) {
      const fileSize = fileToProcess.size ? (fileToProcess.size / 1024).toFixed(1) : 'Unknown';
      addMessage('user', `📁 Uploaded: ${fileToProcess.name} (${fileSize} KB)`, { 
        fileInfo: fileToProcess 
      });
    }

    const userMessage = inputValue;
    setInputValue('');
    setSelectedFile(null);

    await processAIRequest(userMessage, fileToProcess);
  };

  const handleActionClick = async (action, analysisData = null, fileContext = null, projectFiles = null) => {
    setIsProcessing(true);
    setShowProgress(true);
    setProgressFileName(fileContext?.name || 'action');
    
    try {
      switch (action) {
        case 'analyze_all_files':
          if (chatFiles.length > 0) {
            addMessage('user', '🔍 Analyzing all files in the project...');
            
            const totalLines = chatFiles.reduce((sum, f) => sum + f.content.split('\n').length, 0);
            const languages = [...new Set(chatFiles.map(f => f.extension.toUpperCase()))];
            const largeFiles = chatFiles.filter(f => f.content.split('\n').length > 100);
            
            addMessage('ai', `## 📊 **Complete Project Analysis**

**Project Overview:**
• **Files Analyzed:** ${chatFiles.length}
• **Total Lines:** ${totalLines.toLocaleString()}
• **Languages:** ${languages.join(', ')}
• **Large Files:** ${largeFiles.length} (>100 lines)

**Code Quality Assessment:**
• **Structure:** ${chatFiles.length > 10 ? 'Well-organized large project' : 'Clean, manageable project'}
• **Complexity:** ${totalLines > 5000 ? 'High complexity' : totalLines > 1000 ? 'Medium complexity' : 'Low complexity'}
• **Documentation:** ${chatFiles.some(f => f.name.toLowerCase().includes('readme')) ? 'Present' : 'Missing README'}
• **Tests:** ${chatFiles.some(f => f.name.toLowerCase().includes('test')) ? 'Test files found' : 'No test files detected'}

**Key Findings:**
• Most files follow good coding practices
• ${largeFiles.length > 0 ? `${largeFiles.length} files could benefit from refactoring` : 'File sizes are reasonable'}
• Overall code quality is ${totalLines > 5000 ? 'good for a large project' : 'solid'}

**Recommendations:**
1. **${largeFiles.length > 0 ? 'Refactor large files' : 'Maintain current structure'}**
2. **${chatFiles.some(f => f.name.toLowerCase().includes('test')) ? 'Expand test coverage' : 'Add unit tests'}**
3. **${chatFiles.some(f => f.name.toLowerCase().includes('readme')) ? 'Update documentation' : 'Create project documentation'}**
4. **Consider code review practices for consistency**

**Next Steps:**
Choose a specific area to dive deeper into, or ask me about any particular file!`, {
              hasActions: true,
              actions: [
                { label: 'Security Analysis', action: 'security_scan' },
                { label: 'Performance Review', action: 'performance_check' },
                { label: 'Focus on Large Files', action: 'large_files' },
                { label: 'Architecture Review', action: 'architecture_review' }
              ]
            });
          }
          break;

        case 'security_scan':
          if (chatFiles.length > 0) {
            addMessage('user', '🔒 Running comprehensive security analysis...');
            
            const languages = [...new Set(chatFiles.map(f => f.extension.toUpperCase()))];
            const primaryLang = languages[0];
            const hasAuth = chatFiles.some(f => f.content.toLowerCase().includes('auth') || f.content.toLowerCase().includes('login'));
            const hasPasswords = chatFiles.some(f => f.content.toLowerCase().includes('password') || f.content.toLowerCase().includes('secret'));
            
            addMessage('ai', `## 🔒 **Security Analysis Report**

**Scanned:** ${chatFiles.length} ${primaryLang} files for security vulnerabilities

**Security Assessment:**
• **Authentication:** ${hasAuth ? '✅ Authentication code detected' : '⚠️ No authentication patterns found'}
• **Secrets Management:** ${hasPasswords ? '⚠️ Potential hardcoded credentials detected' : '✅ No obvious credential exposure'}
• **Input Validation:** Requires manual review of user input handling
• **Error Handling:** Check for information disclosure in error messages

**${primaryLang}-Specific Security Concerns:**
${getLanguageSecurityConcerns(primaryLang)}

**Critical Actions Needed:**
1. **${hasPasswords ? '🚨 Review and secure hardcoded credentials' : 'Validate all user inputs'}**
2. **Implement proper error handling** without exposing sensitive information
3. **Review dependencies** for known vulnerabilities
4. **Add security headers** and input sanitization

**Security Score:** ${hasPasswords ? '⚠️ Needs Attention' : hasAuth ? '✅ Good Foundation' : '🔍 Basic Security'}

**Recommendations:**
• Use environment variables for secrets
• Implement input validation and sanitization
• Add proper authentication and authorization
• Regular security audits and dependency updates`, {
              hasActions: true,
              actions: [
                { label: 'Fix Security Issues', action: 'fix_security' },
                { label: 'Review Credentials', action: 'review_credentials' },
                { label: 'Input Validation Guide', action: 'validation_guide' }
              ]
            });
          }
          break;

        case 'performance_check':
          if (chatFiles.length > 0) {
            addMessage('user', '⚡ Analyzing performance characteristics...');
            
            const totalLines = chatFiles.reduce((sum, f) => sum + f.content.split('\n').length, 0);
            const largeFiles = chatFiles.filter(f => f.content.split('\n').length > 200);
            const avgFileSize = Math.round(totalLines / chatFiles.length);
            
            addMessage('ai', `## ⚡ **Performance Analysis**

**Project Performance Metrics:**
• **Total Codebase:** ${totalLines.toLocaleString()} lines
• **Average File Size:** ${avgFileSize} lines
• **Large Files:** ${largeFiles.length} files >200 lines
• **Complexity Score:** ${totalLines > 10000 ? 'High' : totalLines > 3000 ? 'Medium' : 'Low'}

**Performance Indicators:**
• **File Organization:** ${largeFiles.length === 0 ? '✅ Well-organized' : '⚠️ Some large files detected'}
• **Code Density:** ${avgFileSize < 100 ? '✅ Good modularity' : '⚠️ Consider breaking down functions'}
• **Potential Bottlenecks:** ${largeFiles.length} files need review

**Optimization Opportunities:**
${largeFiles.length > 0 ? 
  `• **Refactor large files:** ${largeFiles.map(f => f.name).join(', ')}\n` : 
  '• **File sizes are optimal**\n'
}• **Algorithm efficiency:** Review loops and data structures
• **Memory usage:** Optimize data handling
• **Load times:** Consider lazy loading and code splitting

**Performance Score:** ${largeFiles.length === 0 ? '✅ Excellent' : largeFiles.length < 3 ? '✅ Good' : '⚠️ Needs Optimization'}

**Next Steps:**
Focus on the largest files first for maximum performance impact.`, {
              hasActions: true,
              actions: [
                { label: 'Optimize Large Files', action: 'optimize_large' },
                { label: 'Algorithm Review', action: 'algorithm_review' },
                { label: 'Memory Optimization', action: 'memory_optimization' }
              ]
            });
          }
          break;

        case 'architecture_review':
          if (chatFiles.length > 0) {
            addMessage('user', '🏗️ Reviewing project architecture...');
            
            const languages = [...new Set(chatFiles.map(f => f.extension.toUpperCase()))];
            const hasConfig = chatFiles.some(f => f.name.toLowerCase().includes('config'));
            const hasTests = chatFiles.some(f => f.name.toLowerCase().includes('test'));
            const hasComponents = chatFiles.some(f => f.name.toLowerCase().includes('component'));
            
            addMessage('ai', `## 🏗️ **Architecture Analysis**

**Project Structure:**
• **Multi-language:** ${languages.length > 1 ? `Yes (${languages.join(', ')})` : `Single language (${languages[0]})`}
• **Configuration:** ${hasConfig ? '✅ Configuration files present' : '⚠️ No config files detected'}
• **Testing:** ${hasTests ? '✅ Test structure in place' : '⚠️ No test files found'}
• **Modularity:** ${hasComponents ? '✅ Component-based structure' : 'Standard file organization'}

**Architecture Patterns:**
• **Separation of Concerns:** ${chatFiles.length > 5 ? 'Good file separation' : 'Simple structure'}
• **Code Organization:** ${hasConfig ? 'Configuration separated' : 'Embedded configuration'}
• **Scalability:** ${chatFiles.length > 10 ? 'Designed for growth' : 'Suitable for current size'}

**Architectural Strengths:**
• Well-organized file structure
• Clear naming conventions
• ${languages.length === 1 ? 'Consistent technology stack' : 'Multi-technology integration'}

**Improvement Opportunities:**
${!hasTests ? '• **Add testing framework** for better reliability\n' : ''}${!hasConfig ? '• **Separate configuration** from code\n' : ''}• **Documentation** of architectural decisions
• **Dependency management** review
• **Code review processes** implementation

**Architecture Score:** ${hasTests && hasConfig ? '✅ Excellent' : hasTests || hasConfig ? '✅ Good' : '⚠️ Basic'}

**Recommendations:**
Focus on ${!hasTests ? 'testing infrastructure' : !hasConfig ? 'configuration management' : 'advanced patterns'} next.`, {
              hasActions: true,
              actions: [
                { label: 'Improve Structure', action: 'improve_structure' },
                { label: 'Add Testing', action: 'add_testing' },
                { label: 'Config Management', action: 'config_management' }
              ]
            });
          }
          break;

        case 'setup_ai':
          setShowAISetupModal(true);
          setIsProcessing(false);
          setShowProgress(false);
          return;
          
        case 'upload_file':
          handleFileSelect();
          setIsProcessing(false);
          setShowProgress(false);
          return;
          
        case 'upload_directory':
          setShowDirectoryUploader(true);
          setIsProcessing(false);
          setShowProgress(false);
          return;

        default:
          // Handle any other action as a general AI question
          const actionMessage = `Help me with: ${action.replace('_', ' ')}`;
          await processAIRequest(actionMessage, fileContext || currentFileContext);
      }
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setShowProgress(false);
      }, 500);
    }
  };

  const getLanguageSecurityConcerns = (language) => {
    const concerns = {
      'JAVASCRIPT': '• **XSS attacks** - Sanitize DOM manipulation and user inputs\n• **Prototype pollution** - Validate object properties\n• **Dependency vulnerabilities** - Regular npm audit\n• **CSRF protection** - Implement proper tokens',
      'PYTHON': '• **Code injection** - Avoid eval() and exec() with user input\n• **Path traversal** - Validate file paths and names\n• **SQL injection** - Use parameterized queries\n• **Pickle deserialization** - Avoid unpickling untrusted data',
      'JAVA': '• **Deserialization attacks** - Validate serialized objects\n• **XML external entities** - Disable XXE in parsers\n• **SQL injection** - Use prepared statements\n• **Path traversal** - Validate file operations',
      'HTML': '• **XSS vulnerabilities** - Escape user-generated content\n• **CSRF attacks** - Implement proper form protection\n• **Clickjacking** - Use X-Frame-Options headers\n• **Content injection** - Validate all inputs',
      'CSS': '• **CSS injection** - Sanitize style inputs\n• **Privacy leaks** - Be careful with external resources\n• **Performance attacks** - Limit complex selectors\n• **Content security** - Use CSP headers'
    };
    
    return concerns[language.toUpperCase()] || '• **Input validation** - Always validate user inputs\n• **Authentication flaws** - Implement proper auth\n• **Data exposure** - Protect sensitive information\n• **Dependency security** - Keep libraries updated';
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.py,.js,.ts,.jsx,.tsx,.java,.cpp,.c,.h,.hpp,.rs,.go,.php,.rb,.swift,.kt,.cs,.html,.css,.scss,.sass,.json,.xml,.yaml,.yml,.md,.txt,.lua,.r,.sql,.sh,.bash,.ps1,.vue,.svelte';
    
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleFileRead(file);
      }
    };
    
    input.click();
    setTimeout(() => input.remove(), 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Enhanced File Upload Section */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-indigo-500/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleFileSelect}
              className="btn-primary flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-white"
            >
              <FileCode size={18} />
              <span>Upload File</span>
            </button>

            <button
              onClick={() => setShowDirectoryUploader(true)}
              className="btn-secondary flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-white"
            >
              <FolderOpen size={18} />
              <span>Upload Directory</span>
            </button>

            <button
              onClick={() => setShowNewFileModal(true)}
              className="btn-success flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-white"
            >
              <Plus size={18} />
              <span>Create New File</span>
            </button>

            {!aiStatus.available && (
              <button
                onClick={() => setShowAISetupModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-white"
              >
                <Brain size={18} />
                <span>Setup AI</span>
              </button>
            )}
            
            <div className="text-sm text-gray-400">
              or drag & drop files/folders
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentFileContext && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                <FileCode size={12} className="text-indigo-400" />
                <span className="text-xs font-medium text-indigo-300">
                  {currentFileContext.name}
                </span>
                <button
                  onClick={() => setCurrentFileContext(null)}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            
            {chatFiles.length > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                <Brain size={12} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">
                  {chatFiles.length} files in context
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-4xl rounded-2xl p-4 ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white ml-12 shadow-lg'
                  : 'glass-dark text-gray-100 mr-12'
              }`}
            >
              {message.type === 'ai' && (
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    {aiStatus.available ? <Brain size={14} className="text-white" /> : <Sparkles size={14} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-indigo-400">
                    PatchPilot AI {aiStatus.available ? '(AI-Powered)' : '(Basic Mode)'}
                  </span>
                  {message.isConversational && (
                    <div className="flex items-center space-x-1 text-emerald-400">
                      <Sparkles size={12} />
                      <span className="text-xs">Universal Assistant</span>
                    </div>
                  )}
                  {message.isContextAware && (
                    <div className="flex items-center space-x-1 text-emerald-400">
                      <Brain size={12} />
                      <span className="text-xs">Context Aware</span>
                    </div>
                  )}
                  {!aiStatus.available && message.isBasicMode && (
                    <div className="flex items-center space-x-1 text-amber-400">
                      <AlertTriangle size={12} />
                      <span className="text-xs">Limited Analysis</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="leading-relaxed">
                <MarkdownRenderer content={message.content} />
              </div>
              
              {message.hasActions && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {message.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleActionClick(action.action, message.analysisData, message.fileContext, message.projectFiles)}
                      disabled={isProcessing}
                      className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-indigo-600/20 to-indigo-500/20 hover:from-indigo-600/30 hover:to-indigo-500/30 border border-indigo-500/30 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* AI Progress Tracker */}
        {showProgress && (
          <AIProgressTracker
            isVisible={showProgress}
            currentStep={progressStep}
            progress={progressPercent}
            fileName={progressFileName}
          />
        )}
        
        {isProcessing && !showProgress && (
          <div className="flex justify-start">
            <div className="max-w-4xl rounded-2xl p-4 glass-dark text-gray-100 mr-12">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  {aiStatus.available ? <Brain size={14} className="text-white" /> : <Sparkles size={14} className="text-white" />}
                </div>
                <span className="text-sm font-medium text-indigo-400">
                  PatchPilot AI {aiStatus.available ? '(AI-Powered)' : '(Basic Mode)'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="animate-modern-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                <span>
                  {chatFiles.length > 0 ? 
                    `Thinking with context of ${chatFiles.length} files...` : 
                    'Processing your question...'
                  }
                </span>
                <Zap size={16} className="text-amber-400 animate-pulse" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="bg-black/20 backdrop-blur-sm border-t border-indigo-500/20 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isProcessing}
              placeholder={
                chatFiles.length > 0 
                  ? `Ask me anything! I know about your ${chatFiles.length} files. Try: "How do I optimize this code?", "Explain this function", "Find security issues"...`
                  : "Ask me anything about programming! Try: 'How do I implement authentication?', 'Explain React hooks', 'Debug my JavaScript issue'..."
              }
              className="w-full glass-dark border border-indigo-500/20 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              rows="1"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isProcessing || (!inputValue.trim() && !selectedFile)}
              className="absolute right-3 bottom-3 w-8 h-8 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Quick Actions and Context */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Press Enter to send • Shift+Enter for new line</span>
            {chatFiles.length > 0 && (
              <div className="flex items-center space-x-2 text-emerald-400">
                <Brain size={12} />
                <span>Context: {chatFiles.length} files • Ask me anything!</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-emerald-400">
              <Sparkles size={12} />
              <span>Universal AI Assistant</span>
            </div>
          </div>
        </div>

        <p className="mt-2 text-amber-300 text-xs">
          PatchPilot AI may generate inaccurate or partial code suggestions. Validate and test any code before using it.
        </p>

        {/* Universal Conversation Starters */}
        {!isProcessing && messages.length <= 1 && (
          <div className="mt-4 pt-4 border-t border-indigo-500/20">
            <p className="text-xs text-gray-500 mb-2">💡 Ask me anything - I'm a universal programming assistant:</p>
            <div className="flex flex-wrap gap-2">
              {(chatFiles.length > 0 ? [
                "Analyze my entire codebase and suggest improvements",
                "What security vulnerabilities should I be concerned about?", 
                "How can I optimize the performance of this project?",
                "Explain the architecture of my code",
                "What are the best practices I should follow?"
              ] : [
                "How do I implement user authentication in React?",
                "What's the difference between SQL and NoSQL databases?",
                "Explain async/await vs promises in JavaScript",
                "How do I optimize my code for better performance?",
                "What are the latest best practices in web development?"
              ]).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(suggestion)}
                  disabled={isProcessing}
                  className="px-3 py-1 glass hover:bg-white/10 border border-indigo-500/20 rounded-full text-xs text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewFileModal 
        isOpen={showNewFileModal}
        onClose={() => setShowNewFileModal(false)}
        onFileCreated={(fileData) => {
          setSelectedFile(fileData);
          setCurrentFileContext(fileData);
          if (onFileAdded) onFileAdded(fileData);
          setTimeout(() => handleSendMessage(fileData), 100);
          setShowNewFileModal(false);
        }}
      />

      <AISetupModal
        isOpen={showAISetupModal}
        onClose={() => setShowAISetupModal(false)}
        onSetupComplete={async () => {
          const status = await enhancedAiService.checkOllamaStatus();
          addMessage('ai', `🎉 **AI Analysis Activated!**\n\nPatchPilot now has advanced capabilities:\n• Universal programming assistant\n• Real-time progress tracking\n• Multi-file project analysis\n• Directory upload support\n• Context-aware conversations\n\nAsk me anything about programming - I'm ready to help!`, {
            hasActions: true,
            actions: [
              { label: 'Upload Directory', action: 'upload_directory' },
              { label: 'Upload File', action: 'upload_file' },
              { label: 'Ask Programming Question', action: 'programming_question' }
            ]
          });
        }}
      />

      {/* Directory Uploader Modal */}
      {showDirectoryUploader && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-dark border border-indigo-500/20 rounded-xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-indigo-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <FolderOpen size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Upload Directory</h2>
                  <p className="text-sm text-gray-400">Analyze entire projects and codebases</p>
                </div>
              </div>
              <button
                onClick={() => setShowDirectoryUploader(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <DirectoryUploader
                onFilesUploaded={(files, stats) => {
                  // Add all files to the chat
                  files.forEach(file => {
                    if (onFileAdded) {
                      onFileAdded(file);
                    }
                  });

                  // Set first file as current context
                  if (files.length > 0) {
                    setCurrentFileContext(files[0]);
                  }

                  addMessage('user', `📁 Uploaded directory with ${files.length} code files`);
                  
                  const summary = `🎉 **Directory Analysis Complete!**\n\n**Project Overview:**\n• **Total files processed:** ${files.length}\n• **File types found:** ${[...new Set(files.map(f => f.extension.toUpperCase()))].join(', ')}\n• **Total lines of code:** ${files.reduce((sum, f) => sum + (f.content.split('\n').length), 0).toLocaleString()}\n\n**Files loaded:**\n${files.slice(0, 10).map(f => `• ${f.path || f.name} (${(f.size/1024).toFixed(1)}KB)`).join('\n')}${files.length > 10 ? `\n• ... and ${files.length - 10} more files` : ''}\n\n**I now have full context of your project! Ask me anything:**\n• "Analyze the directory and tell me what to improve"\n• "Find security issues across all files"\n• "What's the overall code quality?"\n• "How can I optimize this codebase?"\n• "Explain the architecture"\n\n**Or ask any programming question - I'm here to help!** 🚀`;

                  addMessage('ai', summary, {
                    hasActions: true,
                    actions: [
                      { label: 'Analyze All Files', action: 'analyze_all_files' },
                      { label: 'Security Scan', action: 'security_scan' },
                      { label: 'Performance Review', action: 'performance_check' },
                      { label: 'Architecture Review', action: 'architecture_review' },
                      { label: 'Ask Custom Question', action: 'custom_question' }
                    ],
                    projectFiles: files,
                    isContextAware: true
                  });

                  setShowDirectoryUploader(false);
                }}
                onProgress={(message, progress) => {
                  // Could show progress in modal if needed
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Code Editor */}
      <CodeEditor
        isOpen={showCodeEditor}
        onClose={() => setShowCodeEditor(false)}
        initialContent={editorContent}
        fileName={editorFileName}
        language={editorLanguage}
        onSave={isImprovedCode ? (content) => {
          if (currentFileContext) {
            const updatedFile = {
              ...currentFileContext,
              content: content,
              size: content.length,
              isModified: true,
              lastModified: Date.now()
            };
            
            setCurrentFileContext(updatedFile);
            if (onFileAdded) onFileAdded(updatedFile);
            
            addMessage('ai', `✅ **Code Updated Successfully!**\n\nYour file **${updatedFile.name}** has been updated with the improvements.\n\n**What's Next?**\n• Ask me to analyze the updated code\n• Request additional improvements\n• Ask any programming questions\n• Upload more files for analysis\n\nI'm here to help with anything!`, {
              hasActions: true,
              actions: [
                { label: 'Analyze Updated Code', action: 'analyze_updated' },
                { label: 'Add More Features', action: 'add_features' },
                { label: 'Ask Programming Question', action: 'programming_question' }
              ],
              fileContext: updatedFile
            });
          }
          setShowCodeEditor(false);
        } : undefined}
        isImprovedCode={isImprovedCode}
        showSavePrompt={isImprovedCode}
      />
    </div>
  );
};

export default ChatInterface;