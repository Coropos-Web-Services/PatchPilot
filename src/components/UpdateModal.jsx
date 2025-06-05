import React, { useState } from 'react';
import { X, Download, ExternalLink, Star, Clock, AlertCircle } from 'lucide-react';
import { updateService } from '../services/updateService';
import { sanitizeHTML } from '../utils/sanitizeHTML.js';

const UpdateModal = ({ isOpen, onClose, updateInfo }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !updateInfo?.hasUpdate) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const downloadUrl = await updateService.getDownloadUrl(updateInfo.assets);
      if (downloadUrl) {
        await updateService.downloadUpdate(downloadUrl);
        onClose();
      } else {
        // Fallback to GitHub releases page
        await updateService.downloadUpdate(updateInfo.downloadUrl);
        onClose();
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDismiss = () => {
    updateService.markUpdateDismissed(updateInfo.latestVersion);
    onClose();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Star size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Update Available!</h2>
              <p className="text-sm text-gray-400">A new version of PatchPilot is ready</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Version Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Current Version</span>
              <span className="text-sm font-mono text-gray-300">{updateInfo.currentVersion}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Latest Version</span>
              <span className="text-sm font-mono text-green-400 font-bold">{updateInfo.latestVersion}</span>
            </div>
          </div>

          {/* Release Date */}
          {updateInfo.publishedAt && (
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Clock size={14} />
              <span>Released {formatDate(updateInfo.publishedAt)}</span>
            </div>
          )}

          {/* Release Notes */}
          <div>
            <h4 className="font-semibold text-white mb-2">What's New:</h4>
            <div className="bg-white/5 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div
                className="text-sm text-gray-300"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHTML(
                    updateService.formatReleaseNotes(updateInfo.releaseNotes)
                  )
                }}
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Star size={14} className="text-green-400" />
              <span className="text-sm font-medium text-green-300">Why Update?</span>
            </div>
            <ul className="text-xs text-green-200 space-y-1">
              <li>• Latest AI improvements and features</li>
              <li>• Bug fixes and performance enhancements</li>
              <li>• Enhanced security and stability</li>
              <li>• New code analysis capabilities</li>
            </ul>
          </div>

          {/* Download Size Info */}
          {updateInfo.assets?.length > 0 && (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <AlertCircle size={12} />
              <span>Download size: ~{Math.round((updateInfo.assets[0]?.size || 50000000) / 1048576)}MB</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 p-6 border-t border-white/10">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors text-gray-300 text-sm"
          >
            Skip This Version
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors text-gray-300 text-sm"
          >
            Later
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-800 disabled:to-purple-800 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg hover:shadow-xl disabled:shadow-none text-white font-medium text-sm"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Opening...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Update</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <ExternalLink size={12} />
            <span>Downloads from GitHub Releases</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateModal;