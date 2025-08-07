/**
 * Settings Manager Island
 * Handles all settings-related interactivity using Astro's client-side hydration
 */

import { devLog, errorLog } from '../utils/debug.ts';

class SettingsManager {
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.initialized) return;
    
    try {
      devLog('🎯 Initializing SettingsManager');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
      
      this.initialized = true;
    } catch (error) {
      errorLog('Failed to initialize SettingsManager', error);
    }
  }

  private setup() {
    devLog('🎯 Setting up SettingsManager');
    
    // Apply saved settings immediately
    this.applyGlobalSettings();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load settings into toggles
    this.loadSettings();
  }

  private applyMarqueeSetting(enabled: boolean) {
    const marquees = document.querySelectorAll('[data-marquee]') as NodeListOf<HTMLElement>;
    marquees.forEach(marquee => {
      marquee.style.display = enabled ? '' : 'none';
    });
  }

  private applyColorfulTitlesSetting(enabled: boolean) {
    const colorfulElements = document.querySelectorAll('.apple-gradient-text, [data-colorful-title]') as NodeListOf<HTMLElement>;
    
    colorfulElements.forEach(element => {
      if (enabled) {
        element.classList.remove('colorful-disabled');
        // Remove inline style overrides
        ['background', 'background-image', 'background-size', '-webkit-background-clip', 
         'background-clip', '-webkit-text-fill-color', 'animation', 'color'].forEach(prop => {
          element.style.removeProperty(prop);
        });
      } else {
        element.classList.add('colorful-disabled');
        const isDark = document.documentElement.classList.contains('dark');
        
        const styles = {
          'background': 'none',
          'background-image': 'none',
          'background-size': 'initial',
          '-webkit-background-clip': 'initial',
          'background-clip': 'initial',
          '-webkit-text-fill-color': 'initial',
          'animation': 'none',
          'color': isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgb(31, 41, 55)'
        };
        
        Object.entries(styles).forEach(([prop, value]) => {
          element.style.setProperty(prop, value, 'important');
        });
      }
    });
  }

  private applyThemeSetting(isDark: boolean) {
    const html = document.documentElement;
    
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    // Dispatch theme change event
    document.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { isDark, source: 'settings_manager' }
    }));
    
    // Update colorful titles if disabled
    const colorfulTitlesEnabled = localStorage.getItem('colorful-titles-enabled') !== 'false';
    if (!colorfulTitlesEnabled) {
      this.applyColorfulTitlesSetting(false);
    }
  }

  private applyGlobalSettings() {
    const marqueeEnabled = localStorage.getItem('marquee-enabled') !== 'false';
    const colorfulTitlesEnabled = localStorage.getItem('colorful-titles-enabled') !== 'false';
    
    devLog('🎯 Applying global settings', { marqueeEnabled, colorfulTitlesEnabled });
    
    this.applyMarqueeSetting(marqueeEnabled);
    this.applyColorfulTitlesSetting(colorfulTitlesEnabled);
  }

  private setupEventListeners() {
    // Setup for both modal and mobile toggles
    const toggleConfigs = [
      { id: 'marqueeToggle', setting: 'marquee-enabled', apply: this.applyMarqueeSetting.bind(this) },
      { id: 'mobileMarqueeToggle', setting: 'marquee-enabled', apply: this.applyMarqueeSetting.bind(this) },
      { id: 'colorfulTitlesToggle', setting: 'colorful-titles-enabled', apply: this.applyColorfulTitlesSetting.bind(this) },
      { id: 'mobileColorfulTitlesToggle', setting: 'colorful-titles-enabled', apply: this.applyColorfulTitlesSetting.bind(this) },
      { id: 'themeToggle', setting: 'theme-dark', apply: this.applyThemeSetting.bind(this) },
      { id: 'mobileThemeToggle', setting: 'theme-dark', apply: this.applyThemeSetting.bind(this) }
    ];

    toggleConfigs.forEach(({ id, setting, apply }) => {
      const toggle = document.getElementById(id) as HTMLInputElement;
      if (toggle) {
        devLog(`🎯 Setting up ${id} event listener`);
        toggle.addEventListener('change', () => {
          const value = toggle.checked;
          devLog(`🎯 ${id} changed:`, value);
          
          apply(value);
          localStorage.setItem(setting, value.toString());
          
          // Sync between modal and mobile toggles
          this.syncToggles(setting, value);
          
          // Dispatch theme change for theme toggles
          if (setting === 'theme-dark') {
            document.dispatchEvent(new CustomEvent('themeChanged', {
              detail: { isDark: value, source: id }
            }));
          }
        });
      }
    });

    // Setup modal controls if they exist
    this.setupModalControls();

    // Listen for theme changes to update colorful titles
    this.setupThemeObserver();
  }

  private syncToggles(setting: string, value: boolean) {
    const toggleIds = {
      'marquee-enabled': ['marqueeToggle', 'mobileMarqueeToggle'],
      'colorful-titles-enabled': ['colorfulTitlesToggle', 'mobileColorfulTitlesToggle'],
      'theme-dark': ['themeToggle', 'mobileThemeToggle']
    };

    const ids = toggleIds[setting as keyof typeof toggleIds];
    if (ids) {
      ids.forEach(id => {
        const toggle = document.getElementById(id) as HTMLInputElement;
        if (toggle && toggle.checked !== value) {
          toggle.checked = value;
        }
      });
    }
  }

  private setupModalControls() {
    const modal = document.getElementById('settingsModal');
    const openButton = document.getElementById('settingsButton');
    const closeButton = document.getElementById('closeSettings');
    const saveButton = document.getElementById('saveSettings');
    const resetButton = document.getElementById('resetSettings');

    if (!modal || !openButton) return;

    devLog('🎯 Setting up modal controls');

    // Open modal
    openButton.addEventListener('click', () => {
      modal.classList.remove('opacity-0', 'invisible');
      const modalDialog = modal.querySelector('div') as HTMLElement;
      modalDialog?.classList.remove('scale-95');
      modalDialog?.classList.add('scale-100');
      document.body.style.overflow = 'hidden';
    });

    // Close modal function
    const closeModal = () => {
      modal.classList.add('opacity-0', 'invisible');
      const modalDialog = modal.querySelector('div') as HTMLElement;
      modalDialog?.classList.add('scale-95');
      modalDialog?.classList.remove('scale-100');
      document.body.style.overflow = '';
    };

    // Close events
    closeButton?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('invisible')) {
        closeModal();
      }
    });

    // Save and reset
    saveButton?.addEventListener('click', closeModal);
    resetButton?.addEventListener('click', () => this.resetSettings());
  }

  private loadSettings() {
    const marqueeEnabled = localStorage.getItem('marquee-enabled') !== 'false';
    const colorfulTitlesEnabled = localStorage.getItem('colorful-titles-enabled') !== 'false';
    const themeDark = localStorage.getItem('theme-dark') !== 'false';
    
    devLog('🎯 Loading settings into toggles', { themeDark, marqueeEnabled, colorfulTitlesEnabled });
    
    // Set toggle states
    const settings = {
      'marqueeToggle': marqueeEnabled,
      'mobileMarqueeToggle': marqueeEnabled,
      'colorfulTitlesToggle': colorfulTitlesEnabled,
      'mobileColorfulTitlesToggle': colorfulTitlesEnabled,
      'themeToggle': themeDark,
      'mobileThemeToggle': themeDark
    };

    Object.entries(settings).forEach(([id, value]) => {
      const toggle = document.getElementById(id) as HTMLInputElement;
      if (toggle) {
        toggle.checked = value;
      }
    });

    // Apply theme
    this.applyThemeSetting(themeDark);
  }

  private resetSettings() {
    devLog('🎯 Resetting settings to defaults');
    
    localStorage.setItem('marquee-enabled', 'true');
    localStorage.setItem('colorful-titles-enabled', 'true');
    localStorage.removeItem('theme-dark'); // Default to dark mode
    
    // Apply defaults
    this.applyMarqueeSetting(true);
    this.applyColorfulTitlesSetting(true);
    this.applyThemeSetting(true);
    
    // Update toggles
    this.loadSettings();
  }

  private setupThemeObserver() {
    const observer = new MutationObserver(() => {
      const colorfulTitlesEnabled = localStorage.getItem('colorful-titles-enabled') !== 'false';
      if (!colorfulTitlesEnabled) {
        this.applyColorfulTitlesSetting(false);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  new SettingsManager();
}
