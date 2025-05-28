import React, { useState, useRef, useEffect } from 'react';
import { Save, Copy, Download, X, Code2, Play, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

const CodeEditor = ({ 
  isOpen, 
  onClose, 
  initialContent = '', 
  fileName = 'untitled.txt', 
  language = 'javascript',
  onSave = null,
  isImprovedCode = false,
  showSavePrompt = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [isModified, setIsModified] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setContent(initialContent);
    setIsModified(false);
  }, [initialContent]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setIsModified(e.target.value !== initialContent);
  };

  const handleSave = () => {
    if (isImprovedCode && onSave) {
      // This is improved code from AI - confirm before applying
      setShowConfirmSave(true);
    } else {
      // Regular save/download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      setIsModified(false);
    }
  };

  const handleConfirmSave = () => {
    if (onSave) {
      onSave(content);
    }
    setShowConfirmSave(false);
    setIsModified(false);
    onClose();
  };

  const handleCancelSave = () => {
    setShowConfirmSave(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all changes?')) {
      setContent(initialContent);
      setIsModified(false);
    }
  };

  const getLanguageDisplayName = (lang) => {
    const languages = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'rust': 'Rust',
      'go': 'Go',
      'php': 'PHP',
      'ruby': 'Ruby',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'csharp': 'C#',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'markdown': 'Markdown',
      'lua': 'Lua',
      'sql': 'SQL',
      'bash': 'Bash',
      'text': 'Plain Text'
    };
    return languages[lang] || lang.toUpperCase();
  };

  const addLineNumbers = () => {
    const lines = content.split('\n');
    return lines.map((_, index) => index + 1).join('\n');
  };

  const handleKeyDown = (e) => {
    // Tab indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      setContent(newValue);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isImprovedCode 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                : 'bg-gradient-to-br from-blue-500 to-purple-600'
            }`}>
              {isImprovedCode ? <CheckCircle size={16} className="text-white" /> : <Code2 size={16} className="text-white" />}
            </div>
            <div>
              <h3 className="font-semibold text-white">{fileName}</h3>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-400">{getLanguageDisplayName(language)} Editor</p>
                {isImprovedCode && (
                  <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-300">
                    AI Improved
                  </span>
                )}
              </div>
            </div>
            {isModified && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Unsaved changes" />
                <span className="text-xs text-yellow-400">Modified</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className={`p-2 rounded-lg transition-colors ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
              title="Copy to clipboard"
            >
              <Copy size={16} />
            </button>
            
            {isModified && !isImprovedCode && (
              <button
                onClick={handleReset}
                className="p-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg transition-colors text-orange-300"
                title="Reset changes"
              >
                <RotateCcw size={16} />
              </button>
            )}
            
            <button
              onClick={handleSave}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isImprovedCode 
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title={isImprovedCode ? "Apply improvements" : "Download file"}
            >
              {isImprovedCode ? <CheckCircle size={16} /> : <Download size={16} />}
              <span className="text-sm">{isImprovedCode ? 'Apply Changes' : 'Save'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* AI Improvement Notice */}
        {isImprovedCode && (
          <div className="bg-green-500/10 border-b border-green-500/20 p-3">
            <div className="flex items-center space-x-2 text-green-300">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">AI-Generated Improvements</span>
            </div>
            <p className="text-xs text-green-200 mt-1">
              Review the changes below. Click "Apply Changes" to update your file, or close to discard.
            </p>
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Line Numbers */}
          <div className="bg-black/20 border-r border-white/10 p-4 select-none min-w-[60px]">
            <pre className="text-gray-500 text-sm font-mono leading-6 text-right">
              {addLineNumbers()}
            </pre>
          </div>
          
          {/* Code Content */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className="w-full h-full p-4 bg-transparent text-white font-mono text-sm leading-6 resize-none focus:outline-none"
              placeholder="Start typing your code here..."
              spellCheck={false}
              style={{
                tabSize: 2,
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>Lines: {content.split('\n').length}</span>
            <span>Characters: {content.length}</span>
            <span>Language: {getLanguageDisplayName(language)}</span>
            {isImprovedCode && (
              <span className="text-green-400">⚡ AI Enhanced</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {copied && (
              <span className="text-green-400 text-sm">Copied!</span>
            )}
            {isModified && (
              <span className="text-yellow-400 text-sm">Unsaved changes</span>
            )}
            <div className="flex items-center space-x-1 text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for AI Improvements */}
      {showConfirmSave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-gray-800/95 backdrop-blur-xl border border-white/20 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Apply AI Improvements?</h3>
                <p className="text-sm text-gray-400">This will update your original file</p>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-6">
              The AI has generated improvements to your code. Applying these changes will update your original file with the enhanced version.
            </p>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancelSave}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white font-medium"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;