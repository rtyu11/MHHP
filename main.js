/* ============================================================
 * MASATO HAYASHI OFFICIAL - FINAL ULTIMATE BUILD
 * ============================================================ */

const API_URL = 'YOUR_GAS_DEPLOYMENT_URL_HERE';

// ★重要: スクロール位置の記憶を無効化
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}

// Lenis instance (グローバルスコープ)
let lenis;

document.addEventListener("DOMContentLoaded", () => {

    // 強制的に一番上へ
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.body.style.overflow = 'hidden';

    // Smooth Scroll
    lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        mouseMultiplier: 1,
    });
    lenis.scrollTo(0, { immediate: true });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    gsap.registerPlugin(ScrollTrigger);

    initLoader();
    initCursor();
    initAnimations();
    initDistortionCanvas();
    initHamburgerMenu();
    initLogoScroll();
    fetchData();
    setupForm();
});

function initLoader() {
    const tl = gsap.timeline();
    const counter = { val: 0 };

    tl.to(counter, {
        val: 100, duration: 2.5, ease: "expo.inOut",
        onUpdate: () => {
            document.querySelector('.loader-counter').textContent = Math.floor(counter.val).toString().padStart(3, '0');
        }
    });

    tl.to('.loader', {
        yPercent: -100, duration: 1.2, ease: "power4.inOut",
        onStart: () => {
            document.body.classList.remove('is-loading');
            initHeroReveal();
            document.body.style.overflow = '';
        }
    });
}

function initHeroReveal() {
    gsap.fromTo('.hero-video',
        { scale: 1.2, filter: 'brightness(0)' },
        { scale: 1, filter: 'brightness(0.7) contrast(1.1)', duration: 2.0, ease: "power2.out" }
    );
    gsap.from('.hero-title .char-wrap', {
        y: 150, opacity: 0, rotateX: 10, duration: 1.5, stagger: 0.1, ease: "power3.out", delay: 0.5
    });
    gsap.to('.hero-subtitle', { opacity: 1, y: 0, duration: 1, delay: 1.0 });
}

function initLogoScroll() {
    const logo = document.querySelector('.nav-logo');
    if (!logo) return;
    
    logo.addEventListener('click', (e) => {
        e.preventDefault();
        const heroSection = document.getElementById('hero');
        if (heroSection && lenis) {
            lenis.scrollTo(heroSection, {
                duration: 1.5,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                offset: 0
            });
        } else if (heroSection) {
            // Lenisが初期化されていない場合のフォールバック
            heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburger-menu');
    const navMenu = document.getElementById('nav-menu');
    const overlay = document.getElementById('menu-overlay');
    const closeButton = document.getElementById('nav-menu-close');
    
    if (!hamburger || !navMenu || !overlay) return;
    
    function closeMenu() {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function openMenu() {
        hamburger.classList.add('active');
        navMenu.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navMenu.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // 閉じるボタンをクリックしたらメニューを閉じる
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeMenu();
        });
    }
    
    // メニュー内のナビゲーションリンクをクリックしたらメニューを閉じる（SNSリンクは除外）
    const menuLinks = navMenu.querySelectorAll('.nav-menu-links a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
        });
    });
    
    // オーバーレイをクリックしたら閉じる
    overlay.addEventListener('click', () => {
        closeMenu();
    });
    
    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });
}

function initCursor() {
    if (window.matchMedia('(max-width: 900px)').matches) return;
    const dot = document.querySelector('.cursor-dot');
    const circle = document.querySelector('.cursor-circle');

    window.addEventListener('mousemove', (e) => {
        gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1 });
        gsap.to(circle, { x: e.clientX, y: e.clientY, duration: 0.5, ease: "power2.out" });
    });

    // FontAwesomeのアイコンもホバー対象に追加
    const hoverEls = document.querySelectorAll('a, button, input, textarea, .news-item, .artist-photo, i');
    hoverEls.forEach(el => {
        el.addEventListener('mouseenter', () => {
            document.body.classList.add('hovered');
            gsap.to(circle, { scale: 1.5 });
        });
        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('hovered');
            gsap.to(circle, { scale: 1 });
        });
    });
}

