/**
 * Custom Scroll Animation System
 * 
 * Define unique, complex animations that can hijack scroll behavior
 * and create engaging, dynamic effects per section.
 */

export interface ScrollProgress {
  /** Progress through the element (0 = entering viewport, 1 = leaving viewport) */
  progress: number;
  /** Whether element is fully in view */
  isInView: boolean;
  /** Element's distance from top of viewport */
  distanceFromTop: number;
  /** Scroll velocity (positive = down, negative = up) */
  velocity: number;
  /** Element's bounding rectangle */
  bounds: DOMRect;
  /** Current scroll position */
  scrollY: number;
}

export interface CustomAnimationDefinition {
  /** Animation function that receives scroll progress and manipulates element */
  animate: (element: HTMLElement, progress: ScrollProgress, config: any) => void;
  /** Setup function called once when animation initializes */
  setup?: (element: HTMLElement, config: any) => void;
  /** Cleanup function called when animation is destroyed */
  cleanup?: (element: HTMLElement, config: any) => void;
  /** Whether this animation should hijack/pause normal scrolling */
  hijackScroll?: boolean;
  /** Function to determine if scroll should be released */
  shouldReleaseScroll?: (element: HTMLElement, progress: ScrollProgress, config: any) => boolean;
}

/**
 * Registry of custom animations
 */
