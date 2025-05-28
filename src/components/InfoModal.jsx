import React, { useState } from 'react';
import { X, Info, Shield, Book, Heart, Code2, ExternalLink, Mail, Github } from 'lucide-react';

const InfoModal = ({ isOpen, onClose }) => {
 const [activeTab, setActiveTab] = useState('about');

 const tabs = [
   { id: 'about', name: 'About', icon: Info },
   { id: 'licenses', name: 'Licenses', icon: Shield },
   { id: 'privacy', name: 'Privacy', icon: Book },
   { id: 'credits', name: 'Credits', icon: Heart }
 ];

 if (!isOpen) return null;

 const renderTabContent = () => {
   switch (activeTab) {
     case 'about':
       return (
         <div className="space-y-6">
           <div className="text-center">
             <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 mx-auto">
               <span className="text-2xl">🧠</span>
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">PatchPilot</h3>
             <p className="text-gray-400">AI-Powered Code Reviewer</p>
             <p className="text-sm text-gray-500 mt-2">Version 1.0.0</p>
           </div>

           <div className="bg-white/5 rounded-lg p-4">
             <h4 className="font-semibold text-white mb-3">What is PatchPilot?</h4>
             <p className="text-gray-300 text-sm leading-relaxed mb-4">
               PatchPilot is an AI-powered desktop application designed to help developers review, analyze, 
               and improve their code through an intuitive chat-based interface. Whether you're working with 
               local files or creating new ones, PatchPilot provides intelligent insights and suggestions.
             </p>
             
             <h4 className="font-semibold text-white mb-3">Key Features</h4>
             <ul className="text-gray-300 text-sm space-y-2">
               <li>• Chat-based code review and analysis</li>
               <li>• Support for 20+ programming languages</li>
               <li>• Built-in code editor with syntax highlighting</li>
               <li>• File creation and management</li>
               <li>• Drag & drop file support</li>
               <li>• Offline-capable operation</li>
               <li>• Real-time file tracking</li>
             </ul>
           </div>

           <div className="bg-white/5 rounded-lg p-4">
             <h4 className="font-semibold text-white mb-3">Perfect For</h4>
             <ul className="text-gray-300 text-sm space-y-1">
               <li>• Code reviews and quality assessments</li>
               <li>• Learning and educational purposes</li>
               <li>• Roblox/LuaU script development</li>
               <li>• Quick prototyping and experimentation</li>
               <li>• Best practice guidance</li>
             </ul>
           </div>
         </div>
       );

     case 'licenses':
       return (
         <div className="space-y-6">
           <div>
             <h3 className="text-xl font-bold text-white mb-4">Software Licenses</h3>
             
             <div className="space-y-4">
               <div className="bg-white/5 rounded-lg p-4">
                 <h4 className="font-semibold text-white mb-2">PatchPilot Application</h4>
                 <p className="text-gray-300 text-sm mb-2">
                   Copyright © 2025 PatchPilot. All rights reserved.
                 </p>
                 <p className="text-gray-400 text-xs">
                   This application is provided as-is for educational and development purposes. 
                   The software is distributed under a proprietary license.
                 </p>
               </div>

               <div className="bg-white/5 rounded-lg p-4">
                 <h4 className="font-semibold text-white mb-2">Open Source Dependencies</h4>
                 <div className="space-y-3 text-sm">
                   <div>
                     <p className="text-blue-300 font-medium">React</p>
                     <p className="text-gray-400 text-xs">MIT License - Facebook, Inc.</p>
                   </div>
                   <div>
                     <p className="text-blue-300 font-medium">Tauri</p>
                     <p className="text-gray-400 text-xs">MIT License - Tauri Contributors</p>
                   </div>
                   <div>
                     <p className="text-blue-300 font-medium">Tailwind CSS</p>
                     <p className="text-gray-400 text-xs">MIT License - Tailwind Labs, Inc.</p>
                   </div>
                   <div>
                     <p className="text-blue-300 font-medium">Lucide React</p>
                     <p className="text-gray-400 text-xs">ISC License - Lucide Contributors</p>
                   </div>
                   <div>
                     <p className="text-blue-300 font-medium">Vite</p>
                     <p className="text-gray-400 text-xs">MIT License - Evan You</p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       );

     case 'privacy':
       return (
         <div className="space-y-6">
           <div>
             <h3 className="text-xl font-bold text-white mb-4">Privacy & Data Policy</h3>
             
             <div className="space-y-4">
               <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                 <h4 className="font-semibold text-green-300 mb-2 flex items-center">
                   <Shield className="w-4 h-4 mr-2" />
                   Privacy First Design
                 </h4>
                 <p className="text-green-100 text-sm">
                   PatchPilot is designed with privacy as a core principle. Your code and data remain 
                   on your device and are never transmitted to external servers.
                 </p>
               </div>

               <div className="bg-white/5 rounded-lg p-4">
                 <h4 className="font-semibold text-white mb-3">Data Collection</h4>
                 <ul className="text-gray-300 text-sm space-y-2">
                   <li>• <strong>No personal data collection:</strong> We don't collect names, emails, or identifiers</li>
                   <li>• <strong>No code transmission:</strong> Your source code never leaves your device</li>
                   <li>• <strong>No usage analytics:</strong> We don't track how you use the application</li>
                   <li>• <strong>No crash reporting:</strong> No automatic error reporting to external services</li>
                 </ul>
               </div>
             </div>
           </div>
         </div>
       );

     case 'credits':
       return (
         <div className="space-y-6">
           <div>
             <h3 className="text-xl font-bold text-white mb-4">Credits & Acknowledgments</h3>
             
             <div className="space-y-4">
               <div className="bg-white/5 rounded-lg p-4">
                 <h4 className="font-semibold text-white mb-3">Development Team</h4>
                 <p className="text-gray-300 text-sm mb-3">
                   PatchPilot was developed as an innovative code review solution, combining 
                   modern desktop technologies with AI-powered analysis capabilities.
                 </p>
               </div>

               <div className="bg-white/5 rounded-lg p-4">
                 <h4 className="font-semibold text-white mb-3">Special Thanks</h4>
                 <ul className="text-gray-300 text-sm space-y-2">
                   <li>• The React team for the amazing UI framework</li>
                   <li>• Tauri contributors for the desktop application framework</li>
                   <li>• The Rust community for the powerful backend capabilities</li>
                   <li>• Tailwind CSS team for the beautiful styling system</li>
                   <li>• Lucide for the comprehensive icon library</li>
                   <li>• The open source community for making this possible</li>
                 </ul>
               </div>
             </div>
           </div>
         </div>
       );

     default:
       return null;
   }
 };

 return (
   <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
     <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
       <div className="flex items-center justify-between p-6 border-b border-white/10">
         <div className="flex items-center space-x-3">
           <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
             <Info size={18} className="text-white" />
           </div>
           <h2 className="text-xl font-bold text-white">About PatchPilot</h2>
         </div>
         <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
           <X size={20} />
         </button>
       </div>

       <div className="flex-1 flex overflow-hidden">
         <div className="w-48 bg-black/20 border-r border-white/10 p-4">
           <nav className="space-y-1">
             {tabs.map((tab) => {
               const TabIcon = tab.icon;
               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                     activeTab === tab.id
                       ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                       : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                   }`}
                 >
                   <TabIcon size={16} />
                   <span>{tab.name}</span>
                 </button>
               );
             })}
           </nav>
         </div>

         <div className="flex-1 overflow-y-auto p-6">
           {renderTabContent()}
         </div>
       </div>

       <div className="flex items-center justify-between p-6 border-t border-white/10 bg-black/20">
         <div className="text-sm text-gray-400">
           <p>© 2025 PatchPilot. Built with React & Tauri.</p>
         </div>
         <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-medium">
           Close
         </button>
       </div>
     </div>
   </div>
 );
};

export default InfoModal;
