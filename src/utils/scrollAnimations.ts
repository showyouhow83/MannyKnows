/**
 * Scroll Animation Utility
 * 
 * Manages scroll-triggered animations using Intersection Observer API.
 * Automatically detects and animates elements with scroll animation classes.
 */

export interface ScrollAnimationConfig {
  /** Enable/disable scroll animations globally */
  enabled: boolean;
  /** Default threshold for triggering animations */
  defaultThreshold: number;
  /** Enable debug logging */
  debugMode: boolean;
  /** Respect user's reduced motion preference */
  respectReducedMotion: boolean;
}

export class ScrollAnimationManager {
  private observer: IntersectionObserver | null = null;
  private config: ScrollAnimationConfig;
  private animatedElements = new Set<Element>();

  constructor(config: ScrollAnimationConfig) {
    this.config = config;
    this.init();
  }

  private init() {
    // Check if animations should be disabled
    if (!this.config.enabled) return;
    
    // Respect user's reduced motion preference
    if (this.config.respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.log('Reduced motion detected, skipping scroll animations');
      return;
    }

    // Create intersection observer
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: this.config.defaultThreshold,
        rootMargin: '10px'
      }
    );

    // Find and observe all scroll animation elements
    this.observeElements();
  }

  private observeElements() {
    const elements = document.querySelectorAll('.scroll-animation-wrapper');
    this.log(`Found ${elements.length} scroll animation elements`);

    elements.forEach(element => {
      if (this.observer) {
        this.observer.observe(element);
      }
    });
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.animateElement(entry.target);
      }
    });
  }

  private animateElement(element: Element) {
    const htmlElement = element as HTMLElement;
    
    // Get animation configuration from data attributes
    const delay = parseInt(htmlElement.dataset.delay || '0');
    const duration = parseInt(htmlElement.dataset.duration || '600');
    const once = htmlElement.dataset.once === 'true';
    const debug = htmlElement.dataset.debug === 'true' || this.config.debugMode;

    if (debug) {
      this.log(`Animating element with ${delay}ms delay, ${duration}ms duration`);
    }

    // Set animation duration
    htmlElement.style.transitionDuration = `${duration}ms`;

    // Apply animation with delay
    setTimeout(() => {
      htmlElement.classList.add('animate');
      this.animatedElements.add(element);

      if (debug) {
        this.log('Animation applied to element');
      }

      // Stop observing if animation should only happen once
      if (once && this.observer) {
        this.observer.unobserve(element);
      }
    }, delay);
  }

  private log(message: string, ...args: any[]) {
    if (this.config.debugMode) {
      console.log(`[ScrollAnimations] ${message}`, ...args);
    }
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.animatedElements.clear();
  }

  public refresh() {
    this.destroy();
    this.init();
  }

  // Static method to create and initialize manager
  public static initialize(config: ScrollAnimationConfig): ScrollAnimationManager {
    return new ScrollAnimationManager(config);
  }
}

// Utility function for manual element animation
export function animateElement(
  element: Element,
  animation: string,
  duration = 600,
  delay = 0
) {
  const htmlElement = element as HTMLElement;
  
  // Add animation classes
  htmlElement.classList.add('scroll-animation-wrapper', animation);
  htmlElement.style.transitionDuration = `${duration}ms`;

  // Apply animation with delay
  setTimeout(() => {
    htmlElement.classList.add('animate');
  }, delay);
}

// Utility function to get scroll progress of an element
export function getScrollProgress(element: Element): number {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  // Calculate how much of the element is visible
  const elementTop = rect.top;
  const elementHeight = rect.height;
  
  if (elementTop > windowHeight) return 0; // Not visible yet
  if (elementTop + elementHeight < 0) return 1; // Completely passed
  
  // Calculate progress (0 to 1)
  const visibleHeight = Math.min(windowHeight - elementTop, elementHeight);
  return Math.max(0, Math.min(1, visibleHeight / elementHeight));
}