function initAnimations() {
    gsap.to('.hero-bg-container', {
        yPercent: 30, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    gsap.to('.marquee-track', { xPercent: -50, ease: 'none', duration: 15, repeat: -1 });

    const splitTypes = document.querySelectorAll('.split-text');
    splitTypes.forEach(char => {
        const text = new SplitType(char, { types: 'lines, words' });
        gsap.from(text.words, {
            y: 50, opacity: 0, duration: 1, stagger: 0.05, ease: 'power3.out',
            scrollTrigger: { trigger: char, start: 'top 80%' }
        });
    });

    gsap.to('.img-reveal-mask', {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        duration: 1.5, ease: 'power4.out',
        scrollTrigger: { trigger: '.artist-img-wrapper', start: 'top 75%' }
    });

    const bioLines = document.querySelectorAll('.artist-bio-text, .artist-bio-lead');
    bioLines.forEach(block => {
        const text = new SplitType(block, { types: 'lines' });
        gsap.from(text.lines, {
            y: 20, opacity: 0, duration: 1, stagger: 0.1, ease: "power2.out",
            scrollTrigger: { trigger: block, start: "top 85%" }
        });
    });
}

function initDistortionCanvas() {
    const canvas = document.getElementById('distortionCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    function resize() {
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    function draw() {
        const w = width; const h = height;
        const idata = ctx.createImageData(w, h);
        const buffer32 = new Uint32Array(idata.data.buffer);
        for (let i = 0; i < buffer32.length; i++) {
            if (Math.random() < 0.005) buffer32[i] = 0xffffffff;
            else if (Math.random() < 0.02) buffer32[i] = 0xff111111;
        }
        ctx.putImageData(idata, 0, 0);
        requestAnimationFrame(draw);
    }
    draw();

    gsap.from('.statement-text', {
        y: 50, opacity: 0, duration: 1.5, ease: 'power3.out',
        scrollTrigger: { trigger: '.visual-break', start: 'center 70%' }
    });
}

async function fetchData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const newsItems = data.filter(item => item.type === 'news' && item.publish);
        renderNews(newsItems);
    } catch (e) {
        renderNews([
            { title: "RAPSTAR 2025 - FINAL STAGE RESULT", date: "2025-03-25", link_url: "#" },
            { title: "NEW SINGLE 'SILENCE' OUT NOW", date: "2025-02-14", link_url: "#" },
            { title: "LIVE TOUR 2025 ANNOUNCEMENT", date: "2025-01-10", link_url: "#" }
        ]);
    }
}

function renderNews(items) {
    const container = document.getElementById('news-grid');
    container.innerHTML = '';
    const defaultImage = 'images/info-bg.jpg';
    items.forEach(item => {
        const a = document.createElement('a');
        a.className = 'news-item';
        a.href = item.link_url || '#';
        a.target = item.link_url ? '_blank' : '_self';
        a.dataset.img = item.image_url || defaultImage;
        a.innerHTML = `
            <span class="news-date">${item.date.split('T')[0].replace(/-/g, '.')}</span>
            <span class="news-title">${item.title}</span>
            <span class="news-arrow">↗</span>
        `;
        a.addEventListener('mouseenter', () => {
            const imgContainer = document.querySelector('.hover-reveal-img');
            imgContainer.style.backgroundImage = `url(${a.dataset.img})`;
            gsap.to(imgContainer, { opacity: 1, scale: 1, duration: 0.3 });
        });
        a.addEventListener('mousemove', (e) => {
            const imgContainer = document.querySelector('.hover-reveal-img');
            gsap.to(imgContainer, { x: e.clientX, y: e.clientY, duration: 0.5, ease: 'power3.out' });
        });
        a.addEventListener('mouseleave', () => {
            const imgContainer = document.querySelector('.hover-reveal-img');
            gsap.to(imgContainer, { opacity: 0, scale: 0.8, duration: 0.3 });
        });
        container.appendChild(a);
    });
}

function setupForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        const btnText = btn.querySelector('.btn-text');
        const originalText = btnText.textContent;
        btnText.textContent = 'SENDING...';
        btn.style.opacity = '0.5';
        setTimeout(() => {
            btnText.textContent = 'SENT';
            btn.style.opacity = '1';
            form.reset();
            setTimeout(() => btnText.textContent = originalText, 3000);
        }, 1500);
    });
}