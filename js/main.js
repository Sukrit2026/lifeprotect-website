/* ============================================
   LifeProtect, LLC - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const MOBILE_BREAKPOINT = 768;
  const COUNTER_DURATION = 2000;
  const SCROLL_THRESHOLD = 10;
  const SAFE_SELECTOR_PATTERN = /^#[a-zA-Z0-9_-]+$/;

  // Remove no-js class
  document.documentElement.classList.remove('no-js');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Mobile Navigation ---
  const navToggle = document.querySelector('.nav__toggle');
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav__link');

  function openMobileNav() {
    navToggle.classList.add('active');
    nav.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    nav.addEventListener('keydown', trapFocus);
  }

  function closeMobileNav() {
    navToggle.classList.remove('active');
    nav.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    nav.removeEventListener('keydown', trapFocus);
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = nav.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      nav.classList.contains('active') ? closeMobileNav() : openMobileNav();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('active')) {
        closeMobileNav();
        navToggle.focus();
      }
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) closeMobileNav();
    });
  });

  // --- Sticky Header ---
  const header = document.querySelector('.header');
  if (header) {
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          header.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });
  }

  // --- Scroll Animations ---
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  if (animatedElements.length > 0) {
    if (prefersReducedMotion) {
      animatedElements.forEach(el => el.classList.add('visible'));
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
      animatedElements.forEach(el => observer.observe(el));
    }
  }

  // --- Counter Animation ---
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length > 0) {
    if (prefersReducedMotion) {
      counters.forEach(el => {
        const target = parseFloat(el.dataset.count);
        if (isNaN(target)) return;
        el.textContent = (el.dataset.prefix || '') + (target % 1 === 0 ? Math.round(target).toLocaleString() : target.toFixed(1)) + (el.dataset.suffix || '');
      });
    } else {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(counter => counterObserver.observe(counter));
    }
  }

  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / COUNTER_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased; el.textContent = prefix + (target % 1 === 0 ? Math.round(current).toLocaleString() : current.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // --- Form Submissions (Formspree) ---
  document.querySelectorAll('form').forEach(form => {
    if (form.classList.contains('newsletter__form')) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.textContent : '';
      const action = form.getAttribute('action');
      if (!action || action === '#') return;
      if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }
      fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(response => {
        if (response.ok) {
          if (btn) btn.textContent = 'Thank you!';
          form.reset();
          setTimeout(() => { if (btn) { btn.textContent = originalText; btn.disabled = false; } }, 3000);
        } else {
          if (btn) { btn.textContent = 'Error - try again'; btn.disabled = false; }
          setTimeout(() => { if (btn) btn.textContent = originalText; }, 3000);
        }
      }).catch(() => {
        if (btn) { btn.textContent = 'Error - try again'; btn.disabled = false; }
        setTimeout(() => { if (btn) btn.textContent = originalText; }, 3000);
      });
    });
  });

  // --- Newsletter Forms (Formspree) ---
  document.querySelectorAll('.newsletter__form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const btn = form.querySelector('button');
      const action = form.getAttribute('action');
      if (!action || action === '#') return;
      fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(response => {
        if (response.ok) {
          if (btn) btn.textContent = 'Subscribed!';
          if (input) input.value = '';
          setTimeout(() => { if (btn) btn.textContent = 'Subscribe'; }, 3000);
        } else {
          if (btn) btn.textContent = 'Error';
          setTimeout(() => { if (btn) btn.textContent = 'Subscribe'; }, 3000);
        }
      }).catch(() => {
        if (btn) btn.textContent = 'Error';
        setTimeout(() => { if (btn) btn.textContent = 'Subscribe'; }, 3000);
      });
    });
  });

  // --- Smooth Scroll ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#' || !SAFE_SELECTOR_PATTERN.test(targetId)) return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 0;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerHeight - 20, behavior: 'smooth' });
      }
    });
  });

  // --- Active Nav ---
  const currentPage = window.location.pathname.split('/').pop().split('?')[0].split('#')[0] || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('nav__link--active');
    }
  });

});
