import { invoke } from '@tauri-apps/api/core';

export class UpdateService {
  constructor() {
    this.currentVersion = '1.0.0'; // This should match your app version
    this.updateCheckInterval = null;
    this.lastCheckTime = null;
    this.releaseUrl = 'https://api.github.com/repos/coropos-web-services/patchpilot/releases/latest'; // Update with your repo
  }

  async checkForUpdates() {
    try {
      // Check if we've checked recently (don't spam the API)
      const now = Date.now();
      if (this.lastCheckTime && (now - this.lastCheckTime) < 1000 * 60 * 60) { // 1 hour
        return null;
      }
      
      this.lastCheckTime = now;

      const response = await fetch(this.releaseUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch release info');
      }

      const releaseData = await response.json();
      const latestVersion = releaseData.tag_name.replace('v', ''); // Remove 'v' prefix if present
      
      if (this.isNewerVersion(latestVersion, this.currentVersion)) {
        return {
          hasUpdate: true,
          currentVersion: this.currentVersion,
          latestVersion: latestVersion,
          releaseNotes: releaseData.body || 'Bug fixes and improvements',
          downloadUrl: releaseData.html_url,
          assets: releaseData.assets || [],
          publishedAt: releaseData.published_at
        };
      }

      return {
        hasUpdate: false,
        currentVersion: this.currentVersion,
        latestVersion: latestVersion
      };
    } catch (error) {
      console.error('Update check failed:', error);
      return {
        hasUpdate: false,
        error: error.message
      };
    }
  }

  isNewerVersion(latest, current) {
    // Simple version comparison (assumes semantic versioning)
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);

    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
  }

  async getDownloadUrl(assets, platform = null) {
    // Try to detect platform if not provided
    if (!platform) {
      try {
        platform = await invoke('get_platform');
      } catch (error) {
        // Fallback platform detection
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mac')) platform = 'darwin';
        else if (userAgent.includes('win')) platform = 'windows';
        else platform = 'linux';
      }
    }

    // Find the appropriate download for the platform
    const platformMap = {
      'darwin': ['.dmg', '.app', 'macos', 'darwin'],
      'windows': ['.exe', '.msi', 'windows', 'win'],
      'linux': ['.deb', '.rpm', '.appimage', 'linux']
    };

    const platformExtensions = platformMap[platform] || platformMap['darwin'];
    
    for (const asset of assets) {
      const name = asset.name.toLowerCase();
      if (platformExtensions.some(ext => name.includes(ext))) {
        return asset.browser_download_url;
      }
    }

    // Fallback to first asset if no platform-specific found
    return assets[0]?.browser_download_url || null;
  }

  startPeriodicCheck(intervalHours = 24) {
    // Check for updates periodically
    this.updateCheckInterval = setInterval(async () => {
      const updateInfo = await this.checkForUpdates();
      if (updateInfo?.hasUpdate) {
        // Dispatch custom event for update notification
        window.dispatchEvent(new CustomEvent('updateAvailable', {
          detail: updateInfo
        }));
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  stopPeriodicCheck() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  async downloadUpdate(downloadUrl) {
    try {
      // Open download URL in browser
      if (window.__TAURI__) {
        // In Tauri, open external URL
        const { open } = await import('@tauri-apps/plugin-shell');
        await open(downloadUrl);
      } else {
        // In browser, open in new tab
        window.open(downloadUrl, '_blank');
      }
      return true;
    } catch (error) {
      console.error('Failed to open download URL:', error);
      return false;
    }
  }

  markUpdateDismissed(version) {
    // Store dismissed version in localStorage
    localStorage.setItem('patchpilot_dismissed_update', version);
  }

  isUpdateDismissed(version) {
    const dismissedVersion = localStorage.getItem('patchpilot_dismissed_update');
    return dismissedVersion === version;
  }

  formatReleaseNotes(notes) {
    // Simple markdown-like formatting for release notes
    return notes
      .replace(/^### (.+)$/gm, '**$1**')
      .replace(/^- (.+)$/gm, '• $1')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }
}

// Export singleton instance
export const updateService = new UpdateService();