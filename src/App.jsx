import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import ChatSidebar from './components/ChatSidebar';
import FileTracker from './components/FileTracker';
import CodeEditor from './components/CodeEditor';
import LoadingScreen from './components/LoadingScreen';
import InfoModal from './components/InfoModal';
import UpdateModal from './components/UpdateModal';
import { storageUtils } from './utils/storageUtils';
import { enhancedAiService } from './services/enhancedAiService';
import { updateService } from './services/updateService';
import { Menu, FileText, X, Info, Brain, FolderOpen, Activity } from 'lucide-react';
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

  // Enhanced states for directory support
  const [isProcessingDirectory, setIsProcessingDirectory] = useState(false);
  const [directoryStats, setDirectoryStats] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState({ step: '', progress: 0, message: '' });

  // Initialize app with stored data or defaults
  useEffect(() => {
    const initializeApp = () => {
      try {
        // Load settings
        const settings = storageUtils.loadSettings();
        setSidebarOpen(settings.sidebarOpen);
        setFileTrackerOpen(settings.fileTrackerOpen);

        // Load chats
        const storedChats = storageUtils.loadChats();
        const storedCurrentChatId = storageUtils.loadCurrentChatId();

        if (storedChats.length > 0) {
          setChats(storedChats);
          
          // Set current chat ID, or use the first chat if stored ID doesn't exist
          const validChatId = storedChats.find(chat => chat.id === storedCurrentChatId)?.id || storedChats[0].id;
          setCurrentChatId(validChatId);
          
          // Load files for current chat
          const files = storageUtils.loadChatFiles(validChatId);
          setChatFiles(files);
        } else {
          // Create default chat if none exist
          const defaultChat = {
            id: 'default-chat',
            name: 'New Chat',
            messages: [{
              id: 1,
              type: 'ai',
              content: "👋 Welcome to PatchPilot! I'm your AI code reviewer. \n\n**What's New:**\n• 📁 **Directory Upload** - Drag entire project folders for analysis\n• 🔄 **Real-time Progress** - See exactly what I'm doing\n• 🧠 **Enhanced AI** - Smarter conversations about your code\n\nDrag & drop any code file or folder to get started, or ask me anything about programming!",
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
            content: "👋 Welcome to PatchPilot! I'm your AI code reviewer. Drag & drop any code file or folder onto this window to start analyzing!",
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
  }, []);

  // Initialize enhanced AI service
  useEffect(() => {
    const initAI = async () => {
      try {
        const status = await enhancedAiService.initialize();
        setAIStatus(status);
        
        // Setup global progress tracking
        const unsubscribe = enhancedAiService.onProgress((progress) => {
          setAnalysisProgress(progress);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize enhanced AI service:', error);
        setAIStatus({ available: false, models: [], error: error.message });
      }
    };

    initAI();
  }, []);

  // Save chats whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      storageUtils.saveChats(chats);
    }
  }, [chats]);

  // Save current chat ID whenever it changes
  useEffect(() => {
    if (currentChatId) {
      storageUtils.saveCurrentChatId(currentChatId);
    }
  }, [currentChatId]);

  // Save chat files whenever they change
  useEffect(() => {
    if (currentChatId && chatFiles.length >= 0) {
      storageUtils.saveChatFiles(currentChatId, chatFiles);
    }
  }, [currentChatId, chatFiles]);

  // Save settings when sidebar states change
  useEffect(() => {
    const settings = {
      sidebarOpen,
      fileTrackerOpen,
      theme: 'dark'
    };
    storageUtils.saveSettings(settings);
  }, [sidebarOpen, fileTrackerOpen]);

  // Check for updates on app start
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

    // Check for updates after a delay
    setTimeout(checkForUpdates, 5000);
  }, []);

  const handleNewChat = () => {
    const newChat = {
      id: `chat-${Date.now()}`,
      name: `Chat ${chats.length + 1}`,
      messages: [{
        id: 1,
        type: 'ai',
        content: "👋 Hello! I'm PatchPilot, ready to help you review and improve your code. What can I assist you with today?\n\n**Try:**\n• Upload a file or directory for analysis\n• Ask questions about coding best practices\n• Request specific improvements or fixes",
        timestamp: new Date()
      }],
      fileCount: 0,
      lastModified: Date.now()
    };
    
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setCurrentChatId(newChat.id);
    setChatFiles([]); // Clear files for new chat
    setDirectoryStats(null); // Clear directory stats
  };

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
    // Load files for selected chat
    const files = storageUtils.loadChatFiles(chatId);
    setChatFiles(files);
    
    // Clear directory stats when switching chats
    setDirectoryStats(null);
  };

  const handleDeleteChat = (chatId) => {
    if (chats.length <= 1) return; // Don't delete the last chat
    
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    // Delete associated files
    storageUtils.deleteChatFiles(chatId);
    
    if (currentChatId === chatId) {
      const newCurrentChatId = updatedChats[0]?.id || null;
      setCurrentChatId(newCurrentChatId);
      
      if (newCurrentChatId) {
        const files = storageUtils.loadChatFiles(newCurrentChatId);
        setChatFiles(files);
      } else {
        setChatFiles([]);
      }
    }
  };

  const handleRenameChat = (chatId, newName) => {
    const updatedChats = chats.map(chat => 
      chat.id === chatId ? { ...chat, name: newName } : chat
    );
    setChats(updatedChats);
  };

  const handleFileAdded = (file) => {
    const fileWithId = {
      ...file,
      id: `file-${Date.now()}-${Math.random()}`,
      addedAt: Date.now(),
      isModified: false
    };
    
    setChatFiles(prev => {
      // Check if file already exists (by name), if so, update it
      const existingIndex = prev.findIndex(f => f.name === file.name);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...fileWithId, isModified: true };
        return updated;
      }
      return [...prev, fileWithId];
    });

    // Update chat file count
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, fileCount: (chatFiles.length + 1), lastModified: Date.now() }
        : chat
    ));
  };

  const handleMultipleFilesAdded = (files, stats) => {
    // Add all files to chat
    files.forEach(file => handleFileAdded(file));
    
    // Store directory stats for display
    setDirectoryStats(stats);
    
    // Update chat with directory info
    const directoryName = stats.directoryPath ? stats.directoryPath.split('/').pop() || 'Project' : 'Directory';
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { 
            ...chat, 
            name: `${directoryName} Analysis`,
            fileCount: files.length,
            lastModified: Date.now()
          }
        : chat
    ));
  };

  const handleViewFile = (file) => {
    setEditorFile({
      ...file,
      mode: 'view'
    });
    setEditorOpen(true);
  };

  const handleEditFile = (file) => {
    setEditorFile({
      ...file,
      mode: 'edit'
    });
    setEditorOpen(true);
  };

  // Add message to current chat and save
  const handleAddMessage = (message) => {
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { 
            ...chat, 
            messages: [...chat.messages, message],
            lastModified: Date.now()
          }
        : chat
    ));
  };

  // Handle AI naming of chats
  const handleChatRename = (chatId, code, filename, userMessage = '') => {
    const newName = enhancedAiService.generateChatName ? 
      enhancedAiService.generateChatName(code, filename, userMessage) :
      `${filename} Analysis`;
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, name: newName } : chat
    ));
  };

  const currentChat = chats.find(chat => chat.id === currentChatId);

  // Show loading screen first
  if (isLoading) {
    return <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white overflow-hidden relative">
      {/* Global Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500/30 backdrop-blur-sm border-4 border-dashed border-blue-400 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
              <FolderOpen size={48} className="text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-blue-400 mb-2">Drop Your Code Files or Folders</h2>
            <p className="text-blue-300 text-lg">Single files, multiple files, or entire directories supported</p>
            <div className="mt-4 text-sm text-blue-200">
              <p>• Individual files: Instant analysis</p>
              <p>• Multiple files: Batch processing</p>
              <p>• Directories: Full project analysis</p>
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
          {/* Enhanced Header */}
          <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
                
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">🧠</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    PatchPilot
                  </h1>
                  <p className="text-sm text-gray-400">
                    {currentChat?.name || 'AI-Powered Code Reviewer'}
                    {directoryStats && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs">
                        {directoryStats.processedFiles} files analyzed
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* File Tracker Toggle */}
                <button
                  onClick={() => setFileTrackerOpen(!fileTrackerOpen)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FileText size={16} />
                  <span className="text-sm">Files ({chatFiles.length})</span>
                </button>

                {/* Directory Stats */}
                {directoryStats && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
                    <FolderOpen size={12} className="text-purple-400" />
                    <span className="text-xs font-medium text-purple-300">
                      Project: {directoryStats.codeFiles} files
                    </span>
                  </div>
                )}

                {/* Processing Indicator */}
                {isProcessingDirectory && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                    <Activity size={12} className="text-blue-400 animate-pulse" />
                    <span className="text-xs font-medium text-blue-300">
                      Processing...
                    </span>
                  </div>
                )}

                {/* Info Button */}
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  title="About PatchPilot"
                >
                  <Info size={16} />
                </button>
                
                {/* Status Indicators */}
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-300 font-medium">Offline Ready</span>
                </div>

                {/* AI Status */}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
                  aiStatus.available 
                    ? 'bg-blue-500/20 border-blue-500/30'
                    : 'bg-orange-500/20 border-orange-500/30'
                }`}>
                  <Brain size={12} className={aiStatus.available ? 'text-blue-400' : 'text-orange-400'} />
                  <span className={`text-xs font-medium ${
                    aiStatus.available ? 'text-blue-300' : 'text-orange-300'
                  }`}>
                    {aiStatus.available ? 'AI Ready' : 'Basic Mode'}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar (when processing) */}
            {(isProcessingDirectory || analysisProgress.progress > 0) && (
              <div className="mt-3 bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                  <span>{analysisProgress.message || 'Processing...'}</span>
                  <span>{Math.round(analysisProgress.progress || 0)}%</span>
                </div>
                <div className="bg-gray-700/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analysisProgress.progress || 0}%` }}
                  />
                </div>
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

        {/* Code Editor Modal */}
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
              
              // Update the file in the chat files
              setChatFiles(prev => prev.map(f => 
                f.id === editorFile.id ? updatedFile : f
              ));
              
              // Add a message about the update
              handleAddMessage({
                id: Date.now(),
                type: 'ai',
                content: `✅ **File Updated:** ${updatedFile.name}\n\nYour changes have been saved. The file is now marked as modified and ready for re-analysis if needed.`,
                timestamp: new Date()
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