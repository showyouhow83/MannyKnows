/**
 * Optimized Animation Manager
 * 
 * High-performance, consolidated animation system replacing multiple conflicting managers.
 * Designed for optimal Core Web Vitals and smooth 60fps performance.
 */

export interface OptimizedAnimationConfig {
  /** Enable/disable animations globally */
  enabled: boolean;
  /** Respect user's reduced motion preference */
  respectReducedMotion: boolean;
  /** Debug mode (stripped in production) */
  debugMode: boolean;
  /** Performance monitoring */
  performanceMonitoring: boolean;
}

export interface AnimationElement {
  element: HTMLElement;
  animation: AnimationType;
  options: AnimationOptions;
  state: 'idle' | 'animating' | 'completed';
  lastUpdate: number;
}

export interface AnimationOptions {
  delay: number;
  duration: number;
  threshold: number;
  once: boolean;
  easing: string;
}

export type AnimationType = 
  | 'fadeIn'
  | 'slideInUp' 
  | 'slideInDown'
  | 'slideInLeft'
  | 'slideInRight'
  | 'scaleIn';

/**
 * Single, optimized animation manager replacing all previous systems
 */
export class OptimizedAnimationManager {
  private static instance: OptimizedAnimationManager | null = null;
  
  private config: OptimizedAnimationConfig;
  private elements = new Map<Element, AnimationElement>();
  private observer: IntersectionObserver | null = null;
  private rafId: number | null = null;
  private performanceMarks = new Map<string, number>();

  private constructor(config: OptimizedAnimationConfig) {
    this.config = config;
    this.init();
  }

  /**
   * Singleton pattern for single animation manager instance
   */
  public static getInstance(config?: OptimizedAnimationConfig): OptimizedAnimationManager {
    if (!OptimizedAnimationManager.instance && config) {
      OptimizedAnimationManager.instance = new OptimizedAnimationManager(config);
    }
    return OptimizedAnimationManager.instance!;
  }

  private init(): void {
    if (!this.config.enabled) return;

    // Respect user's reduced motion preference
    if (this.config.respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.log('Reduced motion detected, animations disabled');
      return;
    }

    this.createIntersectionObserver();
    this.observeElements();
    this.startPerformanceMonitoring();
  }

