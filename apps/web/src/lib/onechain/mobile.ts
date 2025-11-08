// Mobile Optimization for OneChain

export interface MobileConfig {
  touchControls: boolean;
  virtualJoystick: boolean;
  hapticFeedback: boolean;
  autoSave: boolean;
  lowPowerMode: boolean;
  dataSaver: boolean;
}

export interface TouchControl {
  id: string;
  type: 'joystick' | 'button' | 'swipe';
  position: { x: number; y: number };
  size: number;
  action: string;
}

export class MobileOptimizationManager {
  private config: MobileConfig;
  private touchControls: TouchControl[];
  private isMobile: boolean;
  private isTablet: boolean;
  private orientation: 'portrait' | 'landscape';

  constructor() {
    this.config = {
      touchControls: true,
      virtualJoystick: true,
      hapticFeedback: true,
      autoSave: true,
      lowPowerMode: false,
      dataSaver: false,
    };

    this.touchControls = [];
    this.isMobile = this.detectMobile();
    this.isTablet = this.detectTablet();
    this.orientation = this.detectOrientation();

    if (this.isMobile) {
      this.initializeTouchControls();
      this.setupOrientationListener();
    }
  }

  // Detect if device is mobile
  private detectMobile(): boolean {
    if (typeof window === 'undefined') return false;

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Detect if device is tablet
  private detectTablet(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent.toLowerCase();
    return (
      /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
        userAgent
      )
    );
  }

  // Detect screen orientation
  private detectOrientation(): 'portrait' | 'landscape' {
    if (typeof window === 'undefined') return 'portrait';

    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  // Setup orientation change listener
  private setupOrientationListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('orientationchange', () => {
      this.orientation = this.detectOrientation();
      this.adjustLayoutForOrientation();
    });

    window.addEventListener('resize', () => {
      this.orientation = this.detectOrientation();
      this.adjustLayoutForOrientation();
    });
  }

  // Initialize touch controls
  private initializeTouchControls() {
    // Virtual joystick for movement
    this.touchControls.push({
      id: 'movement-joystick',
      type: 'joystick',
      position: { x: 15, y: 70 }, // Bottom-left, percentage
      size: 120,
      action: 'move',
    });

    // Attack button
    this.touchControls.push({
      id: 'attack-button',
      type: 'button',
      position: { x: 85, y: 70 }, // Bottom-right
      size: 80,
      action: 'attack',
    });

    // Special ability button
    this.touchControls.push({
      id: 'ability-button',
      type: 'button',
      position: { x: 85, y: 50 },
      size: 60,
      action: 'ability',
    });

    // Dodge/roll button
    this.touchControls.push({
      id: 'dodge-button',
      type: 'button',
      position: { x: 70, y: 70 },
      size: 60,
      action: 'dodge',
    });

    // Pause button
    this.touchControls.push({
      id: 'pause-button',
      type: 'button',
      position: { x: 95, y: 5 }, // Top-right
      size: 40,
      action: 'pause',
    });
  }

  // Adjust layout for orientation
  private adjustLayoutForOrientation() {
    if (this.orientation === 'landscape') {
      // Landscape: Move controls to edges
      this.touchControls.forEach((control) => {
        if (control.id === 'movement-joystick') {
          control.position = { x: 10, y: 70 };
        } else if (control.id === 'attack-button') {
          control.position = { x: 90, y: 70 };
        }
      });
    } else {
      // Portrait: Adjust for narrower screen
      this.touchControls.forEach((control) => {
        if (control.id === 'movement-joystick') {
          control.position = { x: 15, y: 75 };
        } else if (control.id === 'attack-button') {
          control.position = { x: 85, y: 75 };
        }
      });
    }
  }

  // Trigger haptic feedback
  triggerHaptic(intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    if (!this.config.hapticFeedback) return;
    if (typeof window === 'undefined') return;

    // @ts-ignore - Vibration API
    if (navigator.vibrate) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 50,
      };

