# 🧠 PatchPilot AI

**PatchPilot** is an advanced, AI-powered code analysis and development companion built with Tauri, React, and Python. It combines the power of local AI processing with modern web technologies to provide intelligent code assistance, analysis, and real-time collaboration.

## ✨ Features

### 🤖 AI-Powered Analysis
- **Context-Aware AI**: Analyzes your entire project with full understanding of file relationships
- **Multi-Language Support**: Python, JavaScript, TypeScript, Java, C/C++, Rust, Go, PHP, Ruby, Lua, HTML, CSS, JSON
- **Ollama Integration**: Uses local CodeLlama models for privacy-first AI processing
- **Smart Project Structure**: Automatically understands directory hierarchies and dependencies

### 💬 Interactive Chat Interface  
- **Natural Language Queries**: Ask questions about your code in plain English
- **File-Aware Conversations**: Upload files or directories for contextual discussions
- **Persistent Chat History**: Multiple chat sessions with automatic saving
- **Real-Time Progress**: Live feedback during analysis and processing

### 🛠️ Advanced Code Tools
- **Static Analysis**: Integrated linting with Pylint, ESLint, and more
- **Code Execution**: Safe sandboxed code execution for testing
- **Diff Generation**: Visual comparisons between original and improved code
- **Batch Processing**: Analyze multiple files and entire directories

### 🖥️ Desktop Experience
- **Native Desktop App**: Built with Tauri for optimal performance
- **Modern UI**: Beautiful React interface with Tailwind CSS
- **File Management**: Drag-and-drop support with integrated file tracker
- **Code Editor**: Built-in syntax-highlighted editor for viewing and editing

### 🌐 Connectivity Options
- **Offline-First**: Works completely offline with local AI models
- **Optional Internet**: Enable web research for latest framework information
- **Auto-Updates**: Automatic update detection with GitHub integration
- **Privacy-Focused**: No telemetry, all processing happens locally

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** (for Tauri)
- **Python** 3.8+ with pip
- **Ollama** with CodeLlama model

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Coropos-Web-Services/PatchPilot.git
   cd PatchPilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   pip install -r requirements.txt
   ```

3. **Setup AI models**
   ```bash
   # Install Ollama (macOS)
   brew install ollama
   
   # Pull CodeLlama model
   ollama pull codellama:7b-instruct
   
   # Or use the setup script
   chmod +x setup_ai.sh
   ./setup_ai.sh
   ```

4. **Start development**
   ```bash
   # Development mode
   npm run tauri:dev
   
   # Build for production
   npm run tauri:build
   ```

### Quick Start

1. **Launch PatchPilot** and create a new chat
2. **Upload files** by dragging them into the interface
3. **Ask questions** like:
   - "What does this code do?"
   - "How can I improve this function?"
   - "Find bugs in my project"
   - "Explain this algorithm"

## 🏗️ Architecture

### Frontend (React + Tauri)
- **React 19** with modern hooks and context
- **Tailwind CSS** for responsive styling
- **Lucide React** for consistent iconography
- **Tauri APIs** for native file system access

### Backend (Python)
- **Enhanced Code Processor** with multi-language support
- **Progress Tracking** for real-time user feedback
- **Static Analysis** integration (Pylint, ESLint, etc.)
- **Ollama Integration** for local AI processing

### Core Services
- **Context-Aware AI Service**: Manages AI interactions and project context
- **Update Service**: Handles version checking and automatic updates
- **Storage Utils**: Persistent chat and file management
- **Chatbot Service**: Orchestrates AI responses and tool integration

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Test specific components
npm test -- pathHandling.test.js
```

## 📁 Project Structure

```
PatchPilot/
├── src/                          # React frontend
│   ├── components/              # UI components
│   ├── services/               # Frontend services
│   └── utils/                  # Utility functions
├── src-tauri/                   # Tauri backend
│   ├── src/                    # Rust code
│   └── capabilities/           # Tauri permissions
├── backend/                     # Python AI services
│   ├── chatbot.py             # Ollama integration
│   └── processor.py           # Code analysis engine
├── tests/                      # Test suites
└── public/                     # Static assets
```

## 🎯 Use Cases

### For Individual Developers
- **Code Review**: Get instant feedback on your code quality
- **Learning**: Understand complex algorithms and patterns
- **Debugging**: Find and fix bugs with AI assistance
- **Refactoring**: Improve code structure and performance

### For Teams
- **Knowledge Sharing**: Document and explain complex systems
- **Code Standards**: Ensure consistent coding practices
- **Onboarding**: Help new team members understand codebases
- **Technical Debt**: Identify and prioritize improvements

### For Students
- **Learning Programming**: Get explanations in simple terms
- **Assignment Help**: Understand requirements and approaches
- **Best Practices**: Learn industry-standard coding patterns
- **Debugging Skills**: Develop systematic problem-solving

## 🔧 Configuration

### AI Models
Set your preferred Ollama model:
```bash
export OLLAMA_MODEL="codellama:13b-instruct"
```

### Development
```bash
# Environment variables
VITE_DEV_MODE=true
TAURI_DEBUG=true
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the terms specified in [LICENSE.md](LICENSE.md).

## 🛡️ Security

For security concerns, please see our [Security Policy](SECURITY.md) and report issues responsibly.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Coropos-Web-Services/PatchPilot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Coropos-Web-Services/PatchPilot/discussions)
- **Email**: [equigley@coroposws.com](mailto:equigley@coroposws.com)

## 🎉 Acknowledgments

- [Ollama](https://ollama.com) for local AI infrastructure
- [Tauri](https://tauri.app) for the cross-platform desktop framework
- [React](https://react.dev) for the user interface
- [Tailwind CSS](https://tailwindcss.com) for styling

---

**Built with ❤️ by developers, for developers.**