  /**
   * Optimized IntersectionObserver with performance-tuned thresholds
   */
  private createIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        // Optimized thresholds for better performance
        threshold: [0, 0.1, 0.25],
        rootMargin: '50px 0px', // Preload animations slightly before entering viewport
      }
    );
  }

  /**
   * Handle intersection with performance optimization
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    if (this.config.performanceMonitoring) {
      performance.mark('animation-intersection-start');
    }

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const animElement = this.elements.get(entry.target);
        if (animElement && animElement.state === 'idle') {
          this.scheduleAnimation(animElement);
        }
      }
    });

    if (this.config.performanceMonitoring) {
      performance.mark('animation-intersection-end');
      performance.measure('animation-intersection', 'animation-intersection-start', 'animation-intersection-end');
    }
  }

  /**
   * Schedule animation with requestAnimationFrame for optimal performance
   */
  private scheduleAnimation(animElement: AnimationElement): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.executeAnimation(animElement);
    });
  }

  /**
   * Execute animation with hardware acceleration hints
   */
  private executeAnimation(animElement: AnimationElement): void {
    const { element, animation, options } = animElement;
    
    // Performance monitoring
    const startTime = performance.now();
    
    // Add hardware acceleration hints
    element.style.willChange = 'transform, opacity';
    element.style.transform = 'translateZ(0)'; // Force GPU layer
    
    // Set optimized transition properties
    element.style.transitionDuration = `${options.duration}ms`;
    element.style.transitionTimingFunction = options.easing;
    element.style.transitionProperty = 'transform, opacity';

    // Apply animation with delay
    setTimeout(() => {
      animElement.state = 'animating';
      this.applyAnimationStyles(element, animation);
      
      // Cleanup after animation completes
      setTimeout(() => {
        this.cleanupAnimation(animElement);
        
        // Performance tracking
        if (this.config.performanceMonitoring) {
          const duration = performance.now() - startTime;
          this.trackAnimationPerformance(animation, duration);
        }
      }, options.duration);
      
    }, options.delay);
  }

  /**
   * Apply animation styles with GPU acceleration
   */
  private applyAnimationStyles(element: HTMLElement, animation: AnimationType): void {
    // Remove initial states and let CSS transitions handle the animation
    element.classList.add('animate', `animate-${animation}`);
    
    // Ensure transforms use GPU acceleration
    switch (animation) {
      case 'fadeIn':
        element.style.opacity = '1';
        break;
      case 'slideInUp':
        element.style.transform = 'translateY(0) translateZ(0)';
        element.style.opacity = '1';
        break;
      case 'slideInDown':
        element.style.transform = 'translateY(0) translateZ(0)';
        element.style.opacity = '1';
        break;
      case 'slideInLeft':
        element.style.transform = 'translateX(0) translateZ(0)';
        element.style.opacity = '1';
        break;
      case 'slideInRight':
        element.style.transform = 'translateX(0) translateZ(0)';
        element.style.opacity = '1';
        break;
      case 'scaleIn':
        element.style.transform = 'scale(1) translateZ(0)';
        element.style.opacity = '1';
        break;
    }
  }

  /**
   * Cleanup animation with performance optimization
   */
  private cleanupAnimation(animElement: AnimationElement): void {
    const { element, options } = animElement;
    
    // Remove will-change to free up GPU resources
    element.style.willChange = 'auto';
    
    // Mark as completed
    animElement.state = 'completed';
    
    // Stop observing if animation should only happen once
    if (options.once && this.observer) {
      this.observer.unobserve(element);
      this.elements.delete(element);
    }
  }

  /**
   * Register element for animation
   */
  public registerElement(
    element: HTMLElement, 
    animation: AnimationType, 
    options: Partial<AnimationOptions> = {}
  ): void {
    const defaultOptions: AnimationOptions = {
      delay: 0,
      duration: 600,
      threshold: 0.1,
      once: true,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    // Set initial styles with GPU acceleration
    this.setInitialStyles(element, animation);
    
    const animElement: AnimationElement = {
      element,
      animation,
      options: finalOptions,
      state: 'idle',
      lastUpdate: 0
    };

    this.elements.set(element, animElement);
    
    if (this.observer) {
      this.observer.observe(element);
    }
  }

  /**
   * Set initial styles with hardware acceleration
   */
  private setInitialStyles(element: HTMLElement, animation: AnimationType): void {
    // Add hardware acceleration from the start
    element.style.backfaceVisibility = 'hidden';
    element.style.perspective = '1000px';
    
    switch (animation) {
      case 'fadeIn':
        element.style.opacity = '0';
        break;
      case 'slideInUp':
        element.style.opacity = '0';
        element.style.transform = 'translateY(50px) translateZ(0)';
        break;
      case 'slideInDown':
        element.style.opacity = '0';
        element.style.transform = 'translateY(-50px) translateZ(0)';
        break;
      case 'slideInLeft':
        element.style.opacity = '0';
        element.style.transform = 'translateX(-50px) translateZ(0)';
        break;
      case 'slideInRight':
        element.style.opacity = '0';
        element.style.transform = 'translateX(50px) translateZ(0)';
        break;
      case 'scaleIn':
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8) translateZ(0)';
        break;
    }
  }

  /**
   * Observe all animation elements in the DOM
   */
  private observeElements(): void {
    const elements = document.querySelectorAll('[data-animate]');
    this.log(`Found ${elements.length} animation elements`);

    elements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const animation = htmlElement.dataset.animate as AnimationType;
      const delay = parseInt(htmlElement.dataset.animateDelay || '0');
      const duration = parseInt(htmlElement.dataset.animateDuration || '600');
      const once = htmlElement.dataset.animateOnce !== 'false';

      if (animation) {
        this.registerElement(htmlElement, animation, {
          delay,
          duration,
          once
        });
      }
    });
  }

  /**
   * Performance monitoring
   */
  private startPerformanceMonitoring(): void {
    if (!this.config.performanceMonitoring) return;

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB threshold
          console.warn('High memory usage detected in animations:', {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB'
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Track animation performance
   */
  private trackAnimationPerformance(animation: AnimationType, duration: number): void {
    const key = `animation-${animation}`;
    const previous = this.performanceMarks.get(key) || 0;
    
    // Track average duration
    const newAverage = (previous + duration) / 2;
    this.performanceMarks.set(key, newAverage);
    
    // Warn if animation is taking too long
    if (duration > 16) { // More than one frame at 60fps
      console.warn(`Slow animation detected: ${animation} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Debug logging (stripped in production)
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debugMode && process.env.NODE_ENV !== 'production') {
      console.log(`[OptimizedAnimations] ${message}`, ...args);
    }
  }

  /**
   * Destroy manager and cleanup resources
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Cleanup all elements
    this.elements.forEach((animElement) => {
      animElement.element.style.willChange = 'auto';
    });

    this.elements.clear();
    this.performanceMarks.clear();
    
    OptimizedAnimationManager.instance = null;
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): Record<string, any> {
    return {
      totalElements: this.elements.size,
      averagePerformance: Object.fromEntries(this.performanceMarks),
      memoryUsage: 'memory' in performance ? (performance as any).memory : null
    };
  }
}

/**
 * Utility function to initialize optimized animations
 */
export function initOptimizedAnimations(config: Partial<OptimizedAnimationConfig> = {}): OptimizedAnimationManager {
  const defaultConfig: OptimizedAnimationConfig = {
    enabled: false, // DISABLED: All scroll animations completely disabled
    respectReducedMotion: true,
    debugMode: process.env.NODE_ENV !== 'production',
    performanceMonitoring: process.env.NODE_ENV === 'development'
  };

  const finalConfig = { ...defaultConfig, ...config };
  return OptimizedAnimationManager.getInstance(finalConfig);
}

/**
 * Utility function to manually animate an element
 */
export function animateElement(
  element: HTMLElement,
  animation: AnimationType,
  options: Partial<AnimationOptions> = {}
): void {
  const manager = OptimizedAnimationManager.getInstance();
  if (manager) {
    manager.registerElement(element, animation, options);
  }
}
