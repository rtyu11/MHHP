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
const LOADER_SESSION_KEY = 'masato-loader-seen';
const LOADER_GLOBAL_KEY = 'masato-loader-global-seen';
const LOCAL_STORAGE_AVAILABLE = (() => {
    try {
        const key = '__masato-local-test';
        localStorage.setItem(key, key);
        localStorage.removeItem(key);
        return true;
    } catch (_) {
        return false;
    }
})();

function hasSeenLoader() {
    try {
        return sessionStorage.getItem(LOADER_SESSION_KEY) === 'true';
    } catch (_) {
        return false;
    }
}

function hasGlobalLoaderFlag() {
    if (!LOCAL_STORAGE_AVAILABLE) return true;
    try {
        return localStorage.getItem(LOADER_GLOBAL_KEY) === 'true';
    } catch (_) {
        return false;
    }
}

function markLoaderSeen() {
    try {
        sessionStorage.setItem(LOADER_SESSION_KEY, 'true');
    } catch (_) {
        // ignore
    }
    if (!LOCAL_STORAGE_AVAILABLE) return;
    try {
        localStorage.setItem(LOADER_GLOBAL_KEY, 'true');
    } catch (_) {
        // ignore
    }
}

function resetSessionLoaderFlag() {
    try {
        sessionStorage.removeItem(LOADER_SESSION_KEY);
    } catch (_) {
        // ignore
    }
}

function getNavigationType() {
    if (typeof performance === 'undefined') {
        return 'navigate';
    }
    try {
        const [entry] = performance.getEntriesByType('navigation') || [];
        if (entry && entry.type) {
            return entry.type;
        }
    } catch (_) {
        // ignore
    }
    if ('navigation' in performance) {
        switch (performance.navigation.type) {
            case 1:
                return 'reload';
            case 2:
                return 'back_forward';
            default:
                return 'navigate';
        }
    }
    return 'navigate';
}

function playHeroVideoIfAvailable(video) {
    if (!video) return;
    const playPromise = video.play?.();
    if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => { });
    }
}

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
    const navType = getNavigationType();
    if (navType === 'reload') {
        resetSessionLoaderFlag();
    }

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

    initLoader(navType);
    initCursor();
    initAnimations();
    initDistortionCanvas();
    initHamburgerMenu();
    initLogoScroll();
    fetchData();
    setupForm();
});

function initLoader(navType) {
    const loader = document.querySelector('.loader');
    if (!loader) return;
    const counterEl = document.querySelector('.loader-counter'); // 巨大な数字用
    const textEl = document.querySelector('.loader-text'); // 下部の小さいテキスト
    const flashImgEl = document.querySelector('.loader-flash');
    const heroVideo = document.querySelector('.hero-video');

    const seenSession = hasSeenLoader();
    const seenGlobal = hasGlobalLoaderFlag();
    const shouldSkipLoader = seenSession && seenGlobal && navType !== 'reload';
    if (shouldSkipLoader) {
        loader.style.display = 'none';
        document.body.classList.remove('is-loading');
        document.body.style.overflow = '';
        playHeroVideoIfAvailable(heroVideo);
        initHeroReveal();
        return;
    }

    const tl = gsap.timeline();

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
        playHeroVideoIfAvailable(heroVideo);

        // ローダーをクイックフェードアウト（カット的に）- さらに高速化
        gsap.to(loader, {
            opacity: 0,
            duration: 0.25,
            ease: "power3.out",
            onComplete: () => {
                loader.style.display = 'none';
                document.body.classList.remove('is-loading');
                document.body.style.overflow = '';
                markLoaderSeen();
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
    const moreWrapper = document.getElementById('news-more-wrapper');
    const moreBtn = document.getElementById('news-more-btn');
    if (!container) return;

    container.innerHTML = '';
    if (moreWrapper) moreWrapper.style.display = 'none';

    // Sort by date desc (newest first) - 最新が上
    items.sort((a, b) => {
        const da = new Date(a.date);
        const db = new Date(b.date);
        return db - da; // Descending (新しい順)
    });

    // 最初の5件と残りを分ける
    const initialItems = items.slice(0, 5);
    const remainingItems = items.slice(5);

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

    // 記事を生成する関数
    const createNewsItem = (item, isHidden = false) => {
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
        if (isHidden) {
            a.classList.add('news-item-hidden');
        }
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
        return a;
    };

    // 最初の5件を表示
    initialItems.forEach(item => {
        container.appendChild(createNewsItem(item, false));
    });

    // 残りのアイテムがあれば「もっと見る」ボタンを表示
    if (remainingItems.length > 0 && moreWrapper && moreBtn) {
        moreWrapper.style.display = 'block';
        
        // 残りのアイテムを非表示で追加
        remainingItems.forEach(item => {
            const hiddenItem = createNewsItem(item, true);
            container.appendChild(hiddenItem);
        });

        // 「もっと見る」ボタンのイベント（重複防止）
        // 既存のイベントリスナーを削除
        const newMoreBtn = moreBtn.cloneNode(true);
        moreBtn.parentNode.replaceChild(newMoreBtn, moreBtn);
        const currentMoreBtn = newMoreBtn;
        
        if (!currentMoreBtn.dataset.initialized) {
            currentMoreBtn.addEventListener('click', () => {
                const allItems = container.querySelectorAll('.news-item');
                const initialCount = initialItems.length;
                const expandedItems = Array.from(allItems).slice(initialCount);
                
                const isExpanded = currentMoreBtn.dataset.expanded === 'true';
                
                if (!isExpanded) {
                    // 展開
                    expandedItems.forEach(item => {
                        item.classList.remove('news-item-hidden');
                        gsap.fromTo(item, 
                            { opacity: 0, y: -20 },
                            { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
                        );
                    });
                    const textEl = currentMoreBtn.querySelector('.news-more-text');
                    const arrowEl = currentMoreBtn.querySelector('.news-more-arrow');
                    if (textEl) textEl.textContent = 'LESS';
                    if (arrowEl) arrowEl.textContent = '↑';
                    currentMoreBtn.dataset.expanded = 'true';
                } else {
                    // 折りたたみ
                    expandedItems.forEach(item => {
                        gsap.to(item, {
                            opacity: 0,
                            y: -20,
                            duration: 0.3,
                            ease: 'power2.in',
                            onComplete: () => {
                                item.classList.add('news-item-hidden');
                            }
                        });
                    });
                    const textEl = currentMoreBtn.querySelector('.news-more-text');
                    const arrowEl = currentMoreBtn.querySelector('.news-more-arrow');
                    if (textEl) textEl.textContent = 'MORE';
                    if (arrowEl) arrowEl.textContent = '↓';
                    currentMoreBtn.dataset.expanded = 'false';
                }
            });
            currentMoreBtn.dataset.initialized = 'true';
            currentMoreBtn.dataset.expanded = 'false';
        }
    }
}

function renderTicker(items) {
    const track = document.querySelector('.marquee-track');
    const section = document.querySelector('.marquee-section');
    if (!track || !section) return;

    // Clear existing static items
    track.innerHTML = '';

    if (items.length === 0) return;

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
            
            // Body text (separator is added via CSS ::after)
            let text = item.body || '';
            div.textContent = text;

            // Link handling
            if (item.link_url) {
                div.style.cursor = 'pointer';
                div.addEventListener('click', () => {
                    window.open(item.link_url, '_blank');
                });
            }
            
            track.appendChild(div);
        });
    }

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // No animation for reduced motion
        return;
    }

    // Start Animation
    // Re-implement the GSAP animation here
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const marqueeDuration = isMobile ? 25 : 35; // Slower, more elegant speed

    // Kill existing tweaks if any
    gsap.killTweensOf('.marquee-track');

    // Reset position cleanly
    gsap.set('.marquee-track', { xPercent: 0 });

    // Animation timeline for pause on hover/touch
    let animation = gsap.to('.marquee-track', {
        xPercent: -50, // Move by 50% of track width. Requires track to be wide enough (2 sets of content at least covering screen)
        // With 6 sets, 50% is 3 sets. 3 sets should definitely cover the screen width unless items are tiny and screen is huge.
        ease: 'none',
        duration: marqueeDuration,
        repeat: -1,
        force3D: true,
        lazy: false
    });

    // Pause on hover/touch
    let isPaused = false;
    const pauseAnimation = () => {
        if (!isPaused && animation) {
            animation.pause();
            isPaused = true;
        }
    };
    const resumeAnimation = () => {
        if (isPaused && animation) {
            animation.resume();
            isPaused = false;
        }
    };

    section.addEventListener('mouseenter', pauseAnimation);
    section.addEventListener('mouseleave', resumeAnimation);
    section.addEventListener('touchstart', pauseAnimation);
    section.addEventListener('touchend', resumeAnimation);
}

