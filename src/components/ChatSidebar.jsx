import React, { useState } from 'react';
import { Plus, MessageSquare, FileText, Clock, Trash2, Edit3, Save, X } from 'lucide-react';

const ChatSidebar = ({ 
  isOpen, 
  chats, 
  currentChatId, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat, 
  onRenameChat 
}) => {
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const startEditing = (chat) => {
    setEditingChatId(chat.id);
    setEditingName(chat.name);
  };

  const saveEdit = () => {
    if (editingName.trim()) {
      onRenameChat(editingChatId, editingName.trim());
    }
    setEditingChatId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingChatId(null);
    setEditingName('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onNewChat}
          className="w-full flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus size={18} />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {chats.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chats yet</p>
            <p className="text-xs">Create a new chat to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                  currentChatId === chat.id
                    ? 'bg-blue-600/20 border border-blue-500/30'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {editingChatId === chat.id ? (
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={saveEdit}
                          className="p-1 text-green-400 hover:text-green-300"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 mb-1">
                          <MessageSquare size={14} className="text-blue-400 flex-shrink-0" />
                          <h3 className="font-medium text-white truncate">{chat.name}</h3>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Clock size={12} />
                          <span>{formatDate(chat.lastModified)}</span>
                          {chat.fileCount > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <FileText size={12} />
                                <span>{chat.fileCount} file{chat.fileCount !== 1 ? 's' : ''}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {editingChatId !== chat.id && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(chat);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-gray-400 text-center">
          <p>{chats.length} chat{chats.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;