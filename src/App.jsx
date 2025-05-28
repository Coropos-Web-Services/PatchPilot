import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import ChatSidebar from './components/ChatSidebar';
import FileTracker from './components/FileTracker';
import CodeEditor from './components/CodeEditor';
import LoadingScreen from './components/LoadingScreen';
import InfoModal from './components/InfoModal';
import { Menu, FileText, X, Info } from 'lucide-react';
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

  // Initialize with a default chat
  useEffect(() => {
    const defaultChat = {
      id: 'default-chat',
      name: 'New Chat',
      messages: [{
        id: 1,
        type: 'ai',
        content: "👋 Welcome to PatchPilot! I'm your AI code reviewer. Drag & drop any code file onto this window, or type a message to get started.",
        timestamp: new Date()
      }],
      fileCount: 0,
      lastModified: Date.now()
    };
    
    setChats([defaultChat]);
    setCurrentChatId('default-chat');
  }, []);

  const handleNewChat = () => {
    const newChat = {
      id: `chat-${Date.now()}`,
      name: `Chat ${chats.length + 1}`,
      messages: [{
        id: 1,
        type: 'ai',
        content: "👋 Hello! I'm PatchPilot, ready to help you review and improve your code. What can I assist you with today?",
        timestamp: new Date()
      }],
      fileCount: 0,
      lastModified: Date.now()
    };
    
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setChatFiles([]); // Clear files for new chat
  };

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
    // Load files for this chat (in real implementation, this would come from storage)
    setChatFiles([]);
  };

  const handleDeleteChat = (chatId) => {
    if (chats.length <= 1) return; // Don't delete the last chat
    
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      setCurrentChatId(remainingChats[0]?.id || null);
    }
  };

  const handleRenameChat = (chatId, newName) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, name: newName } : chat
    ));
  };

  const handleFileAdded = (file) => {
    const fileWithId = {
      ...file,
      id: `file-${Date.now()}`,
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
        ? { ...chat, fileCount: chatFiles.length + 1, lastModified: Date.now() }
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
              <FileText size={48} className="text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-blue-400 mb-2">Drop Your Code File</h2>
            <p className="text-blue-300 text-lg">Release to upload and analyze</p>
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
          {/* Header */}
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
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setFileTrackerOpen(!fileTrackerOpen)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FileText size={16} />
                  <span className="text-sm">Files ({chatFiles.length})</span>
                </button>

                <button
                  onClick={() => setShowInfoModal(true)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  title="About PatchPilot"
                >
                  <Info size={16} />
                </button>
                
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-300 font-medium">Offline Ready</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Chat Interface */}
          <main className="flex-1 overflow-hidden">
            <ChatInterface 
              key={currentChatId}
              initialMessages={currentChat?.messages || []}
              onFileAdded={handleFileAdded}
              onDragStateChange={setIsDragOver}
            />
          </main>
        </div>

        {/* File Tracker Sidebar */}
        <FileTracker
          isVisible={fileTrackerOpen}
          files={chatFiles}
          onViewFile={handleViewFile}
          onEditFile={handleEditFile}
        />

        {/* Code Editor Modal */}
        <CodeEditor
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          initialContent={editorFile?.content || ''}
          fileName={editorFile?.name || 'untitled.txt'}
          language={editorFile?.extension || 'text'}
        />

        {/* Info Modal */}
        <InfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />
      </div>
    </div>
  );
}

export default App;