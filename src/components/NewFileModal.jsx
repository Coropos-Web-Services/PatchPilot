import React, { useState, useRef, useEffect } from 'react';
import { X, FileText, Code2, FileCode, Plus, Wand2 } from 'lucide-react';

const NewFileModal = ({ isOpen, onClose, onFileCreated }) => {
  const [fileName, setFileName] = useState('');
  const [language, setLanguage] = useState('python');
  const [content, setContent] = useState('');
  const [template, setTemplate] = useState('blank');
  const fileNameInputRef = useRef(null);

  // Language templates
  const templates = {
    python: {
      blank: '',
      basic: `# Python Script
def main():
    """Main function"""
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
      class: `class MyClass:
    """A simple example class"""
    
    def __init__(self, name):
        self.name = name
    
    def greet(self):
        return f"Hello, {self.name}!"

# Example usage
if __name__ == "__main__":
    obj = MyClass("World")
    print(obj.greet())
`
    },
    javascript: {
      blank: '',
      basic: `// JavaScript Script
function main() {
    console.log("Hello, World!");
}

main();
`,
      function: `// Function example
const greet = (name) => {
    return \`Hello, \${name}!\`;
};

// Example usage
console.log(greet("World"));
`,
      class: `// Class example
class MyClass {
    constructor(name) {
        this.name = name;
    }
    
    greet() {
        return \`Hello, \${this.name}!\`;
    }
}

// Example usage
const obj = new MyClass("World");
console.log(obj.greet());
`
    },
    lua: {
      blank: '',
      basic: `-- Lua Script
print("Hello, World!")
`,
      function: `-- Function example
function greet(name)
    return "Hello, " .. name .. "!"
end

-- Example usage
print(greet("World"))
`,
      luau: `-- Roblox LuaU Script
local Players = game:GetService("Players")
local player = Players.LocalPlayer

print("Hello, " .. player.Name .. "!")
`
    },
    typescript: {
      blank: '',
      basic: `// TypeScript Script
function main(): void {
    console.log("Hello, World!");
}

main();
`,
      interface: `// Interface example
interface Person {
    name: string;
    age: number;
}

function greet(person: Person): string {
    return \`Hello, \${person.name}!\`;
}

// Example usage
const user: Person = { name: "World", age: 25 };
console.log(greet(user));
`
    },
    java: {
      blank: '',
      basic: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
      class: `public class MyClass {
    private String name;
    
    public MyClass(String name) {
        this.name = name;
    }
    
    public String greet() {
        return "Hello, " + name + "!";
    }
    
    public static void main(String[] args) {
        MyClass obj = new MyClass("World");
        System.out.println(obj.greet());
    }
}
`
    },
    cpp: {
      blank: '',
      basic: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`,
      class: `#include <iostream>
#include <string>

class MyClass {
private:
    std::string name;
    
public:
    MyClass(const std::string& name) : name(name) {}
    
    std::string greet() {
        return "Hello, " + name + "!";
    }
};

int main() {
    MyClass obj("World");
    std::cout << obj.greet() << std::endl;
    return 0;
}
`
    },
    html: {
      blank: '',
      basic: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>
`,
      full: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f0f0f0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome!</h1>
        <p>This is a starter template.</p>
    </div>
</body>
</html>
`
    }
  };

  // Language configurations
  const languages = {
    python: { name: 'Python', ext: 'py', icon: '🐍' },
    javascript: { name: 'JavaScript', ext: 'js', icon: '🟨' },
    typescript: { name: 'TypeScript', ext: 'ts', icon: '🔷' },
    lua: { name: 'Lua/LuaU', ext: 'lua', icon: '🌙' },
    java: { name: 'Java', ext: 'java', icon: '☕' },
    cpp: { name: 'C++', ext: 'cpp', icon: '⚙️' },
    html: { name: 'HTML', ext: 'html', icon: '🌐' },
    css: { name: 'CSS', ext: 'css', icon: '🎨' },
    json: { name: 'JSON', ext: 'json', icon: '📋' },
    markdown: { name: 'Markdown', ext: 'md', icon: '📝' }
  };

  useEffect(() => {
    if (isOpen && fileNameInputRef.current) {
      fileNameInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Update content when template or language changes
    const langTemplates = templates[language] || { blank: '' };
    setContent(langTemplates[template] || langTemplates.blank || '');
  }, [language, template]);

  useEffect(() => {
    // Auto-generate filename based on language
    if (!fileName) {
      const defaultNames = {
        python: 'script.py',
        javascript: 'script.js',
        typescript: 'script.ts',
        lua: 'script.lua',
        java: 'Main.java',
        cpp: 'main.cpp',
        html: 'index.html',
        css: 'styles.css',
        json: 'data.json',
        markdown: 'README.md'
      };
      setFileName(defaultNames[language] || 'file.txt');
    }
  }, [language, fileName]);

  const handleCreate = () => {
    if (!fileName.trim()) {
      alert('Please enter a filename');
      return;
    }

    const extension = fileName.split('.').pop()?.toLowerCase() || language;
    const fileData = {
      name: fileName.trim(),
      content: content,
      size: content.length,
      extension: extension,
      type: `text/${extension}`,
      lastModified: Date.now(),
      isNew: true
    };

    onFileCreated(fileData);
    
    // Reset form
    setFileName('');
    setContent('');
    setTemplate('blank');
  };

  const handleCancel = () => {
    onClose();
    // Reset form
    setFileName('');
    setContent('');
    setTemplate('blank');
  };

  const getTemplateOptions = () => {
    const langTemplates = templates[language];
    if (!langTemplates) return [{ key: 'blank', name: 'Blank File' }];
    
    return Object.keys(langTemplates).map(key => ({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1) + (key === 'blank' ? ' File' : ' Template')
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create New File</h2>
              <p className="text-sm text-gray-400">Perfect for LuaU, Roblox scripts, or any code</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Choose Language</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(languages).map(([key, lang]) => (
                  <button
                    key={key}
                    onClick={() => setLanguage(key)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                      language === key
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg">{lang.icon}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Template</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {getTemplateOptions().map(({ key, name }) => (
                  <button
                    key={key}
                    onClick={() => setTemplate(key)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                      template === key
                        ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Wand2 size={16} />
                    <span className="text-sm">{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filename */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filename</label>
              <input
                ref={fileNameInputRef}
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter filename..."
              />
            </div>

            {/* Content Preview/Edit */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content Preview</label>
              <div className="bg-black/30 border border-white/10 rounded-lg overflow-hidden">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-64 p-4 bg-transparent text-gray-100 font-mono text-sm resize-none focus:outline-none"
                  placeholder="File content will appear here..."
                  style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                You can edit this content or start with the template and modify it in the editor later.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-black/20">
          <div className="text-sm text-gray-400">
            <span>Creating: </span>
            <span className="text-white font-medium">{fileName || 'filename'}</span>
            <span className="text-gray-500"> • </span>
            <span className="text-blue-300">{languages[language]?.name || language}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-colors text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!fileName.trim()}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none text-white font-medium"
            >
              <FileCode size={16} />
              <span>Create File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewFileModal;