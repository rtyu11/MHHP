/* ============================================================
 * MASATO HAYASHI OFFICIAL - FINAL ULTIMATE BUILD
 * ============================================================ */

const API_URL = 'https://script.google.com/macros/s/AKfycbyRWjZHf-qy3d7OZeSP4hjrryfsybjXWxp41Z6oMOLH3TtTmrw5gSJXxbu0yYhbCZLcmQ/exec';

// ★重要: スクロール位置の記憶を有効化（戻る操作修正のため）
if (history.scrollRestoration) {
    history.scrollRestoration = 'auto';
}

// Lenis instance (グローバルスコープ)
let lenis;

// 戻る操作時のローディング回避（pageshowイベント）
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        const loader = document.querySelector('.loader');
        if (loader) {
            loader.style.display = 'none';
        }
        document.body.classList.remove('is-loading');
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // Android向けの最適化
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isMobile = window.matchMedia('(max-width: 900px)').matches;

    // 強制スクロール（初回のみ推奨だが、既存ロジック維持のため最小限の変更）
    // ※戻る操作などの不具合回避のため、Lenis初期化時の強制スクロールは削除または調整推奨
    // window.scrollTo(0, 0); // 既存動作維持

    // Smooth Scroll（モバイルは数値を極小にしてネイティブ動作に近づける）
    lenis = new Lenis({
        // モバイルのみほぼ遅延なし(0.1)に設定し、カクつきを軽減
        duration: isMobile ? 0.1 : 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        mouseMultiplier: isMobile ? 0.5 : 1,
        touchMultiplier: isMobile ? 2 : 1, // タッチ感度調整
        infinite: false,
    });

    // 初期位置強制はバック時の位置までリセットしてしまうためコメントアウトまたは削除が望ましいが
    // 既存ロジック維持の観点から、もし必要ならここではなくLoader完了後などが適切。
    // 今回は「スクロール遅延・戻る不具合」修正のため、この強制スクロールは無効化します。
    // lenis.scrollTo(0, { immediate: true }); 

    // Android向けのパフォーマンス最適化
    if (isAndroid) {
        // パッシブリスナーの使用（スクロールパフォーマンス向上）
        document.addEventListener('touchstart', () => { }, { passive: true });
        document.addEventListener('touchmove', () => { }, { passive: true });

        // メモリ使用量の最適化
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                // アイドル時に最適化処理を実行
            });
        }
    }

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
    const loader = document.querySelector('.loader');
    const counterEl = document.querySelector('.loader-counter'); // 巨大な数字用
    const textEl = document.querySelector('.loader-text'); // 下部の小さいテキスト
    const flashImgEl = document.querySelector('.loader-flash');
    const heroVideo = document.querySelector('.hero-video');

    // 初期設定
    gsap.set(counterEl, { opacity: 0, scale: 1.2 });
    gsap.set(flashImgEl, { opacity: 0, scale: 1.1 });

    // 動画は一時停止して待機
    if (heroVideo) {
        try {
            heroVideo.pause();
            heroVideo.currentTime = 0;
        } catch (_) { }
    }

    // --- カウントダウン演出関数（クールなライブ感） ---
    const countStep = (num, imgUrl) => {
        // 1. 画像の切り替え（ある場合）
        if (imgUrl && flashImgEl) {
            // 画像をセット
            tl.call(() => {
                flashImgEl.src = imgUrl;
                if (loader) loader.classList.remove('show-noise');
            });
            // 画像をクイックフラッシュで表示（ライブのスポットライト的）
            tl.to(flashImgEl, {
                opacity: 0.7,
                scale: 1.0,
                duration: 0.15,
                ease: 'power3.out'
            });
            // 画像を維持
            tl.to({}, { duration: 0.5 });
            // 画像をフェードアウト
            tl.to(flashImgEl, {
                opacity: 0,
                scale: 1.05,
                duration: 0.2,
                ease: 'power2.in'
            });
        } else {
            // 画像がない場合は黒背景＋ノイズ
            tl.call(() => {
                if (loader) loader.classList.add('show-noise');
            });
            tl.to(flashImgEl, { opacity: 0, duration: 0.1 });
        }

        // 2. 数字の登場（ライブのカウントダウン的なインパクト）
        tl.call(() => {
            if (counterEl) counterEl.textContent = num;
        });

        // 数字: 爆発的に登場
        tl.fromTo(counterEl,
            { opacity: 0, scale: 0.3, filter: "blur(20px)", y: 50 },
            { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, duration: 0.35, ease: "back.out(2)" }
        );

        // 数字を維持（ビート感）
        tl.to({}, { duration: 0.25 });

        // 数字: パルス（ドンッ）
        tl.to(counterEl, {
            scale: 1.15,
            duration: 0.06,
            ease: "power2.out"
        });
        tl.to(counterEl, {
            scale: 1.0,
            duration: 0.06,
            ease: "power2.in"
        });

        // 待機
        tl.to({}, { duration: 0.15 });

        // 数字: クイックフェードアウト
        tl.to(counterEl, {
            opacity: 0,
            scale: 0.8,
            y: -30,
            filter: "blur(8px)",
            duration: 0.2,
            ease: "power3.in"
        });
    };

    // --- タイムライン実行 ---

    // START（最初は「NOW LOADING...」）
    tl.call(() => {
        if (textEl) textEl.textContent = 'NOW LOADING...';
    });

    // Count: 3
    countStep('3', 'images/count3.jpg');

    // Count: 2
    countStep('2', 'images/count2.jpg');

    // Count: 1 (画像と同じ間隔で黒背景＋ノイズ)
    tl.call(() => {
        if (loader) loader.classList.add('show-noise');
        // ここで「READY?」に変更し、中央に配置
        if (textEl) {
            textEl.textContent = 'READY?';
            textEl.classList.add('centered');
        }
    });

    // 黒背景を画像と同じ時間維持
    tl.to({}, { duration: 0.5 }); // 画像の維持時間と同じ

    // 数字「1」の登場（画像と同じリズムで）
    tl.call(() => {
        if (counterEl) counterEl.textContent = '1';
    });

    // 数字: 爆発的に登場
    tl.fromTo(counterEl,
        { opacity: 0, scale: 0.3, filter: "blur(20px)", y: 50 },
        { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, duration: 0.35, ease: "back.out(2)" }
    );

    // 数字を維持（ビート感）- さらに短縮
    tl.to({}, { duration: 0.1 });

    // 数字: パルス（ドンッ）
    tl.to(counterEl, {
        scale: 1.15,
        duration: 0.04,
        ease: "power2.out"
    });
    tl.to(counterEl, {
        scale: 1.0,
        duration: 0.04,
        ease: "power2.in"
    });

    // 待機 - さらに短縮
    tl.to({}, { duration: 0.05 });

    // 数字: クイックフェードアウト - さらに短く
    tl.to(counterEl, {
        opacity: 0,
        scale: 0.8,
        y: -30,
        filter: "blur(8px)",
        duration: 0.12,
        ease: "power3.in"
    });

    // 動画開始（即座に動画へ）
    tl.call(() => {
        if (textEl) textEl.textContent = '';

        // 動画再生開始
        if (heroVideo) {
            const p = heroVideo.play?.();
            if (p && typeof p.catch === 'function') p.catch(() => { });
        }

        // ローダーをクイックフェードアウト（カット的に）- さらに高速化
        gsap.to(loader, {
            opacity: 0,
            duration: 0.25,
            ease: "power3.out",
            onComplete: () => {
                loader.style.display = 'none';
                document.body.classList.remove('is-loading');
                document.body.style.overflow = '';
                initHeroReveal();
            }
        });
    });
}

