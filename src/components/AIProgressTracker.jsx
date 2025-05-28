// src/components/AIProgressTracker.jsx
import React, { useState, useEffect } from 'react';
import { Brain, FileText, Search, Lightbulb, Wrench, CheckCircle, Zap } from 'lucide-react';

const AIProgressTracker = ({ isVisible, currentStep, progress, fileName, onComplete }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        if (prev < progress) {
          return Math.min(prev + 2, progress);
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [progress]);

  const progressSteps = [
    {
      id: 'reading',
      title: 'Reading File',
      description: `Analyzing ${fileName}...`,
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      id: 'parsing',
      title: 'Parsing Code',
      description: 'Understanding structure and syntax...',
      icon: Search,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      id: 'analyzing',
      title: 'AI Analysis',
      description: 'Identifying patterns and potential issues...',
      icon: Brain,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20'
    },
    {
      id: 'generating',
      title: 'Generating Suggestions',
      description: 'Creating improvement recommendations...',
      icon: Lightbulb,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    {
      id: 'optimizing',
      title: 'Optimizing Results',
      description: 'Fine-tuning analysis and solutions...',
      icon: Wrench,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20'
    },
    {
      id: 'complete',
      title: 'Analysis Complete',
      description: 'Ready to review results!',
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    }
  ];

  const getCurrentStepData = () => {
    return progressSteps.find(step => step.id === currentStep) || progressSteps[0];
  };

  const getStepIndex = (stepId) => {
    return progressSteps.findIndex(step => step.id === stepId);
  };

  if (!isVisible) return null;

  const stepData = getCurrentStepData();
  const StepIcon = stepData.icon;
  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mr-12">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className={`w-8 h-8 ${stepData.bgColor} rounded-lg flex items-center justify-center`}>
          <StepIcon size={18} className={stepData.color} />
        </div>
        <div>
          <h3 className="font-semibold text-white">{stepData.title}</h3>
          <p className="text-sm text-gray-400">{stepData.description}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(animatedProgress)}%</span>
        </div>
        <div className="bg-gray-700/50 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {progressSteps.slice(0, -1).map((step, index) => {
          const StepIconComponent = step.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-500/20 text-green-400' 
                  : isActive 
                    ? `${step.bgColor} ${step.color} animate-pulse`
                    : 'bg-gray-700/30 text-gray-500'
              }`}>
                {isCompleted ? (
                  <CheckCircle size={16} />
                ) : (
                  <StepIconComponent size={16} />
                )}
              </div>
              {index < progressSteps.length - 2 && (
                <div className={`w-6 h-0.5 mx-1 transition-all duration-300 ${
                  isCompleted ? 'bg-green-400' : 'bg-gray-700'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Real-time Activity Indicator */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-gray-300">
            {currentStep === 'reading' && 'Scanning file contents...'}
            {currentStep === 'parsing' && 'Building syntax tree...'}
            {currentStep === 'analyzing' && 'AI processing in progress...'}
            {currentStep === 'generating' && 'Crafting recommendations...'}
            {currentStep === 'optimizing' && 'Finalizing analysis...'}
          </span>
        </div>
      </div>

      {/* Enhanced Activity Messages */}
      <div className="mt-3 text-xs text-gray-400 space-y-1">
        {currentStep === 'reading' && (
          <div>• Reading {Math.round((progress / 100) * 1000)} lines of code...</div>
        )}
        {currentStep === 'parsing' && (
          <div>• Identifying functions, classes, and variables...</div>
        )}
        {currentStep === 'analyzing' && (
          <div>• Running AI models on code patterns...</div>
        )}
        {currentStep === 'generating' && (
          <div>• Creating personalized improvement suggestions...</div>
        )}
        {currentStep === 'optimizing' && (
          <div>• Preparing detailed explanations...</div>
        )}
      </div>
    </div>
  );
};

export default AIProgressTracker;