import React, { useState } from 'react';
import { Folder, Upload, File } from 'lucide-react';

const FilePicker = ({ onFileSelect }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = async () => {
    try {
      // For now, we'll simulate file selection
      // In actual Tauri app, this would use @tauri-apps/api/dialog
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.py,.js,.ts,.java,.cpp,.rs,.go,.lua,.php,.rb,.swift,.kt,.cs,.html,.css,.json,.xml,.yaml,.yml,.md,.txt';
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          onFileSelect(file);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const codeFile = files.find(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ['py', 'js', 'ts', 'java', 'cpp', 'rs', 'go', 'lua', 'php', 'rb', 'swift', 'kt', 'cs', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'md', 'txt'].includes(ext);
    });
    
    if (codeFile) {
      onFileSelect(codeFile);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleFileSelect}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors"
      >
        <Folder size={16} />
        <span>Choose Desktop File</span>
      </button>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center space-x-2 px-4 py-2 border-2 border-dashed rounded-lg transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
            : 'border-gray-600 text-gray-400 hover:border-gray-500'
        }`}
      >
        <Upload size={16} />
        <span className="text-sm">
          {isDragOver ? 'Drop file here' : 'Or drag & drop'}
        </span>
      </div>
    </div>
  );
};

export default FilePicker;