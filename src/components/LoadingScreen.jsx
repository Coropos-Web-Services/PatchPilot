import React, { useState, useEffect } from 'react';
import { Code2, Sparkles, FileCode, Zap, CheckCircle } from 'lucide-react';

const LoadingScreen = ({ onLoadingComplete }) => {
 const [currentStep, setCurrentStep] = useState(0);
 const [progress, setProgress] = useState(0);

 const loadingSteps = [
   { id: 0, text: 'Initializing PatchPilot...', icon: Code2, duration: 800 },
   { id: 1, text: 'Loading AI Components...', icon: Sparkles, duration: 1000 },
   { id: 2, text: 'Setting up File System...', icon: FileCode, duration: 600 },
   { id: 3, text: 'Preparing Chat Interface...', icon: Zap, duration: 700 },
   { id: 4, text: 'Ready to Review Code!', icon: CheckCircle, duration: 500 }
 ];

 useEffect(() => {
   let stepTimer;
   let progressTimer;

   const startStep = (stepIndex) => {
     if (stepIndex >= loadingSteps.length) {
       setTimeout(() => onLoadingComplete(), 300);
       return;
     }

     const step = loadingSteps[stepIndex];
     setCurrentStep(stepIndex);
     setProgress(0);

     // Animate progress bar for this step
     const progressIncrement = 100 / (step.duration / 50);
     progressTimer = setInterval(() => {
       setProgress(prev => {
         const newProgress = prev + progressIncrement;
         if (newProgress >= 100) {
           clearInterval(progressTimer);
           return 100;
         }
         return newProgress;
       });
     }, 50);

     // Move to next step after duration
     stepTimer = setTimeout(() => {
       clearInterval(progressTimer);
       startStep(stepIndex + 1);
     }, step.duration);
   };

   startStep(0);

   return () => {
     if (stepTimer) clearTimeout(stepTimer);
     if (progressTimer) clearInterval(progressTimer);
   };
 }, [onLoadingComplete]);

 const currentStepData = loadingSteps[currentStep];
 const CurrentIcon = currentStepData?.icon || Code2;

 return (
   <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center z-50">
     {/* Animated Background */}
     <div className="absolute inset-0 overflow-hidden">
       <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
       <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
     </div>

     {/* Main Loading Content */}
     <div className="relative z-10 text-center">
       {/* Logo Section */}
       <div className="mb-8">
         <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl mb-6 mx-auto animate-pulse">
           <span className="text-4xl">🧠</span>
         </div>
         <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
           PatchPilot
         </h1>
         <p className="text-gray-400 text-lg">AI-Powered Code Reviewer</p>
       </div>

       {/* Loading Step */}
       <div className="mb-8">
         <div className="flex items-center justify-center space-x-3 mb-4">
           <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
             <CurrentIcon size={18} className="text-white" />
           </div>
           <span className="text-white text-lg font-medium">
             {currentStepData?.text || 'Loading...'}
           </span>
         </div>

         {/* Progress Bar */}
         <div className="w-80 mx-auto">
           <div className="bg-gray-700/50 rounded-full h-2 overflow-hidden">
             <div 
               className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-100 ease-out"
               style={{ width: `${progress}%` }}
             ></div>
           </div>
           <div className="flex justify-between mt-2 text-xs text-gray-500">
             <span>Step {currentStep + 1} of {loadingSteps.length}</span>
             <span>{Math.round(progress)}%</span>
           </div>
         </div>
       </div>

       {/* Loading Steps Indicator */}
       <div className="flex justify-center space-x-2 mb-8">
         {loadingSteps.map((step, index) => {
           const StepIcon = step.icon;
           return (
             <div
               key={step.id}
               className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                 index < currentStep
                   ? 'bg-green-500/20 border-green-500/50 text-green-400'
                   : index === currentStep
                   ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 animate-pulse'
                   : 'bg-gray-700/30 border-gray-600/30 text-gray-500'
               } border`}
             >
               <StepIcon size={16} />
             </div>
           );
         })}
       </div>

       {/* Feature Highlights */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-gray-400">
         <div className="flex items-center space-x-2">
           <div className="w-2 h-2 bg-green-400 rounded-full"></div>
           <span>Offline Ready</span>
         </div>
         <div className="flex items-center space-x-2">
           <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
           <span>Chat-Based Interface</span>
         </div>
         <div className="flex items-center space-x-2">
           <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
           <span>Built-in Code Editor</span>
         </div>
       </div>

       {/* Version Info */}
       <div className="mt-8 text-xs text-gray-600">
         <p>PatchPilot v1.0.0</p>
         <p>Loading your coding companion...</p>
       </div>
     </div>
   </div>
 );
};

export default LoadingScreen;
