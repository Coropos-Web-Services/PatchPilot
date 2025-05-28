import React, { useState } from 'react';
import { Folder, Upload, File, AlertCircle } from 'lucide-react';

const FilePicker = ({ onFileSelect }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if we're in a Tauri environment
  const isTauri = window.__TAURI__ !== undefined;

  const handleFileSelect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try Tauri dialog first, fall back to browser input
      if (isTauri) {
        try {
          const { open } = await import('@tauri-apps/plugin-dialog');
          const selected = await open({
            title: 'Select a code file to review',
            multiple: false,
            filters: [{
              name: 'Code Files',
              extensions: ['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'h', 'hpp', 'rs', 'go', 'php', 'rb', 'swift', 'kt', 'cs', 'html', 'css', 'scss', 'sass', 'json', 'xml', 'yaml', 'yml', 'md', 'txt', 'lua', 'r', 'sql', 'sh', 'bash', 'ps1', 'vue', 'svelte']
            }]
          });

          if (selected) {
            const { readTextFile } = await import('@tauri-apps/plugin-fs');
            const content = await readTextFile(selected);
            
            const filename = selected.split('/').pop() || selected.split('\\').pop() || 'unknown';
            const extension = filename.split('.').pop()?.toLowerCase() || '';
            
            const fileData = {
              name: filename,
              path: selected,
              content: content,
              size: content.length,
              extension: extension,
              type: `text/${extension}`,
              lastModified: Date.now()
            };

            onFileSelect(fileData);
            setIsLoading(false);
            return;
          }
        } catch (tauriError) {
          console.warn('Tauri dialog failed, falling back to browser:', tauriError);
          // Fall through to browser method
        }
      }

      // Browser fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.py,.js,.ts,.jsx,.tsx,.java,.cpp,.c,.h,.hpp,.rs,.go,.php,.rb,.swift,.kt,.cs,.html,.css,.scss,.sass,.json,.xml,.yaml,.yml,.md,.txt,.lua,.r,.sql,.sh,.bash,.ps1,.vue,.svelte';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const content = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = reject;
              reader.readAsText(file);
            });

            const extension = file.name.split('.').pop()?.toLowerCase() || '';

            const fileData = {
              name: file.name,
              path: file.name,
              content: content,
              size: content.length,
              extension: extension,
              type: file.type || `text/${extension}`,
              lastModified: file.lastModified
            };

            onFileSelect(fileData);
          } catch (error) {
            setError(`Failed to read file: ${error.message}`);
          }
        }
        setIsLoading(false);
      };
      
      input.click();
    } catch (error) {
      console.error('Error selecting file:', error);
      setError(`Failed to open file picker: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set isDragOver to false if we're leaving the drop zone completely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsLoading(true);
    setError(null);

    try {
      const files = Array.from(e.dataTransfer.files);
      const file = files[0];
      
      if (!file) {
        setError('No file was dropped');
        setIsLoading(false);
        return;
      }

      // Check if it's a supported file type
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const supportedExtensions = ['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'h', 'hpp', 'rs', 'go', 'php', 'rb', 'swift', 'kt', 'cs', 'html', 'css', 'scss', 'sass', 'json', 'xml', 'yaml', 'yml', 'md', 'txt', 'lua', 'r', 'sql', 'sh', 'bash', 'ps1', 'vue', 'svelte'];
      
      if (!supportedExtensions.includes(extension)) {
        setError(`Unsupported file type: .${extension}. Please select a code file.`);
        setIsLoading(false);
        return;
      }

      // Read file content
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      const fileData = {
        name: file.name,
        path: file.name,
        content: content,
        size: content.length,
        extension: extension,
        type: file.type || `text/${extension}`,
        lastModified: file.lastModified
      };

      onFileSelect(fileData);
    } catch (error) {
      setError(`Error reading dropped file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleFileSelect}
        disabled={isLoading}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 border border-gray-600 rounded-lg transition-colors"
      >
        {isLoading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span>Loading...</span>
          </>
        ) : (
          <>
            <Folder size={16} />
            <span>Choose File</span>
          </>
        )}
      </button>
      
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center space-x-2 px-4 py-2 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
            : 'border-gray-600 text-gray-400 hover:border-gray-500 hover:bg-gray-700/30'
        }`}
      >
        <Upload size={16} />
        <span className="text-sm">
          {isDragOver ? 'Drop file here!' : 'Or drag & drop'}
        </span>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-400 text-sm max-w-md">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="truncate">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="text-red-300 hover:text-red-100 ml-2"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default FilePicker;
