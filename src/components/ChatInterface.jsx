import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileCode, X, Sparkles, Zap, Plus } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import NewFileModal from './NewFileModal';

const ChatInterface = ({ initialMessages = [], onFileAdded, onDragStateChange }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Update messages when initialMessages change (chat switching)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

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
      // Only hide if we're leaving the window completely
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

    // Add global listeners to document AND window
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
      
      // Notify parent about file addition
      if (onFileAdded) {
        onFileAdded(fileData);
      }
      
      // Auto-send the file
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
    
    // Notify parent about file addition
    if (onFileAdded) {
      onFileAdded(fileData);
    }
    
    // Auto-send the file
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
    
    input.onerror = () => {
      console.log('File picker cancelled or failed');
    };
    
    input.oncancel = () => {
      console.log('File picker cancelled');
    };
    
    // Trigger the file picker
    input.click();
    
    // Clean up
    setTimeout(() => {
      input.remove();
    }, 1000);
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

    setInputValue('');
    setSelectedFile(null);
    setIsProcessing(true);

    // Simulate AI processing with real file content
    setTimeout(() => {
      if (fileToProcess && fileToProcess.content) {
        const lines = fileToProcess.content.split('\n').length;
        const detectedLang = fileToProcess.extension || 'unknown';
        const fileSize = fileToProcess.size ? (fileToProcess.size / 1024).toFixed(1) : 'Unknown';
        
        // Basic analysis
        const codeLines = fileToProcess.content.split('\n').filter(line => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('#')).length;
        const commentLines = lines - codeLines;
        
        addMessage('ai', `## Analysis Complete!

**File Overview:**
• **Name:** ${fileToProcess.name}
• **Size:** ${fileSize} KB (${lines} total lines)
• **Language:** ${detectedLang.toUpperCase()}
• **Code lines:** ~${codeLines} | **Comments:** ~${commentLines}

**Code Preview:**
\`\`\`${detectedLang}
${fileToProcess.content.split('\n').slice(0, 8).join('\n')}${lines > 8 ? '\n... (' + (lines - 8) + ' more lines)' : ''}
\`\`\`

**Ready for Analysis**
Your ${detectedLang} file has been loaded successfully! What would you like me to help you with?`, {
          hasActions: true,
          actions: [
            { label: 'Analyze Code Quality', action: 'analyze_code' },
            { label: 'Find Issues', action: 'find_issues' },
            { label: 'View Full Code', action: 'view_full' }
          ]
        });
      } else if (fileToProcess) {
        addMessage('ai', `❌ File selected: ${fileToProcess.name}, but I couldn't read the content. Please try selecting a text-based code file.`);
      } else {
        addMessage('ai', "💬 I'd be happy to help! Upload a code file or ask me about code review, best practices, or any programming questions.");
      }
      setIsProcessing(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = (action) => {
    setIsProcessing(true);
    
    setTimeout(() => {
      switch (action) {
        case 'analyze_code':
        case 'find_issues':
          addMessage('ai', `## Detailed Code Analysis

**Code Quality Assessment:**
• **Structure:** Well-organized file structure detected
• **Readability:** Code appears readable and maintainable
• **Standards:** Following common language conventions

**Potential Improvements:**
• **Comments:** Consider adding more descriptive comments
• **Naming:** Review variable and function naming consistency
• **Performance:** Check for optimization opportunities

**Specific Recommendations:**
• **Best Practices:** Follow language-specific style guides
• **Error Handling:** Ensure proper error handling throughout
• **Testing:** Consider adding unit tests for critical functions

**Focus Areas:**
What aspect would you like me to dive deeper into?`, {
            hasActions: true,
            actions: [
              { label: 'Performance Review', action: 'check_performance' },
              { label: 'Security Analysis', action: 'security_review' },
              { label: 'Style Guide', action: 'style_guide' }
            ]
          });
          break;
        case 'view_full':
          const fullContent = selectedFile?.content || 'No file content available';
          const lines = fullContent.split('\n');
          const displayContent = lines.length > 50 
            ? lines.slice(0, 50).join('\n') + '\n... (truncated - ' + (lines.length - 50) + ' more lines)'
            : fullContent;
            
          addMessage('ai', `## Complete File Contents

\`\`\`${selectedFile?.extension || 'text'}
${displayContent}
\`\`\`

**File Statistics:**
• **Total lines:** ${lines.length}
• **File size:** ${selectedFile?.size || 0} bytes
• **Language:** ${selectedFile?.extension || 'unknown'}

**Analysis Options:**
Choose what you'd like me to examine:`, {
            hasActions: true,
            actions: [
              { label: 'Analyze Functions', action: 'analyze_functions' },
              { label: 'Check Imports', action: 'check_imports' },
              { label: 'Review Logic', action: 'review_logic' }
            ]
          });
          break;
        default:
          addMessage('ai', `## ${action.replace('_', ' ').toUpperCase()} Analysis

This feature is coming soon! I'm continuously learning new ways to help you improve your code.

**Available Now:**
• Code structure analysis
• Basic quality assessment
• File content review
• Best practice suggestions

**Coming Soon:**
• Advanced analysis features
• Automated fix suggestions
• Integration with popular linters

Would you like me to perform a different type of analysis?`, {
            hasActions: true,
            actions: [
              { label: 'Try Different Analysis', action: 'analyze_code' },
              { label: 'Upload New File', action: 'new_file' }
            ]
          });
      }
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm border-2 border-dashed border-blue-400 rounded-lg z-50 flex items-center justify-center">
          <div className="text-center">
            <Upload size={48} className="mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold text-blue-400 mb-2">Drop your code file here</h3>
            <p className="text-blue-300">Supports Python, JavaScript, Java, C++, and more!</p>
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
            
            <div className="text-sm text-gray-400">
              or drag & drop anywhere on the window
            </div>
          </div>

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
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-400">PatchPilot AI</span>
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
                      onClick={() => handleActionClick(action.action)}
                      className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                    >
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
                  <Sparkles size={14} className="text-white" />
                </div>
                <span className="text-sm font-medium text-blue-400">PatchPilot AI</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span>Analyzing your code...</span>
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
              placeholder="Ask me about code review, best practices, or upload a file..."
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
      </div>

      {/* New File Modal */}
      <NewFileModal 
        isOpen={showNewFileModal}
        onClose={() => setShowNewFileModal(false)}
        onFileCreated={handleNewFileCreated}
      />
    </div>
  );
};

export default ChatInterface;