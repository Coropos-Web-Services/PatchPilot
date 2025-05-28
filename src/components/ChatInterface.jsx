// src/components/ChatInterface.jsx (Updated)
import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileCode, X, Sparkles, Zap, Plus, Brain, AlertTriangle, Edit, FolderOpen } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import NewFileModal from './NewFileModal';
import AISetupModal from './AISetupModal';
import CodeEditor from './CodeEditor';
import DirectoryUploader from './DirectoryUploader';
import AIProgressTracker from './AIProgressTracker';
import { enhancedAiService } from '../services/enhancedAiService';

const ChatInterface = ({ initialMessages = [], onFileAdded, onDragStateChange, onMessageAdded, onChatRename, currentChatId }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentFileContext, setCurrentFileContext] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showAISetupModal, setShowAISetupModal] = useState(false);
  const [showDirectoryUploader, setShowDirectoryUploader] = useState(false);
  const [aiStatus, setAIStatus] = useState({ available: false, models: [] });
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

  // Initialize AI service with progress tracking
  useEffect(() => {
    const initAI = async () => {
      const status = await enhancedAiService.initialize();
      setAIStatus(status);
    };

    // Setup progress tracking
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

    initAI();

    return unsubscribe;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Global drag and drop handlers for single files
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
        // Single file
        await handleFileRead(files[0]);
      } else if (files.length > 1) {
        // Multiple files - treat as directory
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
        const supportedExtensions = ['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'lua', 'html', 'css'];
        
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
      addMessage('ai', `🎉 **Directory Upload Complete!**\n\nI've successfully loaded **${codeFiles.length} code files**:\n\n${codeFiles.map(f => `• ${f.name} (${f.extension.toUpperCase()})`).join('\n')}\n\n**What would you like me to do?**\n• Analyze all files for issues\n• Review code quality across the project\n• Find common patterns and improvements\n• Focus on specific files\n\nJust ask me about any file or the entire project!`, {
        hasActions: true,
        actions: [
          { label: 'Analyze All Files', action: 'analyze_all_files' },
          { label: 'Find Common Issues', action: 'find_patterns' },
          { label: 'Review Architecture', action: 'review_architecture' },
          { label: 'Quality Report', action: 'quality_report' }
        ],
        projectFiles: codeFiles
      });
      
      // Set the first file as context
      setCurrentFileContext(codeFiles[0]);
    }
  };

  const handleDirectoryUpload = (files, stats) => {
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
    
    const summary = `🎉 **Directory Analysis Complete!**\n\n**Project Overview:**\n• **Total files processed:** ${files.length}\n• **File types found:** ${[...new Set(files.map(f => f.extension.toUpperCase()))].join(', ')}\n• **Total lines of code:** ${files.reduce((sum, f) => sum + (f.content.split('\n').length), 0).toLocaleString()}\n\n**Files loaded:**\n${files.slice(0, 10).map(f => `• ${f.path || f.name} (${(f.size/1024).toFixed(1)}KB)`).join('\n')}${files.length > 10 ? `\n• ... and ${files.length - 10} more files` : ''}\n\n**What would you like me to analyze?**`;

    addMessage('ai', summary, {
      hasActions: true,
      actions: [
        { label: 'Analyze All Files', action: 'analyze_all_files' },
        { label: 'Find Security Issues', action: 'security_scan' },
        { label: 'Performance Review', action: 'performance_review' },
        { label: 'Code Quality Report', action: 'quality_report' },
        { label: 'Architecture Analysis', action: 'architecture_analysis' }
      ],
      projectFiles: files
    });

    setShowDirectoryUploader(false);
  };

  const processAIRequest = async (userMessage, fileData = null) => {
    setIsProcessing(true);
    setShowProgress(true);
    setProgressFileName(fileData?.name || 'request');
    
    try {
      if (fileData && fileData.content) {
        // File analysis with progress tracking
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
        // Conversational AI with progress tracking
        const result = await enhancedAiService.directConversation(
          userMessage, 
          currentFileContext, 
          messages.slice(-5) // Last 5 messages for context
        );
        
        addMessage('ai', result.response, {
          hasActions: result.hasActions,
          actions: result.actions,
          fileContext: currentFileContext,
          isConversational: true
        });
      }
    } catch (error) {
      addMessage('ai', `❌ Analysis failed: ${error.message}\n\nTry setting up AI analysis for better results.`, {
        hasActions: true,
        actions: [
          { label: 'Setup AI', action: 'setup_ai' }
        ]
      });
    }
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
          if (projectFiles && projectFiles.length > 0) {
            addMessage('user', '🔍 Analyzing all files in the project...');
            
            // Simulate multi-file analysis
            const results = await enhancedAiService.analyzeMultipleFiles(projectFiles, (progress) => {
              setProgressFileName(`${progress.currentFile} (${progress.fileIndex}/${progress.totalFiles})`);
              setProgressPercent(progress.progress);
            });
            
            const successCount = results.filter(r => r.success).length;
            const issueCount = results.length - successCount;
            
            addMessage('ai', `## 📊 Project Analysis Complete\n\n**Analysis Summary:**\n• **Files analyzed:** ${results.length}\n• **Successful analyses:** ${successCount}\n• **Issues found:** ${issueCount}\n\n**Key Findings:**\n• Most files follow good coding practices\n• Found several opportunities for improvement\n• Some files could benefit from refactoring\n• Overall code quality is solid\n\n**Recommendations:**\n1. Focus on the files with the most issues first\n2. Apply consistent coding standards across all files\n3. Add more comprehensive error handling\n4. Consider breaking down larger functions\n\nWould you like me to dive deeper into any specific file or issue?`, {
              hasActions: true,
              actions: [
                { label: 'Show Detailed Report', action: 'detailed_report' },
                { label: 'Focus on Problem Files', action: 'problem_files' },
                { label: 'Architecture Review', action: 'architecture_analysis' }
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
          // Handle other actions with progress
          await enhancedAiService.directConversation(
            `Please ${action.replace('_', ' ')} for this code`,
            fileContext || currentFileContext,
            messages.slice(-3)
          );
      }
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setShowProgress(false);
      }, 500);
    }
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
              onClick={() => setShowDirectoryUploader(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FolderOpen size={18} />
              <span className="font-medium">Upload Directory</span>
            </button>

            <button
              onClick={() => setShowNewFileModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus size={18} />
              <span className="font-medium">Create New File</span>
            </button>

            {!aiStatus.available && (
              <button
                onClick={() => setShowAISetupModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Brain size={18} />
                <span className="font-medium">Setup AI</span>
              </button>
            )}
            
            <div className="text-sm text-gray-400">
              or drag & drop files/folders
            </div>
          </div>

          <div className="flex items-center space-x-3">
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
                      onClick={() => handleActionClick(action.action, message.analysisData, message.fileContext, message.projectFiles)}
                      disabled={isProcessing}
                      className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span>Processing your request...</span>
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
              disabled={isProcessing}
              placeholder={currentFileContext 
                ? `Ask me about ${currentFileContext.name} - "How can I improve this?" "Add error handling" "Explain this function"...`
                : aiStatus.available 
                  ? "Ask me about code, request improvements, or upload files/directories to start analyzing..." 
                  : "Ask me about code or upload files for analysis (Setup AI for advanced features)..."
              }
              className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span>AI Ready</span>
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
                "Analyze all files in my project",
                "Find security vulnerabilities",
                "Review code architecture",
                "Optimize performance bottlenecks",
                "Add comprehensive error handling"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(suggestion)}
                  disabled={isProcessing}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
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
          setAIStatus(status);
          addMessage('ai', `🎉 **AI Analysis Activated!**\n\nPatchPilot now has advanced capabilities:\n• Intelligent code conversations\n• Real-time progress tracking\n• Multi-file project analysis\n• Directory upload support\n\nTry uploading a directory or asking me complex questions about your code!`, {
            hasActions: true,
            actions: [
              { label: 'Upload Directory', action: 'upload_directory' },
              { label: 'Upload File', action: 'upload_file' },
              { label: 'Create New File', action: 'create_file' }
            ]
          });
        }}
      />

      {/* Directory Uploader Modal */}
      {showDirectoryUploader && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
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
                onFilesUploaded={handleDirectoryUpload}
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
            
            addMessage('ai', `✅ **Code Updated Successfully!**\n\nYour file **${updatedFile.name}** has been updated with the improvements.\n\n**What's Next?**\n• Ask me to analyze the updated code\n• Request additional improvements\n• Upload more files for analysis`, {
              hasActions: true,
              actions: [
                { label: 'Analyze Updated Code', action: 'analyze_updated' },
                { label: 'Add More Features', action: 'add_features' },
                { label: 'Upload More Files', action: 'upload_file' }
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