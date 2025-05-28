// src/components/DirectoryUploader.jsx
import React, { useState } from 'react';
import { Folder, FolderOpen, FileText, Upload, AlertCircle, CheckCircle } from 'lucide-react';

const DirectoryUploader = ({ onFilesUploaded, onProgress }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);

  const supportedExtensions = [
    'py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'h', 'hpp', 'rs', 'go', 
    'php', 'rb', 'swift', 'kt', 'cs', 'html', 'css', 'scss', 'sass', 'json', 
    'xml', 'yaml', 'yml', 'md', 'txt', 'lua', 'r', 'sql', 'sh', 'bash', 'ps1', 
    'vue', 'svelte', 'luau'
  ];

  const isCodeFile = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return supportedExtensions.includes(extension);
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsText(file);
    });
  };

  const processDirectory = async (files) => {
    setIsProcessing(true);
    const processedFiles = [];
    const errors = [];
    let processed = 0;
    const codeFiles = Array.from(files).filter(file => isCodeFile(file.name));
    
    setUploadStats({
      total: codeFiles.length,
      processed: 0,
      currentFile: '',
      errors: []
    });

    for (const file of codeFiles) {
      try {
        setUploadStats(prev => ({
          ...prev,
          processed,
          currentFile: file.name
        }));

        if (onProgress) {
          onProgress(`Reading ${file.name}...`, (processed / codeFiles.length) * 100);
        }

        const content = await readFileAsText(file);
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        
        const fileData = {
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          path: file.webkitRelativePath || file.name,
          content: content,
          size: content.length,
          extension: extension,
          type: file.type || `text/${extension}`,
          lastModified: file.lastModified,
          addedAt: Date.now(),
          isModified: false,
          isDirectory: true
        };

        processedFiles.push(fileData);
        processed++;

      } catch (error) {
        errors.push(`${file.name}: ${error.message}`);
        console.error(`Failed to process ${file.name}:`, error);
      }
    }

    setUploadStats({
      total: codeFiles.length,
      processed: processedFiles.length,
      currentFile: '',
      errors
    });

    setIsProcessing(false);
    
    if (onFilesUploaded) {
      onFilesUploaded(processedFiles, {
        totalFiles: files.length,
        codeFiles: codeFiles.length,
        processedFiles: processedFiles.length,
        errors
      });
    }
  };

  const handleDirectorySelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true; // Enable directory selection
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await processDirectory(files);
      }
    };
    
    input.click();
    setTimeout(() => input.remove(), 1000);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const items = Array.from(e.dataTransfer.items);
    const files = [];

    // Process dropped items (including directories)
    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          if (entry.isDirectory) {
            await traverseDirectory(entry, files);
          } else {
            const file = item.getAsFile();
            if (file && isCodeFile(file.name)) {
              files.push(file);
            }
          }
        }
      }
    }

    if (files.length > 0) {
      await processDirectory(files);
    }
  };

  const traverseDirectory = async (entry, files, path = '') => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file) => {
          if (isCodeFile(file.name)) {
            // Add relative path to file object
            Object.defineProperty(file, 'webkitRelativePath', {
              value: path + file.name,
              writable: false
            });
            files.push(file);
          }
          resolve();
        });
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      return new Promise((resolve) => {
        reader.readEntries(async (entries) => {
          for (const childEntry of entries) {
            await traverseDirectory(childEntry, files, path + entry.name + '/');
          }
          resolve();
        });
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Directory Upload Button */}
      <button
        onClick={handleDirectorySelect}
        disabled={isProcessing}
        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-white font-medium"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <FolderOpen size={18} />
            <span>Upload Directory</span>
          </>
        )}
      </button>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer ${
          isDragOver 
            ? 'border-purple-500 bg-purple-500/20 text-purple-400' 
            : 'border-gray-600 text-gray-400 hover:border-gray-500 hover:bg-gray-700/30'
        }`}
      >
        <div className="text-center">
          <Folder size={32} className="mx-auto mb-2" />
          <p className="font-medium mb-1">
            {isDragOver ? 'Drop your project folder here!' : 'Drag & drop a project folder'}
          </p>
          <p className="text-sm opacity-75">
            Supports {supportedExtensions.length} file types • Automatically filters code files
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadStats && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              {isProcessing ? 'Processing Directory...' : 'Upload Complete'}
            </span>
            <span className="text-sm text-gray-400">
              {uploadStats.processed}/{uploadStats.total} files
            </span>
          </div>
          
          {uploadStats.currentFile && (
            <p className="text-sm text-blue-400 mb-2">
              📄 {uploadStats.currentFile}
            </p>
          )}
          
          <div className="bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(uploadStats.processed / uploadStats.total) * 100}%` }}
            />
          </div>
          
          {uploadStats.errors.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center space-x-2 text-red-400 text-sm mb-1">
                <AlertCircle size={14} />
                <span>{uploadStats.errors.length} errors</span>
              </div>
              <div className="max-h-20 overflow-y-auto text-xs text-red-300">
                {uploadStats.errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DirectoryUploader;