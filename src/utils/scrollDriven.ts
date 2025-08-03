/**
 * Scroll-Driven Animation Manager
 * 
 * Handles continuous scroll-driven animations where elements animate
 * based on their scroll position, not just when entering viewport.
 */

export interface ScrollDrivenConfig {
  /** Enable/disable scroll-driven animations globally */
  enabled: boolean;
  /** Enable debug logging */
  debugMode: boolean;
  /** Respect user's reduced motion preference */
  respectReducedMotion: boolean;
  /** Throttle scroll events (ms) */
  throttleMs: number;
}

export class ScrollDrivenManager {
  private config: ScrollDrivenConfig;
  private elements = new Map<Element, ScrollElementData>();
  private rafId: number | null = null;
  private lastScrollY = 0;
  private isScrolling = false;

  constructor(config: ScrollDrivenConfig) {
    this.config = config;
    this.init();
  }

  private init() {
    if (!this.config.enabled) return;
    
    // Respect user's reduced motion preference
    if (this.config.respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.log('Reduced motion detected, skipping scroll-driven animations');
      return;
    }

    this.findScrollElements();
    this.startScrollListener();
  }

  private findScrollElements() {
    const elements = document.querySelectorAll('[data-mode="scroll"]');
    this.log(`Found ${elements.length} scroll-driven elements`);

    elements.forEach(element => {
      const data = this.extractElementData(element as HTMLElement);
      this.elements.set(element, data);
    });
  }

  private extractElementData(element: HTMLElement): ScrollElementData {
    return {
      scrollEffect: element.dataset.scrollEffect as ScrollEffect || 'parallax',
      scrollSpeed: parseFloat(element.dataset.scrollSpeed || '0.5'),
      startValue: parseFloat(element.dataset.startValue || '0'),
      endValue: parseFloat(element.dataset.endValue || '100'),
      debug: element.dataset.debug === 'true' || this.config.debugMode,
      rect: element.getBoundingClientRect(),
      lastProgress: 0
    };
  }

  private startScrollListener() {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.updateAnimations();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial animation update
    this.updateAnimations();
  }

  private updateAnimations() {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;

    this.elements.forEach((data, element) => {
      // Update element rect (in case layout changed)
      data.rect = element.getBoundingClientRect();
      
      // Calculate scroll progress (0 = top of viewport, 1 = bottom of viewport)
      const progress = this.calculateScrollProgress(data.rect, viewportHeight);
      
      // Only update if progress changed significantly (performance optimization)
      if (Math.abs(progress - data.lastProgress) > 0.01) {
        this.applyScrollEffect(element as HTMLElement, data, progress);
        data.lastProgress = progress;
        
        if (data.debug) {
          this.log(`Element progress: ${progress.toFixed(2)}`);
        }
      }
    });

    this.lastScrollY = scrollY;
  }

  private calculateScrollProgress(rect: DOMRect, viewportHeight: number): number {
    const elementTop = rect.top;
    const elementHeight = rect.height;
    const elementBottom = elementTop + elementHeight;

    // Element is completely above viewport
    if (elementBottom < 0) return 1;
    
    // Element is completely below viewport  
    if (elementTop > viewportHeight) return 0;

    // Calculate progress based on element position in viewport
    const visibleStart = Math.max(0, viewportHeight - elementTop);
    const totalScrollableDistance = viewportHeight + elementHeight;
    const progress = visibleStart / totalScrollableDistance;

    return Math.max(0, Math.min(1, progress));
  }

  private applyScrollEffect(element: HTMLElement, data: ScrollElementData, progress: number) {
    const { scrollEffect, scrollSpeed, startValue, endValue } = data;
    
    // Calculate interpolated value
    const value = startValue + (endValue - startValue) * progress;

    switch (scrollEffect) {
      case 'parallax':
        const translateY = progress * scrollSpeed * 100;
        element.style.transform = `translateY(${translateY}px)`;
        break;

      case 'rotate':
        element.style.transform = `rotate(${value}deg)`;
        break;

      case 'scale':
        const scale = startValue + (endValue - startValue) * progress;
        element.style.transform = `scale(${scale})`;
        break;

      case 'opacity':
        element.style.opacity = progress.toString();
        break;

      case 'skew':
        element.style.transform = `skewX(${value}deg)`;
        break;

      case 'blur':
        element.style.filter = `blur(${value}px)`;
        break;

      default:
        this.log(`Unknown scroll effect: ${scrollEffect}`);
    }
  }

  private log(message: string, ...args: any[]) {
    if (this.config.debugMode) {
      console.log(`[ScrollDriven] ${message}`, ...args);
    }
  }

  public destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.elements.clear();
  }

  public refresh() {
    this.destroy();
    this.init();
  }

  public static initialize(config: ScrollDrivenConfig): ScrollDrivenManager {
    return new ScrollDrivenManager(config);
  }
}

// Types
interface ScrollElementData {
  scrollEffect: ScrollEffect;
  scrollSpeed: number;
  startValue: number;
  endValue: number;
  debug: boolean;
  rect: DOMRect;
  lastProgress: number;
}

type ScrollEffect = 'parallax' | 'rotate' | 'scale' | 'opacity' | 'skew' | 'blur';

// Utility function to create smooth easing
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Utility function to clamp values
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
