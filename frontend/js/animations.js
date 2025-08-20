// Animations JavaScript for UAE Visa Services

// Animation Controller Class
class AnimationController {
    constructor() {
        this.observers = new Map();
        this.animationQueue = [];
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupCounterAnimations();
        this.setupParallaxEffects();
        this.setupHoverEffects();
        this.setupLoadingAnimations();
        this.setupPageTransitions();
    }

    // Intersection Observer for scroll-triggered animations
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: [0.1, 0.3, 0.5, 0.7, 0.9],
            rootMargin: '-50px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerAnimation(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements with animation classes
        const animatedElements = document.querySelectorAll([
            '.fade-in',
            '.slide-up',
            '.slide-down',
            '.slide-left',
            '.slide-right',
            '.scale-in',
            '.rotate-in',
            '.bounce-in',
            '.counter-animate',
            '.progress-bar',
            '.timeline-item'
        ].join(','));

        animatedElements.forEach(el => {
            observer.observe(el);
        });

        this.observers.set('intersection', observer);
    }

    // Trigger animation based on element class
    triggerAnimation(element) {
        if (this.isReducedMotion) {
            element.style.opacity = '1';
            element.style.transform = 'none';
            return;
        }

        const delay = parseInt(element.dataset.delay) || 0;
        const duration = parseInt(element.dataset.duration) || 600;

        setTimeout(() => {
            if (element.classList.contains('fade-in')) {
                this.fadeIn(element, duration);
            }
            if (element.classList.contains('slide-up')) {
                this.slideUp(element, duration);
            }
            if (element.classList.contains('slide-down')) {
                this.slideDown(element, duration);
            }
            if (element.classList.contains('slide-left')) {
                this.slideLeft(element, duration);
            }
            if (element.classList.contains('slide-right')) {
                this.slideRight(element, duration);
            }
            if (element.classList.contains('scale-in')) {
                this.scaleIn(element, duration);
            }
            if (element.classList.contains('rotate-in')) {
                this.rotateIn(element, duration);
            }
            if (element.classList.contains('bounce-in')) {
                this.bounceIn(element, duration);
            }
            if (element.classList.contains('counter-animate')) {
                this.animateCounter(element, duration);
            }
            if (element.classList.contains('progress-bar')) {
                this.animateProgressBar(element, duration);
            }
            if (element.classList.contains('timeline-item')) {
                this.animateTimelineItem(element, duration);
            }
        }, delay);
    }

    // Animation methods
    fadeIn(element, duration = 600) {
        element.style.transition = `opacity ${duration}ms ease-out`;
        element.style.opacity = '1';
        element.classList.add('animated');
    }

    slideUp(element, duration = 600) {
        element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
        element.style.transform = 'translateY(0)';
        element.style.opacity = '1';
        element.classList.add('animated');
    }

    slideDown(element, duration = 600) {
        element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
        element.style.transform = 'translateY(0)';
        element.style.opacity = '1';
        element.classList.add('animated');
    }

    slideLeft(element, duration = 600) {
        element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
        element.style.transform = 'translateX(0)';
        element.style.opacity = '1';
        element.classList.add('animated');
    }

    slideRight(element, duration = 600) {
        element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
        element.style.transform = 'translateX(0)';
        element.style.opacity = '1';
        element.classList.add('animated');
    }

    scaleIn(element, duration = 600) {
        element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
        element.style.transform = 'scale(1)';
        element.style.opacity = '1';
        element.classList.add('animated');
    }

    rotateIn(element, duration = 600) {
        element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
        element.style.transform = 'rotate(0deg) scale(1)';
        element.style.opacity = '1';
        element.classList.add('animated');
    }

    bounceIn(element, duration = 800) {
        element.style.transition = `transform ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity ${duration}ms ease-out`;
        element.style.transform = 'scale(1)';
        element.style.opacity = '1';
        element.classList.add('animated');
    }

    // Counter animation
    animateCounter(element, duration = 2000) {
        const target = parseInt(element.dataset.target) || parseInt(element.textContent);
        const increment = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                element.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString();
                element.classList.add('animated');
            }
        };

        updateCounter();
    }

    // Progress bar animation
    animateProgressBar(element, duration = 1500) {
        const progress = element.querySelector('.progress-fill') || element;
        const target = parseInt(element.dataset.progress) || 100;
        
        progress.style.transition = `width ${duration}ms ease-out`;
        progress.style.width = `${target}%`;
        
        // Animate percentage text if exists
        const percentText = element.querySelector('.progress-text');
        if (percentText) {
            this.animateCounter(percentText, duration);
        }
        
        element.classList.add('animated');
    }

    // Timeline item animation
    animateTimelineItem(element, duration = 600) {
        const icon = element.querySelector('.timeline-icon');
        const content = element.querySelector('.timeline-content');
        
        if (icon) {
            icon.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
            icon.style.transform = 'scale(1)';
            icon.style.opacity = '1';
        }
        
        if (content) {
            setTimeout(() => {
                content.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
                content.style.transform = 'translateX(0)';
                content.style.opacity = '1';
            }, 200);
        }
        
        element.classList.add('animated');
    }

    // Scroll-based animations
    setupScrollAnimations() {
        let ticking = false;
        
        const updateScrollAnimations = () => {
            const scrollY = window.pageYOffset;
            const windowHeight = window.innerHeight;
            
            // Parallax elements
            const parallaxElements = document.querySelectorAll('.parallax');
            parallaxElements.forEach(element => {
                const speed = parseFloat(element.dataset.speed) || 0.5;
                const yPos = -(scrollY * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
            
            // Header background opacity
            const header = document.querySelector('.header');
            if (header) {
                const opacity = Math.min(scrollY / 100, 1);
                header.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
            }
            
            ticking = false;
        };
        
        const requestScrollUpdate = () => {
            if (!ticking && !this.isReducedMotion) {
                requestAnimationFrame(updateScrollAnimations);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    }

    // Parallax effects
    setupParallaxEffects() {
        if (this.isReducedMotion) return;
        
        const parallaxElements = document.querySelectorAll('.parallax-bg');
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const rate = scrolled * -0.5;
                element.style.transform = `translateY(${rate}px)`;
            });
        };
        
        window.addEventListener('scroll', this.throttle(updateParallax, 16), { passive: true });
    }

    // Hover effects
    setupHoverEffects() {
        // Card hover effects
        const cards = document.querySelectorAll('.card, .service-card, .process-step');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (!this.isReducedMotion) {
                    card.style.transform = 'translateY(-10px)';
                    card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
            });
        });
        
        // Button hover effects
        const buttons = document.querySelectorAll('.btn');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                if (!this.isReducedMotion) {
                    button.style.transform = 'translateY(-2px)';
                }
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });
        });
    }

    // Loading animations
    setupLoadingAnimations() {
        // Skeleton loading
        const skeletonElements = document.querySelectorAll('.skeleton');
        
        skeletonElements.forEach(element => {
            if (!this.isReducedMotion) {
                element.style.animation = 'skeleton-loading 1.5s ease-in-out infinite';
            }
        });
        
        // Spinner animations
        const spinners = document.querySelectorAll('.spinner');
        
        spinners.forEach(spinner => {
            if (!this.isReducedMotion) {
                spinner.style.animation = 'spin 1s linear infinite';
            }
        });
    }

    // Page transitions
    setupPageTransitions() {
        // Smooth page load animation
        window.addEventListener('load', () => {
            document.body.classList.add('loaded');
            
            // Animate hero section
            const hero = document.querySelector('.hero');
            if (hero && !this.isReducedMotion) {
                hero.style.opacity = '0';
                hero.style.transform = 'translateY(50px)';
                
                setTimeout(() => {
                    hero.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
                    hero.style.opacity = '1';
                    hero.style.transform = 'translateY(0)';
                }, 100);
            }
        });
        
        // Link transitions
        const internalLinks = document.querySelectorAll('a[href^="./"], a[href^="/"]');
        
        internalLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (!this.isReducedMotion && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    
                    document.body.style.opacity = '0';
                    document.body.style.transform = 'translateY(-20px)';
                    
                    setTimeout(() => {
                        window.location.href = link.href;
                    }, 300);
                }
            });
        });
    }

    // Utility methods
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Public methods for manual animation triggers
    animateElement(element, animationType, options = {}) {
        const duration = options.duration || 600;
        const delay = options.delay || 0;
        
        setTimeout(() => {
            switch (animationType) {
                case 'fadeIn':
                    this.fadeIn(element, duration);
                    break;
                case 'slideUp':
                    this.slideUp(element, duration);
                    break;
                case 'slideDown':
                    this.slideDown(element, duration);
                    break;
                case 'slideLeft':
                    this.slideLeft(element, duration);
                    break;
                case 'slideRight':
                    this.slideRight(element, duration);
                    break;
                case 'scaleIn':
                    this.scaleIn(element, duration);
                    break;
                case 'rotateIn':
                    this.rotateIn(element, duration);
                    break;
                case 'bounceIn':
                    this.bounceIn(element, duration);
                    break;
                default:
                    console.warn(`Unknown animation type: ${animationType}`);
            }
        }, delay);
    }

    // Animate multiple elements in sequence
    animateSequence(elements, animationType, staggerDelay = 100) {
        elements.forEach((element, index) => {
            this.animateElement(element, animationType, {
                delay: index * staggerDelay
            });
        });
    }

    // Reset animations
    resetAnimations() {
        const animatedElements = document.querySelectorAll('.animated');
        
        animatedElements.forEach(element => {
            element.classList.remove('animated');
            element.style.opacity = '';
            element.style.transform = '';
            element.style.transition = '';
        });
    }

    // Counter animations for statistics
    setupCounterAnimations() {
        const counters = document.querySelectorAll('.stat-number');
        
        if (counters.length === 0) return;

        const animateCounter = (counter) => {
            const target = parseInt(counter.textContent.replace(/\D/g, ''));
            const suffix = counter.textContent.replace(/\d/g, '');
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target + suffix;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current) + suffix;
                }
            }, 40);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        counters.forEach(counter => observer.observe(counter));
        this.observers.set('counter', observer);
    }

    // Destroy observers
    destroy() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
    }
}

