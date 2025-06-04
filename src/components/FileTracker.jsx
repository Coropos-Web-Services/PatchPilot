// src/components/FileTracker.jsx (Enhanced with Directory Structure)
import React, { useState, useMemo } from 'react';
import { FileText, Eye, Edit3, Download, RefreshCw, Clock, AlertCircle, Plus, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';

const FileTracker = ({ files, onViewFile, onEditFile, isVisible, directoryStats }) => {
  const [refreshingFiles, setRefreshingFiles] = useState(new Set());
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'list'

  // Build hierarchical structure for tree view
  const fileTree = useMemo(() => {
    const tree = {
      name: 'Project',
      type: 'directory',
      children: {},
      files: [],
      path: ''
    };

    files.forEach(file => {
      if (file.path && (file.path.includes('/') || file.path.includes('\\'))) {
        // File has directory structure (support Windows paths)
        const pathParts = file.path.split(/[/\\]/);
        const fileName = pathParts.pop();
        let currentLevel = tree;
        let currentPath = '';

        // Build directory tree
        pathParts.forEach((dirName, index) => {
          currentPath += (index === 0 ? '' : '/') + dirName;
          
          if (!currentLevel.children[dirName]) {
            currentLevel.children[dirName] = {
              name: dirName,
              type: 'directory',
              children: {},
              files: [],
              path: currentPath
            };
          }
          currentLevel = currentLevel.children[dirName];
        });

        // Add file to final directory
        currentLevel.files.push({
          ...file,
          displayName: fileName,
          parentPath: currentPath
        });
      } else {
        // Root level file
        tree.files.push({
          ...file,
          displayName: file.name,
          parentPath: ''
        });
      }
    });

    return tree;
  }, [files]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getLanguageIcon = (extension) => {
    const icons = {
      'js': '🟨', 'jsx': '⚛️', 'ts': '🔷', 'tsx': '⚛️',
      'py': '🐍', 'java': '☕', 'cpp': '⚙️', 'c': '⚙️',
      'rs': '🦀', 'go': '🐹', 'php': '🐘', 'rb': '💎',
      'swift': '🍎', 'kt': '📱', 'cs': '🔷',
      'html': '🌐', 'css': '🎨', 'json': '📋',
      'xml': '📄', 'yaml': '📝', 'yml': '📝',
      'md': '📝', 'txt': '📄', 'lua': '🌙', 'luau': '🌙',
      'sql': '🗃️', 'sh': '💻', 'bash': '💻'
    };
    return icons[extension] || '📄';
  };

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const handleRefreshFile = async (fileId) => {
    setRefreshingFiles(prev => new Set([...prev, fileId]));
    
    // Simulate file refresh - in real implementation, this would re-read the file
    setTimeout(() => {
      setRefreshingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }, 1000);
  };

  const handleDownload = (file) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderFileItem = (file, isRoot = false) => (
    <div
      key={file.id}
      className={`group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 transition-all duration-200 ${
        isRoot ? '' : 'ml-4'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">
            {getLanguageIcon(file.extension)}
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-white truncate" title={file.path || file.name}>
              {file.displayName || file.name}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{file.extension.toUpperCase()}</span>
              {file.parentPath && (
                <>
                  <span>•</span>
                  <span className="text-blue-400">{file.parentPath}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <div className="flex items-center space-x-1">
          <Clock size={12} />
          <span>Added {formatTimestamp(file.addedAt)}</span>
        </div>
        {file.isModified && (
          <div className="flex items-center space-x-1 text-yellow-400">
            <AlertCircle size={12} />
            <span>Modified</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onViewFile(file)}
          className="flex items-center space-x-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-xs text-blue-300 hover:text-blue-200 transition-colors"
        >
          <Eye size={12} />
          <span>View</span>
        </button>
        
        <button
          onClick={() => onEditFile(file)}
          className="flex items-center space-x-1 px-2 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded text-xs text-green-300 hover:text-green-200 transition-colors"
        >
          <Edit3 size={12} />
          <span>Edit</span>
        </button>
        
        <button
          onClick={() => handleDownload(file)}
          className="flex items-center space-x-1 px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-xs text-purple-300 hover:text-purple-200 transition-colors"
        >
          <Download size={12} />
          <span>Save</span>
        </button>
        
        <button
          onClick={() => handleRefreshFile(file.id)}
          disabled={refreshingFiles.has(file.id)}
          className="flex items-center space-x-1 px-2 py-1 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded text-xs text-gray-300 hover:text-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshingFiles.has(file.id) ? 'animate-spin' : ''} />
          <span>Sync</span>
        </button>
      </div>

      {/* File Preview */}
      {file.content && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="bg-black/30 rounded p-2 text-xs font-mono text-gray-300 max-h-20 overflow-hidden">
            {file.content.split('\n').slice(0, 3).join('\n')}
            {file.content.split('\n').length > 3 && (
              <div className="text-gray-500 mt-1">...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderDirectoryTree = (node, level = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = Object.keys(node.children).length > 0 || node.files.length > 0;

    return (
      <div key={node.path} className={level > 0 ? 'ml-4' : ''}>
        {/* Directory Header */}
        {level > 0 && (
          <div className="flex items-center space-x-2 py-2 px-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
            <button
              onClick={() => toggleFolder(node.path)}
              className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white"
            >
              {hasChildren && (
                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              )}
              {isExpanded ? <FolderOpen size={14} className="text-blue-400" /> : <Folder size={14} className="text-blue-400" />}
              <span className="font-medium">{node.name}</span>
              <span className="text-xs text-gray-500">
                ({Object.keys(node.children).length + node.files.length} items)
              </span>
            </button>
          </div>
        )}

        {/* Directory Contents */}
        {(level === 0 || isExpanded) && (
          <div className={level > 0 ? 'ml-4 space-y-2' : 'space-y-2'}>
            {/* Subdirectories */}
            {Object.values(node.children).map(childDir => 
              renderDirectoryTree(childDir, level + 1)
            )}
            
            {/* Files */}
            {node.files.map(file => renderFileItem(file, level === 0))}
          </div>
        )}
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="w-80 bg-black/20 backdrop-blur-xl border-l border-white/10 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-blue-400" />
            <h3 className="font-semibold text-white">Project Files</h3>
            <span className="px-2 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-xs text-blue-300">
              {files.length}
            </span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 mb-3">
          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
              viewMode === 'tree' 
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Folder size={12} />
            <span>Tree</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <FileText size={12} />
            <span>List</span>
          </button>
        </div>

        {/* Directory Stats */}
        {directoryStats && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-3">
            <h4 className="text-sm font-medium text-purple-300 mb-2">Project Overview</h4>
            <div className="space-y-1 text-xs text-purple-200">
              <div>📁 {directoryStats.codeFiles} code files</div>
              <div>📊 {files.reduce((sum, f) => sum + f.content.split('\n').length, 0).toLocaleString()} total lines</div>
              <div>🎯 {[...new Set(files.map(f => f.extension))].length} file types</div>
            </div>
          </div>
        )}
        
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openNewFileModal'))}
          className="w-full flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 rounded-lg transition-all duration-200 text-green-300 hover:text-green-200"
        >
          <Plus size={16} />
          <span className="text-sm font-medium">Create New File</span>
        </button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        {files.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files yet</p>
            <p className="text-xs">Upload files or directories to track them here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {viewMode === 'tree' ? (
              renderDirectoryTree(fileTree)
            ) : (
              files.map(file => renderFileItem(file, true))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-gray-400 text-center space-y-1">
          <p>Files are tracked in real-time</p>
          {files.length > 0 && (
            <p>
              {files.reduce((sum, f) => sum + f.size, 0) > 1024 
                ? `${(files.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1)} KB total`
                : `${files.reduce((sum, f) => sum + f.size, 0)} B total`
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileTracker;