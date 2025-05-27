import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileText, Settings, Code, CheckCircle } from 'lucide-react';
import FilePicker from './FilePicker';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm PatchPilot, your local AI code reviewer. Upload a file from your Desktop or drag & drop it here to get started!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return;

    // Add user message
    if (inputValue.trim()) {
      addMessage('user', inputValue);
    }

    // Add file info if file is selected
    if (selectedFile) {
      addMessage('user', `📎 Selected file: ${selectedFile.name}`, { 
        fileInfo: selectedFile 
      });
    }

    setInputValue('');
    setIsProcessing(true);

    // Simulate AI processing (replace with actual AI call later)
    setTimeout(() => {
      if (selectedFile) {
        addMessage('ai', `I've analyzed your ${selectedLanguage === 'auto' ? 'code' : selectedLanguage} file. Here's what I found:

📋 **Analysis Summary:**
• File: ${selectedFile.name}
• Size: ${(selectedFile.size / 1024).toFixed(1)} KB
• Language: ${selectedLanguage === 'auto' ? 'Auto-detected' : selectedLanguage}

🔍 **Issues Found:**
• 2 potential bugs detected
• 1 performance optimization opportunity
• 3 style improvements suggested

Would you like me to show the details and provide fixes?`, {
          hasActions: true,
          actions: [
            { label: 'Show Details', action: 'show_details' },
            { label: 'Apply Fixes', action: 'apply_fixes' },
            { label: 'View Diff', action: 'view_diff' }
          ]
        });
      } else {
        addMessage('ai', "I'd be happy to help! Please upload a code file or ask me a specific question about code review.");
      }
      setIsProcessing(false);
      setSelectedFile(null);
    }, 2000);
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
        case 'show_details':
          addMessage('ai', `🔍 **Detailed Analysis:**

**Bug #1 - Line 12:** Unused variable \`temp_data\`
\`\`\`python
temp_data = process_input()  # ← Never used after this
return result
\`\`\`

**Bug #2 - Line 28:** Potential null pointer
\`\`\`python
if user.preferences:  # ← Should check if user exists first
    apply_preferences(user.preferences)
\`\`\`

**Performance Issue - Line 45:** Inefficient loop
\`\`\`python
for i in range(len(items)):  # ← Use enumerate() instead
    process(items[i], i)
\`\`\`

Would you like me to fix these issues?`, {
            hasActions: true,
            actions: [
              { label: 'Yes, Fix All', action: 'apply_fixes' },
              { label: 'Fix Individually', action: 'fix_individual' }
            ]
          });
          break;
        case 'apply_fixes':
          addMessage('ai', `✅ **Fixes Applied Successfully!**

I've created a fixed version of your file with the following changes:
• Removed unused variable \`temp_data\`
• Added null check for user object
• Optimized loop using \`enumerate()\`
• Fixed 3 style issues

📁 **File Status:**
• Original: preserved as \`backup_${Date.now()}\`
• Fixed version: ready for review`, {
            hasActions: true,
            actions: [
              { label: 'View Diff', action: 'view_diff' },
              { label: 'Save Fixed File', action: 'save_file' },
              { label: 'Analyze Another File', action: 'new_file' }
            ]
          });
          break;
        case 'view_diff':
          addMessage('ai', `📊 **Code Diff Preview:**

\`\`\`diff
- temp_data = process_input()
  return result

- if user.preferences:
+ if user and user.preferences:
    apply_preferences(user.preferences)

- for i in range(len(items)):
-     process(items[i], i)
+ for i, item in enumerate(items):
+     process(item, i)
\`\`\`

The changes look good! Ready to save?`, {
            hasActions: true,
            actions: [
              { label: 'Save Changes', action: 'save_file' },
              { label: 'Revert Changes', action: 'revert' }
            ]
          });
          break;
      }
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      {/* File Selection Bar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          <FilePicker onFileSelect={setSelectedFile} />
          
          <select 
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="auto">Auto-detect</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
          </select>

          {selectedFile && (
            <div className="flex items-center space-x-2 text-sm text-green-400">
              <FileText size={16} />
              <span>{selectedFile.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl p-4 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white ml-12'
                  : 'bg-gray-800 text-gray-100 mr-12'
              }`}
            >
              {message.type === 'ai' && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">
                    🧠
                  </div>
                  <span className="text-sm font-medium text-blue-400">PatchPilot</span>
                </div>
              )}
              
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {message.hasActions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleActionClick(action.action)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-3xl p-4 rounded-lg bg-gray-800 text-gray-100 mr-12">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">
                  🧠
                </div>
                <span className="text-sm font-medium text-blue-400">PatchPilot</span>
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span>Analyzing your code...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your request to PatchPilot here..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="1"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isProcessing || (!inputValue.trim() && !selectedFile)}
              className="absolute right-3 bottom-3 w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;