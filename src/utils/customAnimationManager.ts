/**
 * Custom Animation Manager
 * 
 * Handles complex custom animations including scroll hijacking
 * for creating unique, engaging scroll experiences.
 */

import { customAnimations, type ScrollProgress } from './customAnimations.ts';

export interface CustomAnimationConfig {
  enabled: boolean;
  debugMode: boolean;
  respectReducedMotion: boolean;
}

export class CustomAnimationManager {
  private config: CustomAnimationConfig;
  private elements = new Map<Element, CustomElementData>();
  private hijackedElements = new Set<Element>();
  private isScrollHijacked = false;
  private lastScrollY = 0;
  private rafId: number | null = null;

  constructor(config: CustomAnimationConfig) {
    this.config = config;
    this.init();
  }

  private init() {
    if (!this.config.enabled) return;
    
    // Respect user's reduced motion preference
    if (this.config.respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.log('Reduced motion detected, skipping custom animations');
      return;
    }

    this.findCustomElements();
    this.startScrollListener();
  }

  private findCustomElements() {
    const elements = document.querySelectorAll('[data-mode="custom"]');
    this.log(`Found ${elements.length} custom animation elements`);

    elements.forEach(element => {
      const data = this.extractElementData(element as HTMLElement);
      if (data && data.animationName && customAnimations[data.animationName]) {
        this.elements.set(element, data);
        
        // Setup the animation
        const animation = customAnimations[data.animationName];
        if (animation.setup) {
          animation.setup(element as HTMLElement, data.config);
        }
        
        // Track hijack-enabled elements
        if (animation.hijackScroll) {
          this.hijackedElements.add(element);
        }
      }
    });
  }

  private extractElementData(element: HTMLElement): CustomElementData | null {
    const animationName = element.dataset.customAnimation;
    const configStr = element.dataset.animationConfig;
    
    if (!animationName) return null;
    
    let config = {};
    try {
      config = configStr ? JSON.parse(configStr) : {};
    } catch (e) {
      this.log('Failed to parse animation config:', configStr);
    }
    
    return {
      animationName,
      config: {
        ...config,
        debug: element.dataset.debug === 'true' || this.config.debugMode,
        enabled: element.dataset.enabled !== 'false'
      },
      rect: element.getBoundingClientRect(),
      lastProgress: 0,
      isHijacked: false
    };
  }

  private startScrollListener() {
    let ticking = false;

    const handleScroll = (event: Event) => {
      // Check if we should prevent default scroll behavior
      if (this.shouldHijackScroll()) {
        event.preventDefault();
        this.handleHijackedScroll();
      }

      if (!ticking) {
        requestAnimationFrame(() => {
          this.updateAnimations();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use passive: false to allow preventDefault
    window.addEventListener('scroll', handleScroll, { passive: false });
    window.addEventListener('wheel', handleScroll, { passive: false });
    
    // Initial animation update
    this.updateAnimations();
  }

  private shouldHijackScroll(): boolean {
    // Check if any hijack-enabled element is FULLY in view and should control scroll
    for (const element of this.hijackedElements) {
      const data = this.elements.get(element);
      if (!data || !data.config.enabled) continue;
      
      const progress = this.calculateScrollProgress(element);
      
      // More precise visibility check
      const rect = progress.bounds;
      const viewportHeight = window.innerHeight;
      
      // Calculate actual visibility ratio
      const visibleTop = Math.max(0, Math.min(rect.bottom, viewportHeight));
      const visibleBottom = Math.max(0, Math.min(rect.top, 0));
      const visibleHeight = visibleTop - visibleBottom;
      const elementHeight = rect.height;
      const visibilityRatio = visibleHeight / Math.min(elementHeight, viewportHeight);
      
      // Only hijack when the section is substantially visible (70%+)
      if (visibilityRatio >= 0.7) {
        const animation = customAnimations[data.animationName];
        if (animation.shouldReleaseScroll) {
          const shouldRelease = animation.shouldReleaseScroll(
            element as HTMLElement, 
            progress, 
            data.config
          );
          if (!shouldRelease) {
            if (data.config.debug) {
              this.log(`Hijacking scroll - visibility: ${(visibilityRatio * 100).toFixed(1)}%`);
            }
            return true; // Hijack scroll
          }
        } else {
          return true; // Default hijack when substantially in view
        }
      }
    }
    return false;
  }

  private handleHijackedScroll() {
    // Custom scroll behavior when hijacked
    // This prevents normal page scroll and lets animations control the experience
    this.isScrollHijacked = true;
    
    if (this.config.debugMode) {
      this.log('Scroll hijacked - custom animation controlling');
    }
  }

  private updateAnimations() {
    const scrollY = window.scrollY;
    const velocity = scrollY - this.lastScrollY;

    this.elements.forEach((data, element) => {
      if (!data.config.enabled) return;
      
      const progress = this.calculateScrollProgress(element);
      
      // Only update if progress changed significantly
      if (Math.abs(progress.progress - data.lastProgress) > 0.01) {
        const animation = customAnimations[data.animationName];
        if (animation.animate) {
          animation.animate(element as HTMLElement, progress, data.config);
        }
        
        data.lastProgress = progress.progress;
      }
    });

    this.lastScrollY = scrollY;
    this.isScrollHijacked = false;
  }

  private calculateScrollProgress(element: Element): ScrollProgress {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Calculate if element is in view
    const isInView = rect.top < viewportHeight && rect.bottom > 0;
    
    // More accurate progress calculation for hijacking
    // When element fully enters viewport, progress starts at 0
    // When element fully exits viewport, progress ends at 1
    const elementHeight = rect.height;
    
    // Progress based on how far the element has scrolled through the viewport
    let progress = 0;
    
    if (rect.top <= 0 && rect.bottom >= viewportHeight) {
      // Element is larger than viewport and fills it completely
      progress = Math.abs(rect.top) / (elementHeight - viewportHeight);
    } else if (rect.top <= 0) {
      // Element is exiting the top of viewport
      progress = Math.abs(rect.top) / elementHeight;
    } else if (rect.bottom >= viewportHeight) {
      // Element is entering from bottom of viewport
      progress = (viewportHeight - rect.top) / (elementHeight + viewportHeight);
    } else {
      // Element is completely within viewport
      const totalScrollableDistance = elementHeight + viewportHeight;
      const currentPosition = viewportHeight - rect.top;
      progress = currentPosition / totalScrollableDistance;
    }
    
    progress = Math.max(0, Math.min(1, progress));
    
    return {
      progress,
      isInView,
      distanceFromTop: rect.top,
      velocity: this.lastScrollY - window.scrollY,
      bounds: rect,
      scrollY: window.scrollY
    };
  }

  private log(message: string, ...args: any[]) {
    if (this.config.debugMode) {
      console.log(`[CustomAnimations] ${message}`, ...args);
    }
  }

  public destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // Cleanup all animations
    this.elements.forEach((data, element) => {
      const animation = customAnimations[data.animationName];
      if (animation.cleanup) {
        animation.cleanup(element as HTMLElement, data.config);
      }
    });
    
    this.elements.clear();
    this.hijackedElements.clear();
  }

  public refresh() {
    this.destroy();
    this.init();
  }

  public static initialize(config: CustomAnimationConfig): CustomAnimationManager {
    return new CustomAnimationManager(config);
  }
}

// Internal types
interface CustomElementData {
  animationName: string;
  config: any;
  rect: DOMRect;
  lastProgress: number;
  isHijacked: boolean;
}
