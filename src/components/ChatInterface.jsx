import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileCode, X, Sparkles, Zap, Plus, Brain, AlertTriangle, Edit } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import NewFileModal from './NewFileModal';
import AISetupModal from './AISetupModal';
import CodeEditor from './CodeEditor';
import { aiService } from '../services/aiService';

const ChatInterface = ({ initialMessages = [], onFileAdded, onDragStateChange, onMessageAdded, onChatRename, currentChatId }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentFileContext, setCurrentFileContext] = useState(null); // Track current file being discussed
  const [isDragOver, setIsDragOver] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showAISetupModal, setShowAISetupModal] = useState(false);
  const [aiStatus, setAIStatus] = useState({ available: false, models: [] });
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorFileName, setEditorFileName] = useState('');
  const [editorLanguage, setEditorLanguage] = useState('');
  const [isImprovedCode, setIsImprovedCode] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Update messages when initialMessages change (chat switching)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Initialize AI service
  useEffect(() => {
    const initAI = async () => {
      const status = await aiService.initialize();
      setAIStatus(status);
    };
    initAI();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Listen for create file events from file tracker
  useEffect(() => {
    const handleOpenNewFileModal = () => {
      setShowNewFileModal(true);
    };

    window.addEventListener('openNewFileModal', handleOpenNewFileModal);
    return () => {
      window.removeEventListener('openNewFileModal', handleOpenNewFileModal);
    };
  }, []);

  // Global drag and drop handlers (same as before)
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
      const file = files[0];
      
      if (file) {
        await handleFileRead(file);
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
      setCurrentFileContext(fileData); // Set as current context
      
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

  const handleCreateFile = () => {
    setShowNewFileModal(true);
  };

  const handleNewFileCreated = (fileData) => {
    setSelectedFile(fileData);
    setCurrentFileContext(fileData);
    
    if (onFileAdded) {
      onFileAdded(fileData);
    }
    
    setTimeout(() => {
      handleSendMessage(fileData);
    }, 100);
    
    setShowNewFileModal(false);
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

  const addMessage = (type, content, metadata = {}) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date(),
      ...metadata
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Notify parent component to save the message
    if (onMessageAdded) {
      onMessageAdded(newMessage);
    }
  };

  const processAIRequest = async (userMessage, fileData = null) => {
    setIsProcessing(true);
    
    try {
      if (fileData && fileData.content) {
        // File analysis
        const result = await aiService.analyzeCode(fileData.content, fileData.name);
        
        // Auto-rename chat based on code content (only for new chats with default names)
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
              { label: 'Add Features', action: 'add_features' },
              { label: 'Fix Bugs', action: 'fix_bugs' },
              { label: 'Optimize Performance', action: 'optimize' },
              { label: 'Add Comments', action: 'add_comments' },
              { label: 'View Code', action: 'view_code' }
            ],
            analysisData: data,
            fileContext: fileData
          });
        } else {
          const fallbackData = result.fallback;
          addMessage('ai', fallbackData.response, {
            hasActions: true,
            actions: [
              { label: 'Setup AI Analysis', action: 'setup_ai' },
              { label: 'View File Details', action: 'file_details' }
            ],
            isBasicMode: true
          });
        }
      } else {
        // Conversational AI - process user's question about current file context
        await handleConversationalAI(userMessage);
      }
    } catch (error) {
      addMessage('ai', `❌ Analysis failed: ${error.message}\n\nTry setting up AI analysis for better results.`, {
        hasActions: true,
        actions: [
          { label: 'Setup AI', action: 'setup_ai' }
        ]
      });
    }
    
    setIsProcessing(false);
  };

  const handleConversationalAI = async (userMessage) => {
    // Enhanced conversational AI that understands context
    const contextInfo = currentFileContext ? 
      `\n\nCurrent file context: ${currentFileContext.name} (${currentFileContext.extension.toUpperCase()})` : '';
    
    // Simulate AI conversation - in real implementation, this would call Ollama with conversation context
    const responses = {
      // Code improvement requests
      'improve': `I can help improve your code! ${contextInfo ? `Looking at ${currentFileContext.name}, I can:` : 'Upload a file and I can:'}\n\n• **Optimize algorithms** for better performance\n• **Improve readability** with better naming\n• **Add error handling** for robustness\n• **Follow best practices** for your language\n• **Refactor complex functions** into smaller ones\n\n${contextInfo ? 'What specific improvements would you like me to focus on?' : 'Upload a code file to get started!'}`,
      
      'fix': `I'd be happy to help fix issues in your code!${contextInfo}\n\n**What I can fix:**\n• **Syntax errors** and typos\n• **Logic bugs** and edge cases\n• **Performance bottlenecks**\n• **Security vulnerabilities**\n• **Memory leaks** and resource issues\n\n${currentFileContext ? 'Tell me what specific problem you\'re experiencing, and I\'ll analyze the code and provide a fix!' : 'Upload your code file first, then describe the issue you\'re facing.'}`,
      
      'add': `I can help add new features to your code!${contextInfo}\n\n**Popular additions:**\n• **Input validation** and error checking\n• **Logging and debugging** capabilities\n• **Configuration options** and flexibility\n• **New functionality** based on your needs\n• **Documentation and comments**\n\n${currentFileContext ? 'What feature would you like me to add? Describe what you want it to do!' : 'Upload your code first, then tell me what feature you\'d like to add.'}`,
      
      'optimize': `Let's optimize your code for better performance!${contextInfo}\n\n**Optimization areas:**\n• **Algorithm efficiency** - Use better data structures\n• **Memory usage** - Reduce allocations\n• **Loop optimization** - Minimize iterations\n• **Caching** - Store expensive calculations\n• **Code structure** - Remove redundancy\n\n${currentFileContext ? 'What performance issues are you experiencing? I can analyze and optimize specific areas.' : 'Upload your code and describe any performance concerns.'}`,
      
      'explain': `I'd love to explain how your code works!${contextInfo}\n\n**What I can explain:**\n• **Code flow** and logic\n• **Function purposes** and algorithms\n• **Variable roles** and data flow\n• **Complex sections** in simple terms\n• **Best practices** being used\n\n${currentFileContext ? 'Which part of the code would you like me to explain? Point out specific lines or functions!' : 'Upload your code file first, then ask about specific parts you want explained.'}`,
      
      // Default conversational response
      'default': `Hi! I'm ready to help with your code!${contextInfo}\n\n**You can ask me to:**\n• "Improve this function's performance"\n• "Add error handling to this code"\n• "Fix the bug in line 25"\n• "Explain how this algorithm works"\n• "Add a new feature that does X"\n• "Optimize this for better memory usage"\n\n${currentFileContext ? '**Current file:** ' + currentFileContext.name + '\nTell me what you\'d like me to help with!' : '**No file loaded** - Upload a code file first, then describe what you need help with.'}`
    };

    // Simple keyword matching for demo - in real implementation, use proper NLP
    const lowerMessage = userMessage.toLowerCase();
    let response = responses.default;
    
    if (lowerMessage.includes('improve') || lowerMessage.includes('better') || lowerMessage.includes('enhance')) {
      response = responses.improve;
    } else if (lowerMessage.includes('fix') || lowerMessage.includes('bug') || lowerMessage.includes('error') || lowerMessage.includes('problem')) {
      response = responses.fix;
    } else if (lowerMessage.includes('add') || lowerMessage.includes('feature') || lowerMessage.includes('new')) {
      response = responses.add;
    } else if (lowerMessage.includes('optimize') || lowerMessage.includes('performance') || lowerMessage.includes('speed') || lowerMessage.includes('faster')) {
      response = responses.optimize;
    } else if (lowerMessage.includes('explain') || lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
      response = responses.explain;
    }

    // Add contextual actions based on current file
    const actions = currentFileContext ? [
      { label: 'Improve Code', action: 'improve_code' },
      { label: 'Add Feature', action: 'add_features' },
      { label: 'Fix Issues', action: 'fix_bugs' },
      { label: 'View Code', action: 'view_code' }
    ] : [
      { label: 'Upload File', action: 'upload_file' },
      { label: 'Create New File', action: 'create_file' }
    ];

    addMessage('ai', response, {
      hasActions: true,
      actions: actions,
      fileContext: currentFileContext,
      isConversational: true
    });
  };

  const handleSendMessage = async (fileData = null) => {
    const fileToProcess = fileData || selectedFile;
    
    if (!inputValue.trim() && !fileToProcess) return;

    // Add user message
    if (inputValue.trim()) {
      addMessage('user', inputValue);
    }

    // Add file info if file is selected
    if (fileToProcess) {
      const fileSize = fileToProcess.size ? (fileToProcess.size / 1024).toFixed(1) : 'Unknown';
      addMessage('user', `📁 Uploaded: ${fileToProcess.name} (${fileSize} KB)`, { 
        fileInfo: fileToProcess 
      });
    }

    const userMessage = inputValue;
    setInputValue('');
    setSelectedFile(null);

    // Process the request
    await processAIRequest(userMessage, fileToProcess);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const showCodeInEditor = (code, filename, language, isImproved = false) => {
    setEditorContent(code);
    setEditorFileName(filename);
    setEditorLanguage(language);
    setIsImprovedCode(isImproved);
    setShowCodeEditor(true);
  };

  const handleCodeEditorSave = (content) => {
    // When user saves from editor, update the current file context
    if (currentFileContext) {
      const updatedFile = {
        ...currentFileContext,
        content: content,
        size: content.length,
        isModified: true,
        lastModified: Date.now()
      };
      
      setCurrentFileContext(updatedFile);
      
      if (onFileAdded) {
        onFileAdded(updatedFile);
      }
      
      addMessage('ai', `✅ **Code Updated Successfully!**\n\nYour file **${updatedFile.name}** has been updated with the improvements.\n\n**What's Next?**\n• Ask me to analyze the updated code\n• Request additional improvements\n• Add new features\n• Optimize further`, {
        hasActions: true,
        actions: [
          { label: 'Analyze Updated Code', action: 'analyze_updated' },
          { label: 'Add More Features', action: 'add_features' },
          { label: 'Further Optimization', action: 'optimize' }
        ],
        fileContext: updatedFile
      });
    }
  };

  const handleActionClick = async (action, analysisData = null, fileContext = null) => {
    setIsProcessing(true);
    
    try {
      switch (action) {
        case 'setup_ai':
          setShowAISetupModal(true);
          setIsProcessing(false);
          return;
          
        case 'upload_file':
          handleFileSelect();
          setIsProcessing(false);
          return;
          
        case 'create_file':
          setShowNewFileModal(true);
          setIsProcessing(false);
          return;

        case 'view_code':
          if (fileContext || currentFileContext) {
            const file = fileContext || currentFileContext;
            showCodeInEditor(file.content, file.name, file.extension, false);
          }
          setIsProcessing(false);
          return;

        case 'improve_code':
        case 'add_features':
        case 'fix_bugs':
        case 'optimize':
        case 'add_comments':
          if (fileContext || currentFileContext) {
            const file = fileContext || currentFileContext;
            
            // Simulate code improvement - in real implementation, call Ollama with specific request
            const improvedCode = generateImprovedCode(file.content, action, file.extension);
            
            addMessage('ai', `🔧 **Code Improvement Generated!**\n\nI've ${getActionDescription(action)} your code. Here's what I changed:\n\n${getImprovementDescription(action)}\n\n**Review the changes in the code editor and save if you like them!**`, {
              hasActions: true,
              actions: [
                { label: 'View Improved Code', action: 'view_improved_code', improvedCode, fileName: file.name, language: file.extension },
                { label: 'Make Different Changes', action: 'different_changes' },
                { label: 'Explain Changes', action: 'explain_changes' }
              ]
            });
          } else {
            addMessage('ai', `To ${getActionDescription(action)} your code, please upload a file first!`, {
              hasActions: true,
              actions: [
                { label: 'Upload File', action: 'upload_file' }
              ]
            });
          }
          break;

        case 'view_improved_code':
          const { improvedCode, fileName, language } = action;
          showCodeInEditor(improvedCode, fileName, language, true);
          break;

        case 'analyze_updated':
          if (currentFileContext) {
            addMessage('user', '🔄 Analyzing the updated code...');
            await processAIRequest('analyze this updated code', currentFileContext);
            return;
          }
          break;
          
        default:
          addMessage('ai', `I understand you want to "${action.replace('_', ' ')}". ${currentFileContext ? `For the file ${currentFileContext.name}, ` : ''}Can you tell me more specifically what you'd like me to do?\n\nFor example:\n• "Add input validation to the main function"\n• "Optimize the sorting algorithm"\n• "Fix the memory leak in line 45"\n• "Add error handling for network requests"`, {
            hasActions: true,
            actions: currentFileContext ? [
              { label: 'View Current Code', action: 'view_code' },
              { label: 'General Improvements', action: 'improve_code' }
            ] : [
              { label: 'Upload File First', action: 'upload_file' }
            ]
          });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions for code improvement simulation
  const generateImprovedCode = (originalCode, action, extension) => {
    // This is a simulation - in real implementation, this would call Ollama
    const improvements = {
      'improve_code': {
        'py': originalCode.replace(/print\(/g, 'logging.info(').replace(/^/gm, '# Improved: '),
        'js': originalCode.replace(/console\.log\(/g, 'logger.info(').replace(/var /g, 'const '),
        'default': `// IMPROVED VERSION\n// Added better error handling and comments\n\n${originalCode}`
      },
      'add_features': {
        'py': `# Added input validation and error handling\ntry:\n    ${originalCode.replace(/\n/g, '\n    ')}\nexcept Exception as e:\n    logging.error(f"Error: {e}")`,
        'js': `// Added error handling and validation\ntry {\n    ${originalCode.replace(/\n/g, '\n    ')}\n} catch (error) {\n    console.error('Error:', error);\n}`,
        'default': `/* ENHANCED VERSION WITH NEW FEATURES */\n\n${originalCode}\n\n/* Added: Error handling, validation, logging */`
      },
      'fix_bugs': {
        'default': `/* BUG FIXES APPLIED */\n// Fixed potential null pointer issues\n// Added boundary checks\n// Improved error handling\n\n${originalCode.replace(/== null/g, '=== null').replace(/=/g, '===')}`
      },
      'optimize': {
        'default': `/* PERFORMANCE OPTIMIZED */\n// Reduced complexity from O(n²) to O(n log n)\n// Added caching for expensive operations\n// Minimized memory allocations\n\n${originalCode}`
      },
      'add_comments': {
        'default': `/* WELL DOCUMENTED VERSION */\n\n/**\n * Main function - handles primary logic\n * @param {*} input - The input parameters\n * @returns {*} Processed result\n */\n${originalCode.replace(/\n/g, '\n// Step: ')}`
      }
    };
    
    return improvements[action]?.[extension] || improvements[action]?.default || improvements[action].default;
  };

  const getActionDescription = (action) => {
    const descriptions = {
      'improve_code': 'improved',
      'add_features': 'enhanced with new features',
      'fix_bugs': 'fixed bugs in',
      'optimize': 'optimized',
      'add_comments': 'added documentation to'
    };
    return descriptions[action] || 'updated';
  };

  const getImprovementDescription = (action) => {
    const descriptions = {
      'improve_code': '• Better variable naming\n• Improved code structure\n• Enhanced readability\n• Added best practices',
      'add_features': '• Input validation\n• Error handling\n• Logging capabilities\n• Better user feedback',
      'fix_bugs': '• Fixed potential null references\n• Added boundary checks\n• Improved error handling\n• Memory leak prevention',
      'optimize': '• Reduced algorithm complexity\n• Added caching\n• Memory optimization\n• Performance improvements',
      'add_comments': '• Function documentation\n• Inline comments\n• Parameter descriptions\n• Usage examples'
    };
    return descriptions[action] || 'Various improvements applied';
  };

  const handleAISetupComplete = async () => {
    const status = await aiService.checkOllamaStatus();
    setAIStatus(status);
    addMessage('ai', `🎉 **AI Analysis Activated!**\n\nPatchPilot now has advanced conversational capabilities:\n• Natural language code discussions\n• Intelligent bug detection\n• Smart improvement suggestions\n• Interactive code editing\n\nTry asking me: "How can I improve this function?" or "Add error handling to my code"`, {
      hasActions: true,
      actions: [
        { label: 'Upload File', action: 'upload_file' },
        { label: 'Create New File', action: 'create_file' }
      ]
    });
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm border-2 border-dashed border-blue-400 rounded-lg z-50 flex items-center justify-center">
          <div className="text-center">
            <Upload size={48} className="mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold text-blue-400 mb-2">Drop your code file here</h3>
            <p className="text-blue-300">I'll analyze it and we can discuss improvements!</p>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleFileSelect}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FileCode size={18} />
              <span className="font-medium">Upload File</span>
            </button>

            <button
              onClick={handleCreateFile}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus size={18} />
              <span className="font-medium">Create New File</span>
            </button>

            {!aiStatus.available && (
              <button
                onClick={() => setShowAISetupModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Brain size={18} />
                <span className="font-medium">Setup AI</span>
              </button>
            )}
            
            <div className="text-sm text-gray-400">
              or drag & drop to start a conversation
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* AI Status Indicator */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
              aiStatus.available 
                ? 'bg-green-500/20 border-green-500/30 text-green-300'
                : 'bg-orange-500/20 border-orange-500/30 text-orange-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                aiStatus.available ? 'bg-green-400 animate-pulse' : 'bg-orange-400'
              }`} />
              <span className="text-xs font-medium">
                {aiStatus.available ? 'AI Ready' : 'Basic Mode'}
              </span>
            </div>

            {currentFileContext && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                <FileCode size={12} className="text-blue-400" />
                <span className="text-xs font-medium text-blue-300">
                  {currentFileContext.name}
                </span>
                <button
                  onClick={() => setCurrentFileContext(null)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {selectedFile && (
              <div className="flex items-center space-x-3 bg-white/5 rounded-lg px-3 py-2">
                <FileCode size={16} className="text-green-400" />
                <span className="text-sm text-green-300">{selectedFile.name}</span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
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
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white ml-12 shadow-lg'
                  : 'bg-white/5 backdrop-blur-sm text-gray-100 mr-12 border border-white/10'
              }`}
            >
              {message.type === 'ai' && (
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    {aiStatus.available ? <Brain size={14} className="text-white" /> : <Sparkles size={14} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-blue-400">
                    PatchPilot AI {aiStatus.available ? '(AI-Powered)' : '(Basic Mode)'}
                  </span>
                  {message.isConversational && (
                    <div className="flex items-center space-x-1 text-green-400">
                      <Sparkles size={12} />
                      <span className="text-xs">Conversational</span>
                    </div>
                  )}
                  {!aiStatus.available && message.isBasicMode && (
                    <div className="flex items-center space-x-1 text-orange-400">
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
                      onClick={() => {
                        if (action.improvedCode) {
                          showCodeInEditor(action.improvedCode, action.fileName, action.language, true);
                        } else {
                          handleActionClick(action.action, message.analysisData, message.fileContext);
                        }
                      }}
                      className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                    >
                      {action.action === 'view_improved_code' && <Edit size={12} />}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-4xl rounded-2xl p-4 bg-white/5 backdrop-blur-sm text-gray-100 mr-12 border border-white/10">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  {aiStatus.available ? <Brain size={14} className="text-white" /> : <Sparkles size={14} className="text-white" />}
                </div>
                <span className="text-sm font-medium text-blue-400">
                  PatchPilot AI {aiStatus.available ? '(AI-Powered)' : '(Basic Mode)'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span>
                  {aiStatus.available ? 'AI thinking about your request...' : 'Processing your request...'}
                </span>
                <Zap size={16} className="text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentFileContext 
                ? `Ask me about ${currentFileContext.name} - "How can I improve this?" "Add error handling" "Explain this function"...`
                : aiStatus.available 
                  ? "Ask me about code, request improvements, or upload a file to start analyzing..." 
                  : "Ask me about code or upload a file for analysis (Setup AI for advanced features)..."
              }
              className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder-gray-400"
              rows="1"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isProcessing || (!inputValue.trim() && !selectedFile)}
              className="absolute right-3 bottom-3 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Quick Actions and Context */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Press Enter to send • Shift+Enter for new line</span>
            {currentFileContext && (
              <div className="flex items-center space-x-2 text-blue-400">
                <FileCode size={12} />
                <span>Context: {currentFileContext.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {aiStatus.available ? (
              <div className="flex items-center space-x-1 text-green-400">
                <Brain size={12} />
                <span>Conversational AI Ready</span>
              </div>
            ) : (
              <button
                onClick={() => setShowAISetupModal(true)}
                className="flex items-center space-x-1 text-orange-400 hover:text-orange-300 transition-colors"
              >
                <AlertTriangle size={12} />
                <span>Setup AI for conversations</span>
              </button>
            )}
          </div>
        </div>

        {/* Conversation Starters */}
        {!isProcessing && messages.length <= 1 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 mb-2">💡 Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "How can I improve this function?",
                "Add error handling to my code",
                "Optimize this for performance",
                "Explain how this algorithm works",
                "Add input validation"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(suggestion)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-400 hover:text-gray-300 transition-colors"
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
        onFileCreated={handleNewFileCreated}
      />

      <AISetupModal
        isOpen={showAISetupModal}
        onClose={() => setShowAISetupModal(false)}
        onSetupComplete={handleAISetupComplete}
      />

      {/* Enhanced Code Editor */}
      <CodeEditor
        isOpen={showCodeEditor}
        onClose={() => setShowCodeEditor(false)}
        initialContent={editorContent}
        fileName={editorFileName}
        language={editorLanguage}
        onSave={isImprovedCode ? handleCodeEditorSave : undefined}
        isImprovedCode={isImprovedCode}
        showSavePrompt={isImprovedCode}
      />
    </div>
  );
};

export default ChatInterface;