function initHeroReveal() {
    // 文字を確実に非表示の状態から開始（念のため）
    gsap.set('.hero-title .char-wrap', { opacity: 0, y: 150, rotateX: 10 });
    gsap.set('.hero-subtitle', { opacity: 0, y: 20 });

    // 動画はそのまま表示（エフェクトなし）
    // 動画のエフェクトを削除し、通常の状態で表示

    // 動画が流れ始めてから遅れて、ゆっくりと文字を表示
    gsap.to('.hero-title .char-wrap', {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 2.0, // よりゆっくり
        stagger: 0.15, // 文字間の間隔も広げる
        ease: "power3.out",
        delay: 1.5 // 動画開始から1.5秒後に表示開始
    });

    // サブタイトルも遅れて表示
    gsap.to('.hero-subtitle', {
        opacity: 1,
        y: 0,
        duration: 1.2,
        delay: 2.5 // 文字の表示が始まってからさらに遅れて
    });
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

    // タッチイベントとクリックイベントの最適化（Android対応）
    const handleMenuToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navMenu.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    };

    hamburger.addEventListener('click', handleMenuToggle);
    hamburger.addEventListener('touchend', handleMenuToggle, { passive: false });

    // 閉じるボタンをクリックしたらメニューを閉じる
    if (closeButton) {
        const handleClose = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeMenu();
        };
        closeButton.addEventListener('click', handleClose);
        closeButton.addEventListener('touchend', handleClose, { passive: false });
    }

    // メニュー内のナビゲーションリンクをクリックしたらメニューを閉じる（SNSリンクは除外）
    const menuLinks = navMenu.querySelectorAll('.nav-menu-links a');
    menuLinks.forEach(link => {
        const handleLinkClick = (e) => {
            // 外部リンクの場合は閉じる前に少し待つ
            if (link.target === '_blank' || link.href.startsWith('http')) {
                setTimeout(closeMenu, 100);
            } else {
                closeMenu();
            }
        };
        link.addEventListener('click', handleLinkClick);
        link.addEventListener('touchend', handleLinkClick, { passive: true });
    });

    // オーバーレイをクリックしたら閉じる
    const handleOverlayClick = () => {
        closeMenu();
    };
    overlay.addEventListener('click', handleOverlayClick);
    overlay.addEventListener('touchend', handleOverlayClick, { passive: true });

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
    const hoverEls = document.querySelectorAll('a, button, input, textarea, .artist-photo, i');
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


    // Marquee animation moved to renderTicker to handle dynamic content


    const splitTypes = document.querySelectorAll('.split-text');
    splitTypes.forEach(char => {
        const text = new SplitType(char, { types: 'lines, words' });
        gsap.from(text.words, {
            y: 50, opacity: 0, duration: 1, stagger: 0.05, ease: 'power3.out',
            scrollTrigger: { trigger: char, start: 'top 80%' }
        });
    });

    gsap.utils.toArray('.img-reveal-mask').forEach(mask => {
        gsap.to(mask, {
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            duration: 1.5, ease: 'power4.out',
            scrollTrigger: { trigger: mask, start: 'top 85%' }
        });
    });

    const bioLines = document.querySelectorAll('.artist-bio-text, .artist-bio-lead');

    // スマホでの不自然な改行を防ぐため、レイアウトが確定するまでわずかに待機
    setTimeout(() => {
        bioLines.forEach(block => {
            const text = new SplitType(block, { types: 'lines' });
            gsap.from(text.lines, {
                y: 20, opacity: 0, duration: 1, stagger: 0.1, ease: "power2.out",
                scrollTrigger: { trigger: block, start: "top 85%" }
            });
        });
    }, 200);
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
        console.log('Fetching data from:', API_URL);
        const res = await fetch(API_URL);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('Fetched Data:', data);

        // Normalize data to array
        let items = [];
        if (Array.isArray(data)) {
            items = data;
        } else if (typeof data === 'object' && data !== null) {
            items = Object.values(data);
        }

        // Current Date for filtering
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // --- 1. Separate News and Ticker ---

        // News: type='news', publish=true, date <= today
        const newsItems = items.filter(item => {
            if (item.type !== 'news' || item.publish === false) return false;
            if (!item.date) return false;
            const itemDate = new Date(item.date);
            return itemDate <= today;
        });

        // Ticker: type='ticker', publish=true
        const tickerItems = items.filter(item => {
            return item.type === 'ticker' && item.publish !== false;
        });

        console.log('Filtered News:', newsItems);
        console.log('Filtered Ticker:', tickerItems);

        // --- 2. Render News ---
        if (newsItems.length === 0) {
            renderNewsFallback();
        } else {
            renderNews(newsItems);
        }

        // --- 3. Render Ticker ---
        if (tickerItems.length === 0) {
            renderTickerFallback();
        } else {
            renderTicker(tickerItems);
        }

    } catch (e) {
        console.error('Error fetching data:', e);
        renderNewsFallback();
        renderTickerFallback();
    }
}