      // @ts-ignore
      navigator.vibrate(patterns[intensity]);
    }
  }

  // Optimize graphics for mobile
  getGraphicsSettings(): {
    resolution: number;
    particleCount: number;
    shadowQuality: 'off' | 'low' | 'medium' | 'high';
    antiAliasing: boolean;
    postProcessing: boolean;
  } {
    if (this.config.lowPowerMode) {
      return {
        resolution: 0.5,
        particleCount: 10,
        shadowQuality: 'off',
        antiAliasing: false,
        postProcessing: false,
      };
    }

    if (this.isMobile && !this.isTablet) {
      return {
        resolution: 0.75,
        particleCount: 50,
        shadowQuality: 'low',
        antiAliasing: false,
        postProcessing: false,
      };
    }

    if (this.isTablet) {
      return {
        resolution: 1.0,
        particleCount: 100,
        shadowQuality: 'medium',
        antiAliasing: true,
        postProcessing: false,
      };
    }

    // Desktop
    return {
      resolution: 1.0,
      particleCount: 200,
      shadowQuality: 'high',
      antiAliasing: true,
      postProcessing: true,
    };
  }

  // Get network settings for data saver
  getNetworkSettings(): {
    imageQuality: 'low' | 'medium' | 'high';
    preloadAssets: boolean;
    cacheEnabled: boolean;
    compressionEnabled: boolean;
  } {
    if (this.config.dataSaver) {
      return {
        imageQuality: 'low',
        preloadAssets: false,
        cacheEnabled: true,
        compressionEnabled: true,
      };
    }

    return {
      imageQuality: 'high',
      preloadAssets: true,
      cacheEnabled: true,
      compressionEnabled: false,
    };
  }

  // Get touch controls
  getTouchControls(): TouchControl[] {
    return this.touchControls;
  }

  // Update config
  updateConfig(updates: Partial<MobileConfig>) {
    this.config = { ...this.config, ...updates };
  }

  // Get config
  getConfig(): MobileConfig {
    return { ...this.config };
  }

  // Check if mobile
  isMobileDevice(): boolean {
    return this.isMobile;
  }

  // Check if tablet
  isTabletDevice(): boolean {
    return this.isTablet;
  }

  // Get orientation
  getOrientation(): 'portrait' | 'landscape' {
    return this.orientation;
  }

  // Get recommended frame rate
  getRecommendedFPS(): number {
    if (this.config.lowPowerMode) return 30;
    if (this.isMobile && !this.isTablet) return 30;
    if (this.isTablet) return 60;
    return 60;
  }

  // Check if device supports WebGL
  supportsWebGL(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  // Get device performance tier
  getPerformanceTier(): 'low' | 'medium' | 'high' {
    if (typeof window === 'undefined') return 'medium';

    // @ts-ignore - Navigator hardware concurrency
    const cores = navigator.hardwareConcurrency || 2;
    // @ts-ignore - Navigator device memory
    const memory = navigator.deviceMemory || 4;

    if (cores >= 8 && memory >= 8) return 'high';
    if (cores >= 4 && memory >= 4) return 'medium';
    return 'low';
  }

  // Optimize for performance tier
  getOptimizedSettings(): {
    graphics: any;
    network: any;
    fps: number;
    autoSave: boolean;
  } {
    const tier = this.getPerformanceTier();

    if (tier === 'low') {
      this.config.lowPowerMode = true;
      this.config.dataSaver = true;
    }

    return {
      graphics: this.getGraphicsSettings(),
      network: this.getNetworkSettings(),
      fps: this.getRecommendedFPS(),
      autoSave: this.config.autoSave,
    };
  }

  // Save game state (mobile-optimized)
  async saveGameState(state: any): Promise<boolean> {
    if (!this.config.autoSave) return false;

    try {
      // Use IndexedDB for mobile (better than localStorage)
      if ('indexedDB' in window) {
        return await this.saveToIndexedDB(state);
      }

      // Fallback to localStorage
      localStorage.setItem('shadow_stake_saga_save', JSON.stringify(state));
      return true;
    } catch (error) {
      console.error('Failed to save game state:', error);
      return false;
    }
  }

  // Save to IndexedDB
  private async saveToIndexedDB(state: any): Promise<boolean> {
    return new Promise((resolve) => {
      const request = indexedDB.open('ShadowStakeSaga', 1);

      request.onerror = () => resolve(false);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['gameState'], 'readwrite');
        const store = transaction.objectStore('gameState');
        store.put({ id: 'current', data: state });

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => resolve(false);
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('gameState')) {
          db.createObjectStore('gameState', { keyPath: 'id' });
        }
      };
    });
  }

  // Load game state
  async loadGameState(): Promise<any | null> {
    try {
      if ('indexedDB' in window) {
        return await this.loadFromIndexedDB();
      }

      const saved = localStorage.getItem('shadow_stake_saga_save');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return null;
    }
  }

  // Load from IndexedDB
  private async loadFromIndexedDB(): Promise<any | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('ShadowStakeSaga', 1);

      request.onerror = () => resolve(null);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['gameState'], 'readonly');
        const store = transaction.objectStore('gameState');
        const getRequest = store.get('current');

        getRequest.onsuccess = () => {
          resolve(getRequest.result?.data || null);
        };

        getRequest.onerror = () => resolve(null);
      };
    });
  }
}

export const mobileOptimization = new MobileOptimizationManager();