export const customAnimations: Record<string, CustomAnimationDefinition> = {
  
  /**
   * Reviews Scroll Animation
   * Hijacks scroll to control review cards one by one
   */
  reviewsScrollHijack: {
    hijackScroll: true,
    
    setup: (element: HTMLElement, config: any) => {
      // Find the reviews container and cards
      const reviewsContainer = element.querySelector('[data-reviews-container]') as HTMLElement;
      const reviewCards = element.querySelectorAll('[data-review-card]');
      
      if (!reviewsContainer || reviewCards.length === 0) {
        console.warn('Reviews scroll animation: No reviews container or cards found');
        return;
      }
      
      // Store initial state
      element.dataset.totalReviews = reviewCards.length.toString();
      element.dataset.currentReview = '0';
      element.dataset.animationActive = 'false';
      
      // Setup CSS for smooth card transitions
      reviewsContainer.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      reviewsContainer.style.display = 'flex';
      reviewsContainer.style.width = `${reviewCards.length * 100}%`;
      
      // Position cards side by side
      reviewCards.forEach((card, index) => {
        (card as HTMLElement).style.width = `${100 / reviewCards.length}%`;
        (card as HTMLElement).style.flexShrink = '0';
      });
      
      if (config.debug) {
        console.log('🎬 Reviews scroll hijack setup:', {
          totalReviews: reviewCards.length,
          container: reviewsContainer
        });
      }
    },
    
    animate: (element: HTMLElement, progress: ScrollProgress, config: any) => {
      if (!progress.isInView) return;
      
      const totalReviews = parseInt(element.dataset.totalReviews || '0');
      if (totalReviews === 0) return;
      
      // Calculate which review should be shown based on scroll progress
      // Map progress 0-1 to review index 0-(totalReviews-1)
      const reviewIndex = Math.floor(progress.progress * totalReviews);
      const clampedIndex = Math.max(0, Math.min(totalReviews - 1, reviewIndex));
      
      const currentReview = parseInt(element.dataset.currentReview || '0');
      
      // Only update if review changed (prevents unnecessary DOM updates)
      if (clampedIndex !== currentReview) {
        const reviewsContainer = element.querySelector('[data-reviews-container]') as HTMLElement;
        if (reviewsContainer) {
          // Calculate transform to show the current review
          const translateX = -(clampedIndex * (100 / totalReviews));
          reviewsContainer.style.transform = `translateX(${translateX}%)`;
          
          element.dataset.currentReview = clampedIndex.toString();
          element.dataset.animationActive = 'true';
          
          if (config.debug) {
            console.log('🎬 Reviews scroll progress:', {
              progress: progress.progress.toFixed(3),
              reviewIndex: clampedIndex,
              translateX: translateX.toFixed(1)
            });
          }
        }
      }
    },
    
    shouldReleaseScroll: (element: HTMLElement, progress: ScrollProgress, config: any) => {
      const totalReviews = parseInt(element.dataset.totalReviews || '0');
      const currentReview = parseInt(element.dataset.currentReview || '0');
      
      // Release scroll when we've shown all reviews and progress > 0.9
      return currentReview >= (totalReviews - 1) && progress.progress > 0.9;
    },
    
    cleanup: (element: HTMLElement, config: any) => {
      const reviewsContainer = element.querySelector('[data-reviews-container]') as HTMLElement;
      if (reviewsContainer) {
        reviewsContainer.style.transform = '';
        reviewsContainer.style.transition = '';
      }
      
      element.dataset.animationActive = 'false';
      
      if (config.debug) {
        console.log('🎬 Reviews scroll hijack cleanup');
      }
    }
  },

  /**
   * Dynamic Element Choreography
   * Elements fly in from different directions in sequence
   */
  dynamicChoreography: {
    setup: (element: HTMLElement, config: any) => {
      const animatableElements = element.querySelectorAll('[data-animate-element]');
      
      animatableElements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.opacity = '0';
        htmlEl.style.transform = 'translateY(100px) scale(0.8)';
        htmlEl.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        htmlEl.dataset.animationDelay = (index * 100).toString(); // Stagger effect
      });
      
      if (config.debug) {
        console.log('🎬 Dynamic choreography setup:', { elements: animatableElements.length });
      }
    },
    
    animate: (element: HTMLElement, progress: ScrollProgress, config: any) => {
      if (!progress.isInView) return;
      
      const animatableElements = element.querySelectorAll('[data-animate-element]');
      
      animatableElements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        const delay = parseInt(htmlEl.dataset.animationDelay || '0');
        const adjustedProgress = Math.max(0, progress.progress - (delay / 1000));
        
        if (adjustedProgress > 0) {
          // Create unique animation based on element index
          const animations = [
            // Slide in from left with rotation
            () => {
              htmlEl.style.opacity = '1';
              htmlEl.style.transform = `translateX(0) rotate(0deg) scale(1)`;
            },
            // Slide in from right with bounce
            () => {
              htmlEl.style.opacity = '1';
              htmlEl.style.transform = `translateY(0) scale(1.05)`;
              setTimeout(() => htmlEl.style.transform = 'translateY(0) scale(1)', 200);
            },
            // Scale and fade in
            () => {
              htmlEl.style.opacity = '1';
              htmlEl.style.transform = `scale(1) rotate(5deg)`;
              setTimeout(() => htmlEl.style.transform = 'scale(1) rotate(0deg)', 300);
            }
          ];
          
          const animationIndex = index % animations.length;
          animations[animationIndex]();
        }
      });
    }
  },

  /**
   * Floating Circle Animation
   * Elements move in circular paths as user scrolls
   */
  floatingCircles: {
    animate: (element: HTMLElement, progress: ScrollProgress, config: any) => {
      const floatingElements = element.querySelectorAll('[data-float-element]');
      
      floatingElements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        const radius = config.radius || 50;
        const speed = config.speed || 1;
        
        // Calculate circular motion
        const angle = progress.progress * Math.PI * 2 * speed + (index * Math.PI / 2);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        htmlEl.style.transform = `translate(${x}px, ${y}px)`;
        htmlEl.style.opacity = progress.isInView ? '1' : '0.3';
      });
    }
  }
};

/**
 * Utility functions for building custom animations
 */
export const animationUtils = {
  // Easing functions
  easeInOut: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOutBack: (t: number): number => 1 + (2.7 * Math.pow(t - 1, 3)) + (1.7 * Math.pow(t - 1, 2)),
  
  // Utility to clamp values
  clamp: (value: number, min: number, max: number): number => 
    Math.max(min, Math.min(max, value)),
  
  // Utility to interpolate between values
  lerp: (start: number, end: number, progress: number): number => 
    start + (end - start) * progress,
  
  // Utility to create staggered delays
  getStaggerDelay: (index: number, baseDelay: number = 100): number => 
    index * baseDelay,
};