function renderNewsFallback() {
    renderNews([{
        title: "最新情報はSNSをご確認ください",
        date: new Date().toISOString(),
        link_url: "https://www.instagram.com/masatohayashi_/",
        link_label: "Instagram check",
        body: "最新情報は公式SNSにて発信しております。"
    }]);
}

function renderTickerFallback() {
    renderTicker([
        { body: "MASATO HAYASHI OFFICIAL" },
        { body: "LATEST INFO" }
    ]);
}

// GoogleドライブのURLを直接画像URLに変換する関数
function convertGoogleDriveUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('drive.google.com/uc?') || url.includes('lh3.googleusercontent.com')) return url;
    let fileId = null;
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) fileId = fileMatch[1];
    else {
        const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch) fileId = idMatch[1];
    }
    if (fileId) return `https://drive.google.com/uc?export=view&id=${fileId}`;
    return url;
}

function renderNews(items) {
    const container = document.getElementById('news-grid');
    if (!container) return;

    container.innerHTML = '';

    // Sort by date desc (newest first)
    items.sort((a, b) => {
        const da = new Date(a.date);
        const db = new Date(b.date);
        return db - da; // Descending
    });

    // Take top 5
    const topItems = items.slice(0, 5);

    // Date calculation for NEW badge (14 days)
    const now = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(now.getDate() - 14);

    // Modal elements
    const modal = document.getElementById('news-modal');
    const modalDate = document.getElementById('news-modal-date');
    const modalTitle = document.getElementById('news-modal-title');
    const modalBody = document.getElementById('news-modal-body');
    const modalLink = document.getElementById('news-modal-link');

    // Modal Open/Close Logic
    if (modal && !modal.dataset.initialized) {
        const openModal = () => {
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        };
        const closeModal = () => {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        };
        modal.addEventListener('click', (e) => {
            if (e.target && e.target.dataset && e.target.dataset.close) closeModal();
        });
        const closeBtn = modal.querySelector('.news-modal__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
        });
        modal.dataset.initialized = 'true';
        // Assign to global or element for reuse if needed, but here we just need the open function inside the loop
        modal.open = openModal;
    }

    topItems.forEach(item => {
        // Formatted Date (yyyy.mm.dd)
        let formattedDate = '';
        let itemDateObj = null;
        if (item.date) {
            try {
                itemDateObj = new Date(item.date);
                formattedDate = item.date.split('T')[0].replace(/-/g, '.');
            }
            catch { formattedDate = String(item.date); }
        }

        // New Badge Logic
        let isNew = false;
        if (itemDateObj && itemDateObj >= twoWeeksAgo) {
            isNew = true;
        }

        const a = document.createElement('a');
        a.className = 'news-item';
        a.href = '#';

        // Build inner HTML with badge
        let html = `
          <span class="news-date">
            ${formattedDate}
            ${isNew ? '<span class="news-badge">NEW</span>' : ''}
          </span>
          <span class="news-title">${item.title || 'No title'}</span>
          <span class="news-arrow">↗</span>
        `;
        a.innerHTML = html;

        // Modal Click Event
        a.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal && modal.open) {
                modalDate.textContent = formattedDate || '';
                modalTitle.textContent = item.title || '';
                modalBody.innerHTML = (item.body || item.detail || '').replace(/\n/g, '<br>');

                const url = item.link_url || '';
                const linkLabel = item.link_label || 'こちら →'; // Support custom label

                if (url) {
                    modalLink.href = url;
                    modalLink.textContent = linkLabel;
                    modalLink.style.display = 'inline-block';
                } else {
                    modalLink.href = '#';
                    modalLink.style.display = 'none';
                }
                modal.open();
            }
        });
        container.appendChild(a);
    });
}