// Text animation utilities
class TextAnimations {
    static typeWriter(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        
        const typeInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
            }
        }, speed);
    }
    
    static fadeInWords(element, delay = 100) {
        const text = element.textContent;
        const words = text.split(' ');
        
        element.innerHTML = words.map(word => 
            `<span class="word-fade" style="opacity: 0;">${word}</span>`
        ).join(' ');
        
        const wordElements = element.querySelectorAll('.word-fade');
        
        wordElements.forEach((word, index) => {
            setTimeout(() => {
                word.style.transition = 'opacity 0.5s ease-out';
                word.style.opacity = '1';
            }, index * delay);
        });
    }
    
    static slideInLetters(element, delay = 50) {
        const text = element.textContent;
        const letters = text.split('');
        
        element.innerHTML = letters.map(letter => 
            letter === ' ' ? ' ' : 
            `<span class="letter-slide" style="display: inline-block; transform: translateY(50px); opacity: 0;">${letter}</span>`
        ).join('');
        
        const letterElements = element.querySelectorAll('.letter-slide');
        
        letterElements.forEach((letter, index) => {
            setTimeout(() => {
                letter.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
                letter.style.transform = 'translateY(0)';
                letter.style.opacity = '1';
            }, index * delay);
        });
    }
}

// Loading screen animation
class LoadingScreen {
    constructor() {
        this.loadingElement = document.querySelector('.loading-screen');
        this.init();
    }
    
    init() {
        if (!this.loadingElement) return;
        
        // Hide loading screen when page is fully loaded
        window.addEventListener('load', () => {
            this.hide();
        });
        
        // Fallback timeout
        setTimeout(() => {
            this.hide();
        }, 5000);
    }
    
    hide() {
        if (this.loadingElement) {
            this.loadingElement.style.opacity = '0';
            setTimeout(() => {
                this.loadingElement.style.display = 'none';
            }, 500);
        }
    }
}

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize animation controller
    const animationController = new AnimationController();
    
    // Initialize loading screen
    new LoadingScreen();
    
    // Add to global scope for external access
    window.UaeVisaApp = window.UaeVisaApp || {};
    window.UaeVisaApp.animations = animationController;
    window.UaeVisaApp.TextAnimations = TextAnimations;
    
    // Handle reduced motion preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', () => {
        animationController.isReducedMotion = mediaQuery.matches;
        if (mediaQuery.matches) {
            animationController.resetAnimations();
        }
    });
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnimationController, TextAnimations, LoadingScreen };
}