import React from 'react';
import { sanitizeHTML } from '../utils/sanitizeHTML';

const MarkdownRenderer = ({ content }) => {
  const renderMarkdown = (text) => {
    let html = text;
    
    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="bg-black/30 border border-white/10 rounded-lg p-4 overflow-x-auto my-3"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-white/10 px-2 py-1 rounded border border-white/10 font-mono text-sm">$1</code>');
    
    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    
    // Italic text
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-blue-300 mb-2 mt-4">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-blue-300 mb-2 mt-4">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-blue-300 mb-3 mt-4">$1</h1>');
    
    // Lists
    html = html.replace(/^• (.*)$/gm, '<li class="ml-4 mb-1">• $1</li>');
    html = html.replace(/^- (.*)$/gm, '<li class="ml-4 mb-1">• $1</li>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank">$1</a>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  const sanitized = sanitizeHTML(renderMarkdown(content));

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

export default MarkdownRenderer;
