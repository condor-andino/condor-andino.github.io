/* ═══════════════════════════════════════════════════════════════
   MAIN.JS — Investigador Jurídico Híbrido
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── FLOATING PARTICLES (hero) ──────────────────────────
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        const count = 18;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.left = Math.random() * 100 + '%';
            p.style.top = Math.random() * 100 + '%';
            p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
            p.style.animationDelay = (Math.random() * 6) + 's';
            p.style.animationDuration = (5 + Math.random() * 5) + 's';
            // Alternate between accent and muted colors
            if (Math.random() > 0.5) {
                p.style.background = '#715A5A';
            } else {
                p.style.background = '#44444E';
            }
            particlesContainer.appendChild(p);
        }
    }

    // ─── NAV SCROLL ─────────────────────────────────────────
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('nav--scrolled', window.scrollY > 60);
    }, { passive: true });

    // ─── MOBILE TOGGLE ──────────────────────────────────────
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('.mobile-menu__link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // ─── SCROLL REVEAL ──────────────────────────────────────
    const revealTargets = document.querySelectorAll(
        '.card-servicio, .sobre-mi__grid, .sobre-mi__stats, .approach-steps, ' +
        '.skills__layout, .skills__categories, .proyecto, .articulo, .contacto__layout'
    );

    revealTargets.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );

    revealTargets.forEach(el => observer.observe(el));

    // Stagger card-servicio animations
    document.querySelectorAll('.card-servicio').forEach((card, i) => {
        card.style.transitionDelay = (i * 0.1) + 's';
    });

    // Stagger articulo animations
    document.querySelectorAll('.articulo').forEach((art, i) => {
        art.style.transitionDelay = (i * 0.1) + 's';
    });

    // ─── SMOOTH SCROLL ──────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const id = anchor.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ─── ACTIVE NAV LINK ────────────────────────────────────
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__link:not(.nav__link--cta)');

    const sectionObs = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        const isActive = link.getAttribute('href') === `#${id}`;
                        link.style.color = isActive ? 'var(--accent-light)' : '';
                    });
                }
            });
        },
        { threshold: 0.25, rootMargin: '-68px 0px -40% 0px' }
    );

    sections.forEach(s => sectionObs.observe(s));

    // ─── CONTACT FORM ───────────────────────────────────────
    // Para que funcione de verdad, conecta a Formspree, EmailJS,
    // o un script PHP en tu hosting.
    const form = document.getElementById('contactForm');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const original = btn.textContent;

        btn.textContent = 'Enviando...';
        btn.disabled = true;
        btn.style.opacity = '.6';

        // ── Conectar a servicio real ──
        // Ejemplo con Formspree:
        // fetch('https://formspree.io/f/TU_ID', {
        //     method: 'POST',
        //     body: new FormData(form),
        //     headers: { 'Accept': 'application/json' }
        // }).then(res => { ... })

        setTimeout(() => {
            btn.textContent = '¡Mensaje enviado! ✓';
            btn.style.opacity = '1';
            btn.style.background = '#4A6B5A';
            btn.style.borderColor = '#4A6B5A';
            form.reset();

            setTimeout(() => {
                btn.textContent = original;
                btn.disabled = false;
                btn.style.background = '';
                btn.style.borderColor = '';
            }, 3000);
        }, 1500);
    });

    // ─── SKILL TAG HOVER GLOW ───────────────────────────────
    document.querySelectorAll('.skill-tag').forEach(tag => {
        tag.addEventListener('mouseenter', () => {
            tag.style.textShadow = '0 0 20px rgba(113,90,90,0.4)';
        });
        tag.addEventListener('mouseleave', () => {
            tag.style.textShadow = '';
        });
    });
});
