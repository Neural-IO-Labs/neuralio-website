(function () {
/**
 * Neural:IO Labs - Website JavaScript
 * ====================================
 * Handles all interactive functionality including:
 * - Mobile navigation
 * - Contact modal
 * - Smooth scrolling
 * - Animation triggers
 * - Copy to clipboard
 */

// DOM Ready
document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initModal();
    initSmoothScroll();
    initAnimations();
});

(function() {


/**
 * Mobile Navigation
 */
function initNavigation() {
    const toggle = document.getElementById('navMobileToggle');
    const links = document.getElementById('navLinks');

    if (toggle && links) {
        toggle.addEventListener('click', function () {
            links.classList.toggle('active');
            toggle.classList.toggle('active');
        });

        // Close menu when clicking a link
        links.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                links.classList.remove('active');
                toggle.classList.remove('active');
            });
        });
    }

    // Navbar background on scroll
    const nav = document.querySelector('.nav');
    if (nav) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }
}

/**
 * Contact Modal
 */
const modal = {
    element: null,

    init() {
        this.element = document.getElementById('contactModal');
    },

    open() {
        if (this.element) {
            this.element.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    close() {
        if (this.element) {
            this.element.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
};

function initModal() {
    modal.init();

    // Close on backdrop click
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => modal.close());
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') modal.close();
    });
}

// Global functions for onclick handlers
window.openContactModal = function() {
    modal.open();
};

window.closeContactModal = function() {
    modal.close();
};

/**
 * Copy Email to Clipboard
 */
let copyEmailTimeoutId = null;
window.copyEmail = function() {
    const emailElement = document.getElementById('contactEmail');
    const feedback = document.getElementById('copyFeedback');

    if (emailElement) {
        const email = emailElement.innerText;

        navigator.clipboard.writeText(email).then(() => {
            // Show feedback
            if (feedback) {
                feedback.classList.add('visible');
                if (copyEmailTimeoutId) {
                    clearTimeout(copyEmailTimeoutId);
                }
                copyEmailTimeoutId = setTimeout(() => {
                    feedback.classList.remove('visible');
                    copyEmailTimeoutId = null;
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }
};

/**
 * Smooth Scrolling
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);

            if (target) {
                const navHeight = document.querySelector('.nav')?.offsetHeight || 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Scroll-triggered Animations
 */
function initAnimations() {
    const observerOptions = {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe legacy animate-on-scroll elements
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

    // Observe new .reveal elements
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Auto-tag major section cards for reveal (staggered)
    const autoRevealSelectors = [
        '.metric-card',
        '.pricing-card',
        '.technology-container > *',
        '#sandbox-demo h2',
        '#sandbox-demo p',
        '#dashboard h2',
        '#dashboard p',
    ];
    autoRevealSelectors.forEach((sel, sIdx) => {
        document.querySelectorAll(sel).forEach((el, i) => {
            if (!el.classList.contains('reveal')) {
                el.classList.add('reveal');
                const delayClass = ['', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'][Math.min(i, 3)];
                if (delayClass) el.classList.add(delayClass);
            }
            observer.observe(el);
        });
    });

    // Trigger terminal animation when visible
    const terminal = document.querySelector('.terminal');
    if (terminal) {
        const terminalObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    terminal.classList.add('animate');
                    terminalObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        terminalObserver.observe(terminal);
    }
}


/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Utility: Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Analytics placeholder
 * Replace with actual analytics implementation
 */
function trackEvent(category, action, label) {
    // Placeholder for analytics tracking
    // Example: gtag('event', action, { 'event_category': category, 'event_label': label });
    console.log(`[Analytics] ${category}: ${action} - ${label}`);
}

// Track CTA clicks
document.querySelectorAll('[data-track]').forEach(el => {
    el.addEventListener('click', function () {
        const trackData = this.dataset.track;
        trackEvent('CTA', 'click', trackData);
    });
});

})();
