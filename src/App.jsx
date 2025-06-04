// Fixed App.jsx - Proper useEffect Dependencies
import React, { useState, useEffect, useCallback } from 'react';
import ChatInterface from './components/ChatInterface';
import ChatSidebar from './components/ChatSidebar';
import FileTracker from './components/FileTracker';
import CodeEditor from './components/CodeEditor';
import LoadingScreen from './components/LoadingScreen';
import InfoModal from './components/InfoModal';
import UpdateModal from './components/UpdateModal';
import { storageUtils } from './utils/storageUtils';
import { contextAwareAiService } from './services/contextAwareAiService';
import { updateService } from './services/updateService';
import { Menu, FileText, X, Info, Brain, FolderOpen, Activity, Code2, Globe, Sparkles } from 'lucide-react';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fileTrackerOpen, setFileTrackerOpen] = useState(true);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatFiles, setChatFiles] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorFile, setEditorFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [aiStatus, setAIStatus] = useState({ available: false, models: [] });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  // Enhanced states for directory support and context awareness
  const [isProcessingDirectory, setIsProcessingDirectory] = useState(false);
  const [directoryStats, setDirectoryStats] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState({ step: '', progress: 0, message: '' });
  const [projectStructure, setProjectStructure] = useState(null);
  const [internetAccess, setInternetAccess] = useState(false);

  // FIXED: Initialize app with stored data - ONLY RUNS ONCE
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load settings
        const settings = storageUtils.loadSettings();
        setSidebarOpen(settings.sidebarOpen ?? true);
        setFileTrackerOpen(settings.fileTrackerOpen ?? true);
        setInternetAccess(settings.internetAccess ?? false);

        // Load chats
        const storedChats = storageUtils.loadChats();
        const storedCurrentChatId = storageUtils.loadCurrentChatId();

        if (storedChats.length > 0) {
          setChats(storedChats);
          
          // Set current chat ID, or use the first chat if stored ID doesn't exist
          const validChatId = storedChats.find(chat => chat.id === storedCurrentChatId)?.id || storedChats[0].id;
          setCurrentChatId(validChatId);
          
          // Load files for current chat - THIS IS CRITICAL
          const files = await storageUtils.loadChatFiles(validChatId);
          setChatFiles(files);
          
          // Update AI service context immediately
          if (files.length > 0) {
            contextAwareAiService.updateChatContext(files);
            
            // Generate project structure if multiple files
            if (files.length > 1) {
              const structure = contextAwareAiService.generateProjectStructureText();
              setProjectStructure(structure);
            }
          }
        } else {
          // Create default chat if none exist
          const defaultChat = {
            id: 'default-chat',
            name: 'New Chat',
            messages: [{
              id: 1,
              type: 'ai',
              content: "🌟 Welcome to **PatchPilot** - Your Advanced AI Coding Companion!\n\n**🚀 Enhanced Features:**\n• 🧠 **Full Context Awareness** - I analyze ALL your files automatically\n• 📁 **Directory Intelligence** - Perfect folder structure understanding\n• 💬 **Natural Conversations** - Ask me absolutely anything!\n• 🌐 **Internet Access** - I can research frameworks, libraries, and latest practices (opt-in)\n• 🎨 **Modern Interface** - Beautiful, developer-focused design\n\n**💡 Ask Me Anything:**\n• Code questions: *\"How do I implement authentication in React?\"*\n• Project analysis: *\"What can be improved in this codebase?\"*\n• Learning: *\"Explain async/await vs Promises\"*\n• Debugging: *\"Why isn't this function working?\"*\n• Best practices: *\"What's the latest in Next.js 14?\"*\n\n**🎯 Smart Context:**\n• Upload files → I remember everything\n• Ask questions → I analyze with full project understanding\n• Mention specific files → I focus there while keeping context\n\nReady to code together? 🚀",
              timestamp: new Date()
            }],
            fileCount: 0,
            lastModified: Date.now()
          };
          
          const initialChats = [defaultChat];
          setChats(initialChats);
          setCurrentChatId(defaultChat.id);
          setChatFiles([]);
          
          // Save initial state
          storageUtils.saveChats(initialChats);
          storageUtils.saveCurrentChatId(defaultChat.id);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Fallback to default state
        const defaultChat = {
          id: 'default-chat',
          name: 'New Chat',
          messages: [{
            id: 1,
            type: 'ai',
            content: "🌟 Welcome to PatchPilot! I'm your AI coding companion. Upload files or ask me anything about programming!",
            timestamp: new Date()
          }],
          fileCount: 0,
          lastModified: Date.now()
        };
        
        setChats([defaultChat]);
        setCurrentChatId(defaultChat.id);
        setChatFiles([]);
      }
    };

    initializeApp();
  }, []); // FIXED: Empty dependency array - only runs once

  // FIXED: Initialize context-aware AI service - ONLY RUNS ONCE
  useEffect(() => {
    const initAI = async () => {
      try {
        const status = await contextAwareAiService.initialize();
        setAIStatus(status);
        
        // Setup global progress tracking
        const unsubscribe = contextAwareAiService.onProgress((progress) => {
          setAnalysisProgress(progress);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize context-aware AI service:', error);
        setAIStatus({ available: false, models: [], error: error.message });
      }
    };

    initAI();
  }, []); // FIXED: Empty dependency array - only runs once

  // FIXED: Update AI context using useCallback to prevent infinite loops
  const updateAIContext = useCallback((files) => {
    if (files.length > 0) {
      // Update AI service with current files
      contextAwareAiService.updateChatContext(files);
      
      // Generate project structure if we have multiple files with paths
      const hasDirectoryStructure = files.some(
        f => f.path && (f.path.includes('/') || f.path.includes('\\'))
      );
      if (hasDirectoryStructure) {
        const structure = contextAwareAiService.generateProjectStructureText();
        setProjectStructure(structure);
      } else {
        setProjectStructure(null);
      }
    } else {
      // Clear context when no files
      contextAwareAiService.updateChatContext([]);
      setProjectStructure(null);
    }
  }, []); // FIXED: Empty dependencies since the function doesn't depend on anything

  // FIXED: Update AI context whenever chat files change
  useEffect(() => {
    updateAIContext(chatFiles);
  }, [chatFiles, updateAIContext]); // FIXED: Stable dependencies

  // FIXED: Save chats with proper dependencies
  useEffect(() => {
    if (chats.length > 0) {
      storageUtils.saveChats(chats);
    }
  }, [chats]); // FIXED: Only depends on chats

  // FIXED: Save current chat ID and load files - prevent infinite loop
  useEffect(() => {
    if (currentChatId) {
      storageUtils.saveCurrentChatId(currentChatId);
      
      // Load files for the new chat and update AI context
      storageUtils.loadChatFiles(currentChatId).then(files => {
        setChatFiles(files);
      });
      
      // Update directory stats if this chat has directory data
      const currentChat = chats.find(c => c.id === currentChatId);
      if (currentChat?.directoryStats) {
        setDirectoryStats(currentChat.directoryStats);
      } else {
        setDirectoryStats(null);
      }
    }
  }, [currentChatId]); // FIXED: Only depends on currentChatId, not chats

  // FIXED: Save chat files with proper dependencies
  useEffect(() => {
    if (currentChatId && chatFiles.length >= 0) {
      storageUtils.saveChatFiles(currentChatId, chatFiles);
      
      // Update the chat's file count in real-time
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, fileCount: chatFiles.length, lastModified: Date.now() }
          : chat
      ));
    }
  }, [currentChatId, chatFiles]); // FIXED: Stable dependencies

  // FIXED: Save settings with proper dependencies
  useEffect(() => {
    const settings = {
      sidebarOpen,
      fileTrackerOpen,
      internetAccess,
      theme: 'dark'
    };
    storageUtils.saveSettings(settings);
  }, [sidebarOpen, fileTrackerOpen, internetAccess]); // FIXED: Only the actual dependencies

  // FIXED: Check for updates - ONLY RUNS ONCE
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const updateInfo = await updateService.checkForUpdates();
        if (updateInfo?.hasUpdate && !updateService.isUpdateDismissed(updateInfo.latestVersion)) {
          setUpdateInfo(updateInfo);
          setShowUpdateModal(true);
        }
      } catch (error) {
        console.error('Update check failed:', error);
      }
    };

    setTimeout(checkForUpdates, 5000);
  }, []); // FIXED: Empty dependency array - only runs once

  // FIXED: Memoized event handlers to prevent unnecessary re-renders
  const handleNewChat = useCallback(() => {
    const newChat = {
      id: `chat-${Date.now()}`,
      name: `Chat ${chats.length + 1}`,
      messages: [{
        id: 1,
        type: 'ai',
        content: "🌟 Hello! I'm PatchPilot, ready to help with any coding question or project.\n\n**Ask me anything:**\n• Programming concepts and best practices\n• Framework-specific questions\n• Code review and optimization\n• Debugging help\n• Architecture advice\n• Latest tech trends and updates\n\nUpload files for project analysis or just start asking questions! 🚀",
        timestamp: new Date()
      }],
      fileCount: 0,
      lastModified: Date.now()
    };
    
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setCurrentChatId(newChat.id);
    setChatFiles([]);
    setDirectoryStats(null);
    setProjectStructure(null);
  }, [chats]); // FIXED: Only depends on chats

  const handleSelectChat = useCallback((chatId) => {
    setCurrentChatId(chatId);
    // Files will be loaded automatically by useEffect
  }, []);

  const handleDeleteChat = useCallback((chatId) => {
    if (chats.length <= 1) return;
    
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    // Delete associated files
    storageUtils.deleteChatFiles(chatId);
    
    if (currentChatId === chatId) {
      const newCurrentChatId = updatedChats[0]?.id || null;
      setCurrentChatId(newCurrentChatId);
    }
  }, [chats, currentChatId]);

  const handleRenameChat = useCallback((chatId, newName) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, name: newName } : chat
    ));
  }, []);

  const handleFileAdded = useCallback((file) => {
    const fileWithId = {
      ...file,
      id: `file-${Date.now()}-${Math.random()}`,
      addedAt: Date.now(),
      isModified: false
    };
    
    setChatFiles(prev => {
      const existingIndex = prev.findIndex(f => (f.path === file.path) || (f.name === file.name && !file.path));
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...fileWithId, isModified: true };
        return updated;
      }
      return [...prev, fileWithId];
    });
  }, []);

  const handleMultipleFilesAdded = useCallback((files, stats) => {
    // Add all files first
    files.forEach(file => handleFileAdded(file));
    
    // Store directory stats in chat
    setDirectoryStats(stats);
    
    // Update chat with directory information
    const directoryName = stats.directoryPath || stats.name || 'Project';
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { 
            ...chat, 
            name: `${directoryName} Analysis`,
            fileCount: files.length,
            lastModified: Date.now(),
            directoryStats: stats // Store stats in chat
          }
        : chat
    ));
  }, [currentChatId, handleFileAdded]);

  const handleViewFile = useCallback((file) => {
    setEditorFile({
      ...file,
      mode: 'view'
    });
    setEditorOpen(true);
  }, []);

  const handleEditFile = useCallback((file) => {
    setEditorFile({
      ...file,
      mode: 'edit'
    });
    setEditorOpen(true);
  }, []);

  const handleAddMessage = useCallback((message) => {
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { 
            ...chat, 
            messages: [...chat.messages, message],
            lastModified: Date.now()
          }
        : chat
    ));
  }, [currentChatId]);

  const handleChatRename = useCallback((chatId, code, filename, userMessage = '') => {
    const newName = generateSmartChatName(code, filename, userMessage, chatFiles);
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, name: newName } : chat
    ));
  }, [chatFiles]);

  const generateSmartChatName = useCallback((code, filename, userMessage, allFiles) => {
    if (allFiles.length > 1) {
      const languages = [...new Set(allFiles.map(f => f.extension))];
      const primaryLang = languages[0]?.toUpperCase() || 'Code';
      
      if (userMessage.toLowerCase().includes('analyze') || userMessage.toLowerCase().includes('review')) {
        return `${primaryLang} Project Analysis`;
      } else if (userMessage.toLowerCase().includes('improve') || userMessage.toLowerCase().includes('optimize')) {
        return `${primaryLang} Project Enhancement`;
      } else if (userMessage.toLowerCase().includes('bug') || userMessage.toLowerCase().includes('fix')) {
        return `${primaryLang} Bug Investigation`;
      } else {
        return `${primaryLang} Project Review`;
      }
    } else if (filename) {
      const baseName = filename.split('.')[0];
      return `${baseName} Analysis`;
    } else {
      return `Coding Discussion`;
    }
  }, []);

  const toggleInternetAccess = useCallback(() => {
    setInternetAccess(prev => {
      const newValue = !prev;
      // Notify the AI service about internet access change
      contextAwareAiService.setInternetAccess(newValue);
      return newValue;
    });
  }, []);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-neutral-950 text-white overflow-hidden relative">
      {/* Enhanced Global Drag Overlay with Modern Colors */}
      {isDragOver && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-indigo-600/15 to-indigo-700/20 backdrop-blur-sm border-4 border-dashed border-indigo-400 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Code2 size={48} className="text-indigo-300" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent mb-2">Drop Your Code Here</h2>
            <p className="text-indigo-200 text-lg">I'll analyze everything with full context awareness</p>
            <div className="mt-4 text-sm text-indigo-100 space-y-1">
              <p>• 📄 **Single files:** Instant analysis</p>
              <p>• 📁 **Directories:** Full project understanding</p>
              <p>• 🧠 **Smart context:** I remember everything for our conversation</p>
            </div>
          </div>
        </div>
      )}

      <div className="h-full flex">
        {/* Chat Sidebar */}
        <ChatSidebar
          isOpen={sidebarOpen}
          chats={chats}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Header with Modern Colors */}
          <header className="bg-slate-900/50 backdrop-blur-xl border-b border-indigo-500/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
                
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">🧠</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">
                    PatchPilot
                  </h1>
                  <p className="text-sm text-gray-300">
                    {currentChat?.name || 'AI-Powered Code Companion'}
                    {chatFiles.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-300">
                        {chatFiles.length} files loaded
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Internet Access Toggle */}
                <button
                  onClick={toggleInternetAccess}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 border ${
                    internetAccess 
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-slate-700/50 border-slate-600/50 text-slate-400 hover:bg-slate-600/50'
                  }`}
                  title={internetAccess ? 'Internet access enabled - AI can research latest info' : 'Click to enable internet access for AI'}
                >
                  <Globe size={14} className={internetAccess ? 'text-emerald-400' : 'text-slate-400'} />
                  <span className="text-xs font-medium">
                    {internetAccess ? 'Online' : 'Offline'}
                  </span>
                </button>

                {/* File Tracker Toggle */}
                <button
                  onClick={() => setFileTrackerOpen(!fileTrackerOpen)}
                  className="flex items-center space-x-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-all duration-200"
                >
                  <FileText size={16} />
                  <span className="text-sm">Files ({chatFiles.length})</span>
                </button>

                {/* Project Structure Indicator */}
                {projectStructure && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
                    <FolderOpen size={12} className="text-amber-400" />
                    <span className="text-xs font-medium text-amber-300">
                      Project Loaded
                    </span>
                  </div>
                )}

                {/* Context Awareness Indicator */}
                {chatFiles.length > 0 && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                    <Brain size={12} className="text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-300">
                      Context: {chatFiles.reduce((sum, f) => sum + f.content.split('\n').length, 0)} lines
                    </span>
                  </div>
                )}

                {/* Info Button */}
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-all duration-200"
                  title="About PatchPilot"
                >
                  <Info size={16} />
                </button>
                
                {/* Status Indicators */}
                <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-emerald-300 font-medium">Ready</span>
                </div>

                {/* AI Status */}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
                  aiStatus.available 
                    ? 'bg-indigo-500/20 border-indigo-500/30'
                    : 'bg-amber-500/20 border-amber-500/30'
                }`}>
                  <Brain size={12} className={aiStatus.available ? 'text-indigo-400' : 'text-amber-400'} />
                  <span className={`text-xs font-medium ${
                    aiStatus.available ? 'text-indigo-300' : 'text-amber-300'
                  }`}>
                    {aiStatus.available ? 'AI Ready' : 'Basic Mode'}
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Progress Bar with Modern Colors */}
            {(isProcessingDirectory || analysisProgress.progress > 0) && (
              <div className="mt-3 bg-slate-800/50 border border-indigo-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                  <span className="flex items-center space-x-2">
                    <Brain size={12} className="text-indigo-400" />
                    <span>{analysisProgress.message || 'Processing with full context...'}</span>
                  </span>
                  <span>{Math.round(analysisProgress.progress || 0)}%</span>
                </div>
                <div className="bg-slate-700/50 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analysisProgress.progress || 0}%` }}
                  />
                </div>
                {chatFiles.length > 0 && (
                  <div className="text-xs text-gray-400">
                    Analyzing {chatFiles.length} files in context • {chatFiles.reduce((sum, f) => sum + f.content.split('\n').length, 0)} total lines
                  </div>
                )}
              </div>
            )}
          </header>

          {/* Main Chat Interface */}
          <main className="flex-1 overflow-hidden">
            <ChatInterface 
              key={currentChatId}
              initialMessages={currentChat?.messages || []}
              onFileAdded={handleFileAdded}
              onMultipleFilesAdded={handleMultipleFilesAdded}
              onDragStateChange={setIsDragOver}
              onMessageAdded={handleAddMessage}
              onChatRename={handleChatRename}
              onProcessingStateChange={setIsProcessingDirectory}
              currentChatId={currentChatId}
              aiStatus={aiStatus}
              directoryStats={directoryStats}
              chatFiles={chatFiles}
              internetAccess={internetAccess}
            />
          </main>
        </div>

        {/* Enhanced File Tracker Sidebar */}
        <FileTracker
          isVisible={fileTrackerOpen}
          files={chatFiles}
          onViewFile={handleViewFile}
          onEditFile={handleEditFile}
          directoryStats={directoryStats}
        />

        {/* Enhanced Code Editor Modal */}
        <CodeEditor
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          initialContent={editorFile?.content || ''}
          fileName={editorFile?.name || 'untitled.txt'}
          language={editorFile?.extension || 'text'}
          onSave={(content) => {
            if (editorFile) {
              const updatedFile = {
                ...editorFile,
                content: content,
                size: content.length,
                isModified: true,
                lastModified: Date.now()
              };
              
              // Update the file in chat files and AI context
              setChatFiles(prev => {
                const updated = prev.map(f => 
                  f.id === editorFile.id ? updatedFile : f
                );
                
                // Update AI service context immediately
                contextAwareAiService.updateChatContext(updated);
                return updated;
              });
              
              // Add a message about the update
              handleAddMessage({
                id: Date.now(),
                type: 'ai',
                content: `✅ **File Updated:** ${updatedFile.name}\n\nYour changes have been saved and I've updated my context. The modified file is now available for our conversation with all the latest changes included.`,
                timestamp: new Date(),
                hasActions: true,
                actions: [
                  { label: 'Analyze Updated Code', action: 'analyze_updated' },
                  { label: 'Review All Changes', action: 'review_changes' }
                ]
              });
            }
            setEditorOpen(false);
          }}
        />

        {/* Info Modal */}
        <InfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />

        {/* Update Modal */}
        <UpdateModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          updateInfo={updateInfo}
        />
      </div>
    </div>
  );
}

export default App;