function setupForm() {
    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const statusEl = document.getElementById('form-status');
    if (!form || !submitBtn) return;

    const btnText = submitBtn.querySelector('.btn-text');
    const originalBtnText = btnText ? btnText.textContent.trim() : 'TRANSMIT';
    const maxMessageLength = 1000;
    const formLoadedAt = Date.now();
    const categoryField = form.querySelector('select[name="category"]');
    const messageField = form.querySelector('textarea[name="message"]');
    let isSubmitting = false;

    const setStatus = (state, message) => {
        if (!statusEl) return;
        statusEl.classList.remove('is-success', 'is-error', 'is-warning');
        if (state) statusEl.classList.add(`is-${state}`);
        statusEl.textContent = message || '';
    };

    const updatePlaceholder = () => {
        if (!messageField) return;
        const priority = messageField.dataset.placeholderPriority || '内容 / 希望時期 / 予算感（任意）';
        const fallback = messageField.dataset.placeholderDefault || 'ご用件をお書きください。';
        if (categoryField?.value === 'work') {
            messageField.placeholder = priority;
        } else {
            messageField.placeholder = fallback;
        }
    };

    updatePlaceholder();
    categoryField?.addEventListener('change', updatePlaceholder);

    const lastSubmitKey = 'masato-contact-last-submit';
    const getLastSubmit = () => {
        try {
            const value = localStorage.getItem(lastSubmitKey);
            return value ? Number(value) : 0;
        } catch (error) {
            return 0;
        }
    };

    const recordSubmit = () => {
        try {
            localStorage.setItem(lastSubmitKey, String(Date.now()));
        } catch (error) {
            // ignore
        }
    };

    const setButtonState = (sending) => {
        isSubmitting = sending;
        submitBtn.disabled = sending;
        if (sending) {
            submitBtn.setAttribute('aria-busy', 'true');
            if (btnText) btnText.textContent = '送信中...';
        } else {
            submitBtn.removeAttribute('aria-busy');
            if (btnText) btnText.textContent = originalBtnText;
        }
    };

    const payloadFromData = (data) => {
        return {
            name: data.get('name')?.trim() || '',
            email: data.get('email')?.trim() || '',
            message: data.get('message')?.trim() || '',
            category: data.get('category')?.trim() || '',
            website: data.get('website')?.trim() || '',
            timestamp: new Date().toISOString()
        };
    };

    const sendPost = async (payload) => {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('POST_FAILED');
        return res;
    };

    const sendGet = async (params) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}?${query}`);
        if (!res.ok) throw new Error('GET_FAILED');
        return res;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const now = Date.now();
        const formData = new FormData(form);
        const payload = payloadFromData(formData);

        if (!payload.category) {
            setStatus('error', 'お問い合わせ種別を選択してください。');
            return;
        }
        if (!payload.name) {
            setStatus('error', 'お名前を入力してください。');
            return;
        }
        if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
            setStatus('error', '有効なメールアドレスを入力してください。');
            return;
        }
        if (!payload.message) {
            setStatus('error', 'メッセージをご記入ください。');
            return;
        }
        if (payload.message.length > maxMessageLength) {
            setStatus('error', `メッセージは${maxMessageLength}文字以内にしてください。`);
            return;
        }
        if (payload.website) {
            setStatus('error', '送信できませんでした。');
            return;
        }

        const lastSubmit = getLastSubmit();
        if (lastSubmit && now - lastSubmit < 60_000) {
            setStatus('warning', '送信間隔を空けてください（1分ほど）。');
            return;
        }

        if (now - formLoadedAt < 3000) {
            setStatus('warning', 'ページ表示から3秒以上お待ちください。');
            return;
        }

        setButtonState(true);
        setStatus('', '');

        try {
            await sendPost(payload);
            recordSubmit();
            setStatus('success', 'ありがとうございます。自動返信はありませんが、追って担当よりご連絡いたします。');
            form.reset();
            updatePlaceholder();
        } catch (postError) {
            try {
                await sendGet(payload);
                recordSubmit();
                setStatus('success', 'ありがとうございます。自動返信はありませんが、追って担当よりご連絡いたします。');
                form.reset();
                updatePlaceholder();
            } catch (getError) {
                setStatus('error', '通信に失敗しました。時間をおいて再度お試しください。');
            }
        } finally {
            setButtonState(false);
        }
    });
}
