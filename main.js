/* ============================================================
 * MASATO HAYASHI OFFICIAL - FINAL ULTIMATE BUILD
 * ============================================================ */

const API_URL = 'https://script.google.com/macros/s/AKfycbyRWjZHf-qy3d7OZeSP4hjrryfsybjXWxp41Z6oMOLH3TtTmrw5gSJXxbu0yYhbCZLcmQ/exec';

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
        } catch (_) {}
    }

    // --- カウントダウン演出関数（クールなライブ感） ---
    const countStep = (num, imgUrl) => {
        // 1. 画像の切り替え（ある場合）
        if (imgUrl && flashImgEl) {
            // 画像をセット
            tl.call(() => { 
                flashImgEl.src = imgUrl;
                if(loader) loader.classList.remove('show-noise');
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
                if(loader) loader.classList.add('show-noise');
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
        if(loader) loader.classList.add('show-noise');
        // ここで「READY?」に変更し、中央に配置
        if(textEl) {
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
            if (p && typeof p.catch === 'function') p.catch(() => {});
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

    // マーキーアニメーション（スマホでは速く、デスクトップでは通常速度）
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const marqueeDuration = isMobile ? 7 : 15;
    gsap.to('.marquee-track', { xPercent: -50, ease: 'none', duration: marqueeDuration, repeat: -1 });

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
        const res = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        
        // レスポンスのテキストを取得（エラーメッセージの確認のため）
        const responseText = await res.text();
        console.log('Raw API Response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            // JSONパースエラーの場合、エラーメッセージが含まれている可能性
            console.error('JSON parse error:', parseError);
            console.error('Response text:', responseText);
            throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        }
        
        console.log('Parsed API Response:', data);
        
        // エラーレスポンスのチェック
        if (data.error || data.message) {
            console.error('API returned error:', data.error || data.message);
            throw new Error(data.error || data.message || 'API returned an error');
        }
        
        if (!Array.isArray(data)) {
            console.warn('API response is not an array, attempting to convert...');
            // オブジェクトの場合、配列に変換を試みる
            if (typeof data === 'object' && data !== null) {
                data = Object.values(data);
            } else {
                throw new Error('API response is not an array or object');
            }
        }
        
        const newsItems = data.filter(item => {
            // publishプロパティが存在しない場合は表示する
            if (item.type === 'news') {
                return item.publish !== false; // publishがfalseでない限り表示
            }
            return false;
        });
        console.log('Filtered news items:', newsItems);
        
        if (newsItems.length === 0) {
            console.warn('No news items found. Using fallback data.');
            renderNews([
                { title: "RAPSTAR 2025 - FINAL STAGE RESULT", date: "2025-03-25", link_url: "#", body: "Final stage results are in. Check the details." },
                { title: "NEW SINGLE 'SILENCE' OUT NOW", date: "2025-02-14", link_url: "#", body: "New single 'SILENCE' is available on all platforms." },
                { title: "LIVE TOUR 2025 ANNOUNCEMENT", date: "2025-01-10", link_url: "#", body: "Live tour 2025 has been announced. Tickets on sale soon." }
            ]);
        } else {
            renderNews(newsItems);
        }
    } catch (e) {
        console.error('Error fetching news data:', e);
        console.error('Error details:', {
            message: e.message,
            stack: e.stack,
            API_URL: API_URL
        });
        // エラー時はフォールバックデータを表示
        renderNews([
            { title: "RAPSTAR 2025 - FINAL STAGE RESULT", date: "2025-03-25", link_url: "#", body: "Final stage results are in. Check the details." },
            { title: "NEW SINGLE 'SILENCE' OUT NOW", date: "2025-02-14", link_url: "#", body: "New single 'SILENCE' is available on all platforms." },
            { title: "LIVE TOUR 2025 ANNOUNCEMENT", date: "2025-01-10", link_url: "#", body: "Live tour 2025 has been announced. Tickets on sale soon." }
        ]);
    }
}

// GoogleドライブのURLを直接画像URLに変換する関数
function convertGoogleDriveUrl(url) {
    if (!url || typeof url !== 'string') return url;
    
    // 既に直接画像URLの形式の場合はそのまま返す
    if (url.includes('drive.google.com/uc?') || url.includes('lh3.googleusercontent.com')) {
        return url;
    }
    
    // Googleドライブの共有リンクからファイルIDを抽出
    // 形式: https://drive.google.com/file/d/FILE_ID/view または
    //      https://drive.google.com/open?id=FILE_ID
    let fileId = null;
    
    // /file/d/FILE_ID/ の形式
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
        fileId = fileMatch[1];
    } else {
        // ?id=FILE_ID の形式
        const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch) {
            fileId = idMatch[1];
        }
    }
    
    // ファイルIDが見つかった場合、直接画像URLに変換
    if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    // 変換できない場合は元のURLを返す
    return url;
}

function renderNews(items) {
  const container = document.getElementById('news-grid');
  if (!container) return;

  container.innerHTML = '';

  // モーダル要素
  const modal = document.getElementById('news-modal');
  const modalDate = document.getElementById('news-modal-date');
  const modalTitle = document.getElementById('news-modal-title');
  const modalBody = document.getElementById('news-modal-body');
  const modalLink = document.getElementById('news-modal-link');

  if (!modal) return;

  // 開閉
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

  // 既にイベントがある前提で多重登録を避けたいなら、ここは一回だけにする
  // ※fetchDataが何度も呼ばれる場合はここを外部に出すのがベターですが、
  // 現状に合わせて関数内で完結させる場合は、古いリスナーを消すか、
  // bodyに委譲するか、一度だけ登録されるようにガードします。
  if (!modal.dataset.initialized) {
    modal.addEventListener('click', (e) => {
        if (e.target && e.target.dataset && e.target.dataset.close) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
    modal.dataset.initialized = 'true';
  }

  items.forEach(item => {
    // 日付整形
    let formattedDate = '';
    if (item.date) {
      try { formattedDate = item.date.split('T')[0].replace(/-/g, '.'); }
      catch { formattedDate = String(item.date); }
    }

    // 一覧の行（今のデザインに合わせて a.news-item を維持）
    const a = document.createElement('a');
    a.className = 'news-item';
    a.href = '#'; // ページ遷移はさせない
    a.innerHTML = `
      <span class="news-date">${formattedDate}</span>
      <span class="news-title">${item.title || 'No title'}</span>
      <span class="news-arrow">↗</span>
    `;

    // クリックでモーダルに流し込む
    a.addEventListener('click', (e) => {
      e.preventDefault();

      modalDate.textContent = formattedDate || '';
      modalTitle.textContent = item.title || '';

      // 詳細本文：スプレッドシートに detail/body みたいな列が無いなら空でOK
      // もし列名を増やすなら item.body / item.detail / item.description などに合わせる
      const detailText = item.body || item.detail || item.description || '';
      modalBody.textContent = detailText;

      // URLリンク：無いなら非表示
      const url = item.link_url || '';
      if (url) {
        modalLink.href = url;
        modalLink.style.display = 'inline-block';
      } else {
        modalLink.href = '#';
        modalLink.style.display = 'none';
      }

      openModal();
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