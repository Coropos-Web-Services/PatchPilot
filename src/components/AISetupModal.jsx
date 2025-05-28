import React, { useState, useEffect } from 'react';
import { X, Download, CheckCircle, AlertCircle, ExternalLink, Terminal, Zap } from 'lucide-react';
import { aiService } from '../services/aiService';

const AISetupModal = ({ isOpen, onClose, onSetupComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState('');
  const [selectedModel, setSelectedModel] = useState('codellama:7b-instruct');

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    const status = await aiService.checkOllamaStatus();
    setOllamaStatus(status);
    
    if (status.available && status.models.length > 0) {
      setCurrentStep(3); // Already set up
    } else if (status.available) {
      setCurrentStep(2); // Ollama installed, need model
    } else {
      setCurrentStep(1); // Need to install Ollama
    }
  };

  const handleInstallModel = async () => {
    setIsInstalling(true);
    setInstallProgress('Starting model download...');
    
    try {
      const result = await aiService.installModel(selectedModel);
      if (result.success) {
        setInstallProgress('Model installed successfully!');
        setCurrentStep(3);
        if (onSetupComplete) {
          onSetupComplete();
        }
      } else {
        setInstallProgress(`Error: ${result.error}`);
      }
    } catch (error) {
      setInstallProgress(`Installation failed: ${error.message}`);
    }
    
    setIsInstalling(false);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Ollama Not Found</h3>
        <p className="text-gray-400">
          PatchPilot needs Ollama to provide AI-powered code analysis.
        </p>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="font-semibold text-blue-300 mb-3">What is Ollama?</h4>
        <p className="text-blue-100 text-sm mb-3">
          Ollama runs large language models locally on your machine. This means:
        </p>
        <ul className="text-blue-100 text-sm space-y-1">
          <li>• 🔒 Your code never leaves your computer</li>
          <li>• ⚡ Fast analysis without internet</li>
          <li>• 🆓 Free to use with no API costs</li>
          <li>• 🧠 Powered by CodeLlama for code understanding</li>
        </ul>
      </div>

      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-3">Installation Instructions</h4>
        
        <div className="space-y-4">
          <div>
            <h5 className="text-green-300 font-medium mb-2">macOS:</h5>
            <code className="bg-black/30 px-3 py-2 rounded block text-sm text-gray-300">
              brew install ollama
            </code>
          </div>
          
          <div>
            <h5 className="text-green-300 font-medium mb-2">Windows/Linux:</h5>
            <p className="text-gray-300 text-sm mb-2">
              Download from the official website:
            </p>
            <a 
              href="https://ollama.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <ExternalLink size={16} />
              <span>ollama.ai</span>
            </a>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={checkStatus}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-gray-300"
        >
          Check Again
        </button>
        
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Download size={32} className="text-yellow-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Install AI Model</h3>
        <p className="text-gray-400">
          Ollama is installed! Now let's download a code analysis model.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-white">Choose a Model:</h4>
        
        {aiService.getRecommendedModels().map((model) => (
          <div
            key={model.name}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedModel === model.name
                ? 'bg-blue-500/20 border-blue-500/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            onClick={() => setSelectedModel(model.name)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium text-white">{model.name}</h5>
                  {model.recommended && (
                    <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-300">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">{model.description}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedModel === model.name 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'border-gray-400'
              }`} />
            </div>
          </div>
        ))}
      </div>

      {isInstalling && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-blue-300 font-medium">Installing Model...</span>
          </div>
          <p className="text-blue-100 text-sm">{installProgress}</p>
        </div>
      )}

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-orange-300 font-medium mb-1">Download Size Notice</h5>
            <p className="text-orange-100 text-sm">
              Models are large files that will be downloaded to your computer. 
              Ensure you have a stable internet connection and sufficient disk space.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-gray-300"
        >
          Back
        </button>
        
        <button
          onClick={handleInstallModel}
          disabled={isInstalling}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <Download size={16} />
          <span>{isInstalling ? 'Installing...' : 'Install Model'}</span>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">AI Ready!</h3>
        <p className="text-gray-400">
          PatchPilot is now powered by AI and ready for intelligent code analysis.
        </p>
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <h4 className="font-semibold text-green-300 mb-3 flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          What's Now Available
        </h4>
        <ul className="text-green-100 text-sm space-y-2">
          <li>• 🔍 <strong>Smart Bug Detection:</strong> Find issues beyond basic syntax</li>
          <li>• 💡 <strong>Intelligent Suggestions:</strong> Get specific improvement recommendations</li>
          <li>• 📝 <strong>Code Explanations:</strong> Understand what your code does</li>
          <li>• 🔧 <strong>Automatic Fixes:</strong> Get corrected versions of problematic code</li>
          <li>• 🎯 <strong>Best Practices:</strong> Learn language-specific conventions</li>
          <li>• 🚀 <strong>Performance Tips:</strong> Optimize for speed and efficiency</li>
        </ul>
      </div>

      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-3">Current Setup:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Ollama Status:</span>
            <span className="text-green-400">✓ Running</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Models Available:</span>
            <span className="text-blue-400">{ollamaStatus?.models?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">AI Analysis:</span>
            <span className="text-green-400">✓ Enabled</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="font-semibold text-blue-300 mb-2">Quick Start Tips:</h4>
        <ul className="text-blue-100 text-sm space-y-1">
          <li>• Drag & drop any code file to start analysis</li>
          <li>• Ask questions like "What's wrong with this code?"</li>
          <li>• Request specific help: "Optimize this function"</li>
          <li>• Use the file picker to analyze Desktop files</li>
        </ul>
      </div>

      <div className="flex items-center justify-center">
        <button
          onClick={() => {
            if (onSetupComplete) onSetupComplete();
            onClose();
          }}
          className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg transition-all shadow-lg hover:shadow-xl"
        >
          <CheckCircle size={20} />
          <span className="font-medium">Start Using AI Analysis</span>
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Setup</h2>
              <p className="text-sm text-gray-400">Enable intelligent code analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {currentStep > step ? '✓' : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Install Ollama</span>
            <span>Download Model</span>
            <span>Ready!</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default AISetupModal;