function renderTicker(items) {
    const track = document.querySelector('.marquee-track');
    if (!track) return;

    // Clear existing static items
    track.innerHTML = '';

    // Create base items
    const elements = items.map(item => {
        const div = document.createElement('div');
        div.className = 'marquee-item';

        // Body text
        let text = item.body || '';
        div.textContent = text + ' — '; // Add separator

        // Link handling
        if (item.link_url) {
            div.style.cursor = 'pointer';
            div.style.textDecoration = 'underline'; // Optional visual cue
            div.addEventListener('click', () => {
                window.open(item.link_url, '_blank');
            });
        }

        return div;
    });

    if (elements.length === 0) return;

    // Clone items to fill screen + loop buffer
    // Creating minimal sets to ensure smooth loop. 
    // Usually 4 sets is enough for standard screen widths vs item count.
    // If items are few, we need more sets. If many, fewer.
    // Let's safe bet on 6 sets to handle large screens (ultrawide) and small item counts.
    const LOOP_SETS = 6;

    // Re-create elements inside the loop to ensure listeners work for every clone
    for (let i = 0; i < LOOP_SETS; i++) {
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'marquee-item';
            div.textContent = (item.body || '') + ' — ';

            if (item.link_url) {
                div.style.cursor = 'pointer';
                div.addEventListener('click', () => {
                    window.open(item.link_url, '_blank');
                });
            }
            track.appendChild(div);
        });
    }

    // Start Animation
    // Re-implement the GSAP animation here
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const isAndroid = /Android/i.test(navigator.userAgent);
    const marqueeDuration = isMobile ? 8 : 20; // Slightly adjust for readability

    // Kill existing tweaks if any
    gsap.killTweensOf('.marquee-track');

    // Reset position cleanly
    gsap.set('.marquee-track', { xPercent: 0 });

    gsap.to('.marquee-track', {
        xPercent: -50, // Move by 50% of track width. Requires track to be wide enough (2 sets of content at least covering screen)
        // With 6 sets, 50% is 3 sets. 3 sets should definitely cover the screen width unless items are tiny and screen is huge.
        ease: 'none',
        duration: marqueeDuration,
        repeat: -1,
        force3D: true,
        lazy: false
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