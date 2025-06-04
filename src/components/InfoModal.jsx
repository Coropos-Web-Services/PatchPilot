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
               <li>• Conversational AI code review and analysis</li>
               <li>• Support for 20+ programming languages</li>
               <li>• Built-in code editor with syntax highlighting</li>
               <li>• Interactive code improvement workflow</li>
               <li>• File creation and management</li>
               <li>• Drag & drop file support</li>
               <li>• Offline-capable operation with Ollama</li>
               <li>• Real-time file tracking and context awareness</li>
             </ul>
           </div>

           <div className="bg-white/5 rounded-lg p-4">
             <h4 className="font-semibold text-white mb-3">Perfect For</h4>
             <ul className="text-gray-300 text-sm space-y-1">
               <li>• Code reviews and quality assessments</li>
               <li>• Learning and educational purposes</li>
              <li>• Roblox/Luau script development</li>
               <li>• Quick prototyping and experimentation</li>
               <li>• Best practice guidance and mentorship</li>
               <li>• Bug fixing and performance optimization</li>
             </ul>
           </div>

           <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
             <h4 className="font-semibold text-blue-300 mb-3">Created By</h4>
             <div className="space-y-2 text-blue-100 text-sm">
               <div>
                 <p className="font-medium">Coropos Web Services</p>
                 <p className="text-blue-200 text-xs">Leading web development and AI solutions</p>
               </div>
               <div>
                 <p className="font-medium">Edward Quigley</p>
                 <p className="text-blue-200 text-xs">Lead Developer & AI Integration Specialist</p>
               </div>
             </div>
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
  <div className="bg-black/30 rounded p-3 text-xs font-mono text-gray-300">
    <p className="mb-2">PatchPilot License v1.0</p>
    <p className="mb-2">Copyright (c) 2025 Coropos Web Services</p>
    <p className="mb-2">
      PatchPilot is provided as a <strong>free</strong>, <strong>personal-use-only</strong> tool. You may <strong>use</strong> and <strong>modify</strong> this software for your own purposes, but you <strong>may not</strong> sell it, redistribute it, or share modified or unmodified copies without written permission from the original author.
    </p>
    <p className="mb-2">
      <strong>Permissions</strong><br />
      ✅ Use PatchPilot on your personal devices<br />
      ✅ Modify the source code for private, non-commercial use only<br />
      ✅ Receive updates from the official developer
    </p>
    <p className="mb-2">
      <strong>Restrictions</strong><br />
      ❌ Use PatchPilot or its code for commercial purposes<br />
      ❌ Sell, rent, sublicense, or monetize PatchPilot in any way<br />
      ❌ Distribute or share modified or unmodified copies<br />
      ❌ Host or package PatchPilot for others without permission
    </p>
    <p className="mb-2">
      PatchPilot and all associated content remain the exclusive intellectual property of EJ Quigley and Coropos Web Services. Modifying or using this project does not grant you any ownership rights.
    </p>
    <p className="mb-2">
      The terms of this license may change in the future. Continued use of PatchPilot after any changes implies acceptance of the new terms.
    </p>
    <p className="mb-2">
      All updates to PatchPilot must be obtained through the official distribution channels or repositories provided by Coropos Web Services. Modified versions must not be distributed under any circumstance.
    </p>
    <p className="text-xs text-gray-400">
      To request permissions or commercial licensing, contact the original author: equigley@coroposws.com
    </p>
  </div>

  <div className="mt-3 flex items-center space-x-2">
    <ExternalLink size={14} className="text-blue-400" />
    <button 
      onClick={() => open("https://github.com/coropos-web-services/patchpilot/blob/main/LICENSE.md")} 
      className="text-blue-400 hover:text-blue-300 text-sm"
    >
      View Full License on GitHub
    </button>
  </div>
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
                     <p className="text-gray-400 text-xs">Apache License 2.0 & MIT License - Tauri Contributors</p>
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
                   <div>
                     <p className="text-blue-300 font-medium">Ollama</p>
                     <p className="text-gray-400 text-xs">MIT License - Ollama Contributors</p>
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

               <div className="bg-white/5 rounded-lg p-4">
                 <h4 className="font-semibold text-white mb-3">Local AI Processing</h4>
                 <ul className="text-gray-300 text-sm space-y-2">
                   <li>• <strong>Ollama Integration:</strong> AI models run entirely on your machine</li>
                   <li>• <strong>No Cloud Dependencies:</strong> No data sent to OpenAI, Google, or other services</li>
                   <li>• <strong>Offline Operation:</strong> Works completely without internet after setup</li>
                   <li>• <strong>Your Data, Your Control:</strong> All analysis happens locally</li>
                 </ul>
               </div>

               <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                 <h4 className="font-semibold text-blue-300 mb-3">Update Checks</h4>
                 <p className="text-blue-100 text-sm">
                   PatchPilot periodically checks GitHub for updates to provide you with the latest features 
                   and security improvements. Only version information is transmitted during these checks.
                 </p>
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
                 <div className="space-y-3">
                   <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                       <span className="text-white font-bold text-sm">CWS</span>
                     </div>
                     <div>
                       <p className="text-white font-medium">Coropos Web Services</p>
                       <p className="text-gray-400 text-sm">Development Studio & AI Innovation</p>
                     </div>
                   </div>
                   <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                       <span className="text-white font-bold text-sm">EQ</span>
                     </div>
                     <div>
                       <p className="text-white font-medium">Edward Quigley</p>
                       <p className="text-gray-400 text-sm">Lead Developer, AI Integration & UI/UX Design</p>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                 <h4 className="font-semibold text-blue-300 mb-3">Project Vision</h4>
                 <p className="text-blue-100 text-sm leading-relaxed">
                   PatchPilot was created to democratize AI-powered code review and make advanced 
                   development tools accessible to everyone. Our mission is to help developers 
                   learn, improve, and create better software through intelligent assistance.
                 </p>
               </div>

               <div className="bg-white/5 rounded-lg p-4">
                 <h4 className="font-semibold text-white mb-3">Special Thanks</h4>
                 <ul className="text-gray-300 text-sm space-y-2">
                   <li>• The <strong>Ollama team</strong> for making local AI accessible</li>
                   <li>• <strong>Meta AI</strong> and the CodeLlama contributors</li>
                   <li>• The <strong>React</strong> team for the amazing UI framework</li>
                   <li>• <strong>Tauri contributors</strong> for the desktop application framework</li>
                   <li>• The <strong>Rust community</strong> for powerful backend capabilities</li>
                   <li>• <strong>Tailwind CSS</strong> team for the beautiful styling system</li>
                   <li>• <strong>Lucide</strong> for the comprehensive icon library</li>
                   <li>• The <strong>open source community</strong> for making this possible</li>
                 </ul>
               </div>

               <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                 <h4 className="font-semibold text-green-300 mb-3">Community & Support</h4>
                 <div className="space-y-2 text-green-100 text-sm">
                   <div className="flex items-center space-x-2">
                     <Github size={14} />
                     <a 
                       href="https://github.com/coropos-web-services/patchpilot" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-green-300 hover:text-green-200"
                     >
                       GitHub Repository
                     </a>
                   </div>
                   <div className="flex items-center space-x-2">
                     <ExternalLink size={14} />
                     <a 
                       href="https://coropos.com" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-green-300 hover:text-green-200"
                     >
                       Coropos Web Services
                     </a>
                   </div>
                   <div className="flex items-center space-x-2">
                     <Mail size={14} />
                     <span className="text-green-200">info@coropos.com</span>
                   </div>
                 </div>
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
           <p>© 2025 Coropos Web Services & Edward Quigley.</p>
           <p className="text-xs">Built with React, Tauri & PatchPilot AI ❤️</p>
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