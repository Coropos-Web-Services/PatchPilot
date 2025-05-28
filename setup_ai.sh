#!/bin/bash

# PatchPilot AI Setup Script
# This script sets up Ollama and downloads the required models

echo "🧠 PatchPilot AI Setup"
echo "======================"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found. Installing..."
    
    # Detect OS and install Ollama
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "📦 Installing Ollama via Homebrew..."
            brew install ollama
        else
            echo "📦 Installing Ollama manually..."
            curl -fsSL https://ollama.ai/install.sh | sh
        fi
    else
        # Linux/Windows WSL
        echo "📦 Installing Ollama..."
        curl -fsSL https://ollama.ai/install.sh | sh
    fi
else
    echo "✅ Ollama is already installed"
fi

# Start Ollama service (if not running)
echo "🔄 Starting Ollama service..."
ollama serve &> /dev/null &
sleep 3

# Download CodeLlama model
echo "🤖 Downloading CodeLlama model (this may take several minutes)..."
echo "   Model size: ~3.8GB"
echo "   This is a one-time download and will be cached locally"

if ollama pull codellama:7b-instruct; then
    echo "✅ CodeLlama model downloaded successfully!"
else
    echo "❌ Failed to download CodeLlama model"
    echo "   Please check your internet connection and try again"
    exit 1
fi

# Install Python linting tools
echo "🐍 Installing Python linting tools..."
if command -v pip3 &> /dev/null; then
    pip3 install pylint flake8 --user
elif command -v pip &> /dev/null; then
    pip install pylint flake8 --user
else
    echo "⚠️  Python pip not found. Skipping linting tools installation."
fi

# Install Node.js linting tools (if npm is available)
if command -v npm &> /dev/null; then
    echo "📦 Installing JavaScript/TypeScript linting tools..."
    npm install -g eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
else
    echo "⚠️  npm not found. Skipping JavaScript linting tools."
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo "✅ Ollama installed and running"
echo "✅ CodeLlama model ready"
echo "✅ Linting tools installed"
echo ""
echo "PatchPilot is now ready for AI-powered code analysis!"
echo "Restart the application to enable AI features."
echo ""
echo "💡 Tips:"
echo "   • Upload any code file for intelligent analysis"
echo "   • Ask specific questions about your code"
echo "   • Request optimizations and improvements"
echo "   • Get explanations for complex logic"