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
        // Android向けにさらに最適化：durationを極小にしてネイティブスクロールに近づける
        duration: isAndroid ? 0.05 : (isMobile ? 0.1 : 1.5),
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true, // smoothは有効のまま、durationで調整
        mouseMultiplier: isMobile ? 0.5 : 1,
        touchMultiplier: isAndroid ? 1.5 : (isMobile ? 2 : 1), // Android向けにタッチ感度を調整
        infinite: false,
        // Android向けのパフォーマンス最適化
        wheelMultiplier: isAndroid ? 0.5 : 1,
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
    initLanguageSwitcher();
    initVideoOptimization(); // 動画最適化を追加
    initSectionNavigation(); // セクションナビゲーション初期化
    fetchData();
    initLandingDiscography();
    setupForm();
});

// Language Switcher
const translations = {
    ja: {
        nav: {
            artist: 'ARTIST',
            info: 'INFORMATION',
            contact: 'CONTACT'
        },
        artist: {
            title: 'ARTIST',
            bio: {
                1: '東京都八王子市出身のヒップホップ・アーティスト。',
                2: '2017年より Pablo Blasta 名義で活動を開始。「Tokyo Young OG」や、DJ CHARI & DJ TATSUKI「ビッチと会う feat. Weny Dacillo, Pablo Blasta & JP THE WAVY」、「Good Die Young feat. RYKEY & Pablo Blasta」などへの客演参加をきっかけに頭角を現す。',
                3: '2019年に一度活動を休止するも、約2年の沈黙を経て2021年に Masato Hayashi として活動を再開。2022年2月にはシングル『やるしかねえ (feat. ELIONE & CHICO CARLITO)』をリリースし、Spotify Viral 50にランクイン。',
                4: '2025年1月には、前年にリリースされバイラルヒットとなった「By Your Side (feat. 唾奇 & ELIONE)」を収録した3rdアルバム『1』、そして強烈なエネルギーで話題を呼んだ「Vibes!」を収録した4thアルバム『MELANISM』の2作品を携え、J-HIPHOPの聖地・HARLEMにてワンマンライブを成功させた。',
                5: 'また、ABEMA『RAPSTAR 2025』では、約6,780人の応募者の中からファイナルステージへ進出。惜しくも準優勝となったが、圧倒的なバイブスと研ぎ澄まされたスピード感あふれるラップスキル、そして観客を巻き込むライブパフォーマンスで強烈なインパクトを残し、シーン内外から大きな注目を集めた。',
                6: '往年のロックスターを彷彿とさせる、ハスキーで艶のある唯一無二のボーカル。力強さの中に痛みや哀愁を感じさせるメロディアスかつスキルフルなラップ。そして、生々しくも繊細に心情を描き出すリリック——。',
                7: 'すべてにおいて"Masato Hayashi"でしか成し得ない存在感を放ち、今もっとも飛躍が期待されるアーティストの一人として注目を集めている。'
            }
        },
        info: {
            title: 'INFORMATION',
            subtitle: 'お知らせ'
        },
        news: {
            more: 'MORE'
        },
        contact: {
            title: 'CONTACT',
            subtitle: 'お問い合わせ',
            desc: 'お仕事のご依頼・各種お問い合わせはこちらからご連絡ください。'
        },
        form: {
            category: {
                label: 'お問い合わせ種別',
                placeholder: '▾ 選択してください',
                work: '仕事依頼',
                appearance: '出演依頼',
                inquiry: 'お問い合わせ',
                other: 'その他'
            },
            name: {
                label: 'お名前'
            },
            submit: '送信'
        }
    },
    en: {
        nav: {
            artist: 'ARTIST',
            info: 'INFORMATION',
            contact: 'CONTACT'
        },
        artist: {
            title: 'ARTIST',
            bio: {
                1: 'Hip-hop artist from Hachioji, Tokyo.',
                2: 'Started his career in 2017 under the name Pablo Blasta. Gained recognition through guest appearances on tracks such as "Tokyo Young OG" and DJ CHARI & DJ TATSUKI\'s "ビッチと会う feat. Weny Dacillo, Pablo Blasta & JP THE WAVY" and "Good Die Young feat. RYKEY & Pablo Blasta".',
                3: 'After a brief hiatus in 2019, Masato Hayashi resumed activities in 2021. In February 2022, he released the single "やるしかねえ (feat. ELIONE & CHICO CARLITO)", which charted on Spotify Viral 50.',
                4: 'In January 2025, he successfully held a one-man live show at HARLEM, the sacred ground of J-HIPHOP, with two albums: the 3rd album "1" featuring the viral hit "By Your Side (feat. 唾奇 & ELIONE)" released the previous year, and the 4th album "MELANISM" featuring "Vibes!", which generated buzz with its intense energy.',
                5: 'Additionally, in ABEMA\'s "RAPSTAR 2025", he advanced to the final stage from approximately 6,780 applicants. Although he finished as runner-up, he left a strong impact with his overwhelming vibe, refined rap skills with sharp speed, and live performances that captivated the audience, attracting significant attention both within and outside the scene.',
                6: 'A unique vocal style reminiscent of rock stars of the past—husky and lustrous. Melodic and skillful rap that conveys pain and melancholy within its strength. Lyrics that vividly and delicately depict emotions—.',
                7: 'He exudes a presence that only "Masato Hayashi" can achieve in every aspect, and is attracting attention as one of the artists most expected to make a breakthrough.'
            }
        },
        info: {
            title: 'INFORMATION',
            subtitle: 'News'
        },
        news: {
            more: 'MORE'
        },
        contact: {
            title: 'CONTACT',
            subtitle: 'Contact',
            desc: 'For work inquiries and other inquiries, please contact us here.'
        },
        form: {
            category: {
                label: 'Inquiry Type',
                placeholder: '▾ Please select',
                work: 'Work Request',
                appearance: 'Performance Request',
                inquiry: 'Inquiry',
                other: 'Other'
            },
            name: {
                label: 'Name'
            },
            submit: 'Send'
        }
    }
};

let currentLang = 'ja';

function initLanguageSwitcher() {
    const langJaBtn = document.getElementById('lang-ja');
    const langEnBtn = document.getElementById('lang-en');
    
    if (!langJaBtn || !langEnBtn) return;
    
    // Load saved language preference
    try {
        const savedLang = localStorage.getItem('masato-lang');
        if (savedLang && (savedLang === 'ja' || savedLang === 'en')) {
            currentLang = savedLang;
        }
    } catch (_) {
        // ignore
    }
    
    // Set initial language
    updateLanguage(currentLang);
    updateLanguageButtons();
    
    // Event listeners
    const handleLangSwitch = (lang) => {
        return (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchLanguage(lang);
        };
    };
    
    langJaBtn.addEventListener('click', handleLangSwitch('ja'));
    langJaBtn.addEventListener('touchend', handleLangSwitch('ja'), { passive: false });
    
    langEnBtn.addEventListener('click', handleLangSwitch('en'));
    langEnBtn.addEventListener('touchend', handleLangSwitch('en'), { passive: false });
}

function switchLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    
    // Save preference
    try {
        localStorage.setItem('masato-lang', lang);
    } catch (_) {
        // ignore
    }
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    updateLanguage(lang);
    updateLanguageButtons();
}

function updateLanguageButtons() {
    const langJaBtn = document.getElementById('lang-ja');
    const langEnBtn = document.getElementById('lang-en');
    
    if (langJaBtn) {
        langJaBtn.classList.toggle('active', currentLang === 'ja');
    }
    if (langEnBtn) {
        langEnBtn.classList.toggle('active', currentLang === 'en');
    }
}

function updateLanguage(lang) {
    const t = translations[lang];
    if (!t) return;
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const value = getNestedValue(t, key);
        if (value !== undefined) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = value;
            } else if (el.tagName === 'OPTION') {
                el.textContent = value;
            } else {
                el.textContent = value;
            }
        }
    });
    
    // Update form placeholders
    const messageField = document.querySelector('textarea[name="message"]');
    if (messageField) {
        const categoryField = document.querySelector('select[name="category"]');
        const priority = lang === 'ja' ? '内容 / 希望時期 / 予算感（任意）' : 'Content / Preferred Date / Budget (Optional)';
        const fallback = lang === 'ja' ? 'ご用件をお書きください。' : 'Please write your inquiry.';
        if (categoryField?.value === 'work') {
            messageField.placeholder = priority;
        } else {
            messageField.placeholder = fallback;
        }
    }
    
    // Update select placeholder option
    const selectPlaceholder = document.querySelector('select[name="category"] option[value=""]');
    if (selectPlaceholder) {
        const placeholderText = lang === 'ja' ? '▾ 選択してください' : '▾ Please select';
        selectPlaceholder.textContent = placeholderText;
    }
    
    // Update news items if they exist
    updateNewsItemsLanguage(lang);
}

function updateNewsItemsLanguage(lang) {
    const newsItems = document.querySelectorAll('.news-item');
    newsItems.forEach(itemEl => {
        try {
            const storedItem = JSON.parse(itemEl.dataset.newsItem || '{}');
            if (!storedItem || Object.keys(storedItem).length === 0) return;
            
            // Get localized title
            const getLocalizedTitle = (item) => {
                if (lang === 'en' && item.title_en) {
                    return item.title_en;
                }
                return item.title || 'No title';
            };
            
            const title = getLocalizedTitle(storedItem);
            const titleEl = itemEl.querySelector('.news-title');
            if (titleEl) {
                titleEl.textContent = title;
            }
        } catch (e) {
            console.warn('Failed to update news item language:', e);
        }
    });
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
}

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
    // 文字を確実に非表示の状態から開始
    // 3D回転は字面の欠け/クリップに繋がりやすいので使わず、シンプルに表示する
    gsap.set('.hero-title .char-wrap', { opacity: 0, y: 36 });
    gsap.set('.hero-subtitle', { opacity: 0, y: 16 });

    // 動画はそのまま表示（エフェクトなし）
    // 動画のエフェクトを削除し、通常の状態で表示

    // MasatoとHayashiを個別にアニメーション（ゆっくりと余裕のある感じ）
    gsap.fromTo(
        '.hero-title .char-wrap[data-word="masato"]',
        { opacity: 0, y: 36 },
        {
            opacity: 1,
            y: 0,
            duration: 3.2, // 余裕のあるスピード
            ease: "power2.out",
            delay: 2.0,
            overwrite: 'auto'
        }
    );

    // HayashiはMasatoより少し遅れて表示
    gsap.fromTo(
        '.hero-title .char-wrap[data-word="hayashi"]',
        { opacity: 0, y: 36 },
        {
            opacity: 1,
            y: 0,
            duration: 3.2,
            ease: "power2.out",
            delay: 2.6, // 少しだけずらす
            overwrite: 'auto'
        }
    );

    // サブタイトルも遅れて表示（文字が背景に溶け込まないようにopacityを確実に1にする）
    gsap.fromTo(
        '.hero-subtitle',
        { opacity: 0, y: 16 },
        {
            opacity: 1,
            y: 0,
            duration: 1.8,
            ease: "power2.out",
            delay: 3.8,
            overwrite: 'auto'
        }
    );
}

function initVideoOptimization() {
    const heroVideo = document.querySelector('.hero-video');
    if (!heroVideo) return;

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isMobile = window.matchMedia('(max-width: 900px)').matches;

    // Android向けの動画最適化
    if (isAndroid || isMobile) {
        // IntersectionObserverでビューポート外で動画を一時停止
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // ビューポート内に入ったら再生
                    if (heroVideo.paused) {
                        const playPromise = heroVideo.play();
                        if (playPromise && typeof playPromise.catch === 'function') {
                            playPromise.catch(() => { });
                        }
                    }
                } else {
                    // ビューポート外に出たら一時停止（パフォーマンス向上）
                    if (!heroVideo.paused) {
                        heroVideo.pause();
                    }
                }
            });
        }, {
            threshold: 0.1, // 10%以上見えている場合に再生
            rootMargin: '50px' // 少し余裕を持たせる
        });

        observer.observe(heroVideo);

        // スクロール時の動画品質を下げる（Android向け）
        if (isAndroid) {
            // 動画のpreloadをnoneにして初期読み込みを軽量化
            heroVideo.setAttribute('preload', 'none');
            
            // スクロール中は動画の更新を抑制
            let isScrolling = false;
            let scrollTimeout;
            
            const handleScroll = () => {
                if (!isScrolling) {
                    isScrolling = true;
                    // スクロール中は動画の更新を抑制
                    heroVideo.style.willChange = 'auto';
                }
                
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    isScrolling = false;
                    heroVideo.style.willChange = 'transform';
                }, 150);
            };

            // Lenisのスクロールイベントに最適化
            if (lenis) {
                lenis.on('scroll', handleScroll);
            } else {
                window.addEventListener('scroll', handleScroll, { passive: true });
            }
        }
    }
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

// セクションへのスクロール関数（グローバルスコープ）
function showSection(sectionId) {
    const targetSection = document.getElementById(sectionId);
    
    if (!targetSection) return;
    
    // スムーズスクロールで該当セクションへ移動（すべてのセクションは表示したまま）
    if (lenis) {
        lenis.scrollTo(targetSection, {
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            offset: 0
        });
    } else {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// セクションナビゲーション初期化
function initSectionNavigation() {
    // 通常のアンカーリンク（#で始まる）も処理
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href === '#' || href === '#!') return; // 空のアンカーはスキップ
        
        const sectionId = href.substring(1); // #を除去
        const targetSection = document.getElementById(sectionId);
        
        if (targetSection) {
            link.addEventListener('click', (e) => {
                // data-section属性がない場合のみ処理（data-sectionはinitHamburgerMenuで処理）
                if (!link.hasAttribute('data-section')) {
                    e.preventDefault();
                    showSection(sectionId);
                }
            });
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
            // data-section属性がある場合はページ遷移を防ぐ
            const sectionId = link.getAttribute('data-section');
            if (sectionId) {
                e.preventDefault();
                e.stopPropagation();
                closeMenu();
                // メニューを閉じてからスクロール（少し遅延を入れる）
                setTimeout(() => {
                    showSection(sectionId);
                }, 300);
                return;
            }
            
            // hrefが#で始まる場合も処理
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const anchorSectionId = href.substring(1);
                if (anchorSectionId && anchorSectionId !== '!' && anchorSectionId !== '') {
                    e.preventDefault();
                    e.stopPropagation();
                    closeMenu();
                    setTimeout(() => {
                        showSection(anchorSectionId);
                    }, 300);
                    return;
                }
            }
            
            let isExternal = link.target === '_blank';
            try {
                const linkUrl = new URL(link.href, window.location.href);
                isExternal = isExternal || linkUrl.origin !== window.location.origin;
            } catch (_) {
                // ignore URL parse errors
            }

            if (isExternal) {
                setTimeout(closeMenu, 100);
            } else {
                closeMenu();
            }
        };
        link.addEventListener('click', handleLinkClick);
        link.addEventListener('touchend', handleLinkClick, { passive: false });
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
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    
    // Android向けにScrollTriggerの設定を最適化
    const scrollTriggerDefaults = {
        markers: false,
        // Android向けにrefreshPriorityを下げてパフォーマンス向上
        refreshPriority: isAndroid ? -1 : 0,
        // Android向けにonceをtrueにしてアニメーションを1回のみ実行
        once: isAndroid,
        // Android向けにinvalidateOnRefreshをfalseにしてパフォーマンス向上
        invalidateOnRefresh: !isAndroid,
    };

    gsap.to('.hero-bg-container', {
        yPercent: 30, ease: 'none',
        scrollTrigger: { 
            trigger: '.hero', 
            start: 'top top', 
            end: 'bottom top', 
            scrub: isAndroid ? 0.5 : true, // Androidではscrubを軽量化
            ...scrollTriggerDefaults
        }
    });


    // Marquee animation moved to renderTicker to handle dynamic content


    const splitTypes = document.querySelectorAll('.split-text');
    splitTypes.forEach(char => {
        const text = new SplitType(char, { types: 'lines, words' });
        gsap.from(text.words, {
            y: 50, opacity: 0, 
            duration: isAndroid ? 0.8 : 1, // Android向けに短縮
            stagger: isAndroid ? 0.03 : 0.05, // Android向けにstaggerを短縮
            ease: 'power3.out',
            scrollTrigger: { 
                trigger: char, 
                start: 'top 80%',
                ...scrollTriggerDefaults
            }
        });
    });

    gsap.utils.toArray('.img-reveal-mask').forEach(mask => {
        gsap.to(mask, {
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            duration: isAndroid ? 1.0 : 1.5, // Android向けに短縮
            ease: 'power4.out',
            scrollTrigger: { 
                trigger: mask, 
                start: 'top 85%',
                ...scrollTriggerDefaults
            }
        });
    });

    const bioLines = document.querySelectorAll('.artist-bio-text, .artist-bio-lead');

    // スマホでの不自然な改行を防ぐため、レイアウトが確定するまでわずかに待機
    setTimeout(() => {
        bioLines.forEach(block => {
            const text = new SplitType(block, { types: 'lines' });
            gsap.from(text.lines, {
                y: 20, opacity: 0, 
                duration: isAndroid ? 0.8 : 1, // Android向けに短縮
                stagger: isAndroid ? 0.08 : 0.1, // Android向けにstaggerを短縮
                ease: "power2.out",
                scrollTrigger: { 
                    trigger: block, 
                    start: "top 85%",
                    ...scrollTriggerDefaults
                }
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

        // Get localized content based on current language
        const getLocalizedTitle = (item) => {
            if (currentLang === 'en' && item.title_en) {
                return item.title_en;
            }
            return item.title || 'No title';
        };

        const getLocalizedBody = (item) => {
            if (currentLang === 'en' && item.body_en) {
                return item.body_en;
            }
            return item.body || item.detail || '';
        };

        const getLocalizedLinkLabel = (item) => {
            if (currentLang === 'en' && item.link_label_en) {
                return item.link_label_en;
            }
            return item.link_label || (currentLang === 'ja' ? 'こちら →' : 'Here →');
        };

        const title = getLocalizedTitle(item);

        // Build inner HTML with badge
        let html = `
          <span class="news-date">
            ${formattedDate}
            ${isNew ? '<span class="news-badge">NEW</span>' : ''}
          </span>
          <span class="news-title">${title}</span>
          <span class="news-arrow">↗</span>
        `;
        a.innerHTML = html;

        // Store original item data for modal
        a.dataset.newsItem = JSON.stringify(item);

        // Modal Click Event
        a.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal && modal.open) {
                const storedItem = JSON.parse(a.dataset.newsItem);
                modalDate.textContent = formattedDate || '';
                modalTitle.textContent = getLocalizedTitle(storedItem);
                modalBody.innerHTML = getLocalizedBody(storedItem).replace(/\n/g, '<br>');

                const url = storedItem.link_url || '';
                const linkLabel = getLocalizedLinkLabel(storedItem);

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

    // Store news items globally for language switching
    if (!window.newsItemsData) {
        window.newsItemsData = [];
    }
    window.newsItemsData = items;

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
                    if (textEl) textEl.textContent = currentLang === 'ja' ? 'LESS' : 'LESS';
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
                    const moreText = currentLang === 'ja' ? translations.ja.news.more : translations.en.news.more;
                    if (textEl) textEl.textContent = moreText;
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

// -------- Discography (Landing) --------
// Audioはグローバルで1つのみ使い回す
const previewAudio = new Audio();
let currentTrackId = null;
let currentTrackName = null;
let currentArtistName = null;

previewAudio.addEventListener('ended', () => {
    updatePreviewButtonsForCurrentTrack(false);
    updateMiniPlayerUI();
});
previewAudio.addEventListener('play', () => {
    updatePreviewButtonsForCurrentTrack(true);
    updateMiniPlayerUI();
});
previewAudio.addEventListener('pause', () => {
    updatePreviewButtonsForCurrentTrack(false);
    updateMiniPlayerUI();
});
previewAudio.addEventListener('timeupdate', () => {
    updateProgressBars();
});

function updateProgressBars() {
    const progress = (previewAudio.currentTime / previewAudio.duration) * 100 || 0;
    document.querySelectorAll('.btn-preview, .track-card, .playlist-item').forEach((btn) => {
        if (btn.dataset.trackId === currentTrackId && !previewAudio.paused) {
            const bar = btn.querySelector('.btn-preview-progress');
            if (bar) bar.style.width = `${progress}%`;
        } else {
            const bar = btn.querySelector('.btn-preview-progress');
            if (bar) bar.style.width = '0%';
        }
    });
}

function initLandingDiscography() {
    const featuredEl = document.getElementById('discography-featured');
    const gridEl = document.getElementById('discography-grid');
    const loadingEl = document.getElementById('discography-loading-lp');
    const errorEl = document.getElementById('discography-error-lp');

    if (!featuredEl || !gridEl) return;

    // プレイヤーUIを初期化
    initAudioPlayer();

    const hideLoading = () => {
        if (loadingEl) loadingEl.style.display = 'none';
    };

    const showError = () => {
        if (errorEl) errorEl.style.display = 'block';
    };

    fetch('/api/spotify')
        .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then((data) => {
            if (!data?.tracks || !Array.isArray(data.tracks) || data.tracks.length === 0) {
                throw new Error('no tracks');
            }

            // release_date降順でソート
            const sorted = [...data.tracks].sort((a, b) => {
                const da = a?.album?.release_date || '';
                const db = b?.album?.release_date || '';
                return db.localeCompare(da);
            });

            const featuredTrack = sorted[0];
            const others = sorted.slice(1);
            const artistId = data.artistId || '';

            hideLoading();

            if (featuredTrack) {
                renderLatestReleaseLP(featuredTrack, featuredEl);
                featuredEl.style.display = 'block';
            }

            if (others.length > 0) {
                renderRailLP(others, gridEl, artistId);
                gridEl.style.display = 'flex';
            }

            // プレビューリストをレンダリング（全曲対象）
            const allTracks = featuredTrack ? [featuredTrack, ...others] : others;
            renderPlaylist(allTracks, gridEl.parentElement);
        })
        .catch((err) => {
            console.error('Discography fetch failed', err);
            hideLoading();
            showError();
        });
}

// 最新1曲を大きく表示
function renderLatestReleaseLP(track, targetEl) {
    if (!targetEl) return;

    const imageUrl = track?.album?.image || '';
    const trackName = track?.name || 'Unknown Track';
    const artistNames = (track?.artists || []).map((a) => a?.name).filter(Boolean).join(', ');
    const releaseDate = track?.album?.release_date || '';
    const spotifyUrl = track?.external_url || '';
    const previewUrl = track?.preview_url || null;
    const trackId = track?.id || `featured-${Date.now()}`;

    const formattedDate = releaseDate ? releaseDate.split('T')[0] : '';

    targetEl.innerHTML = `
        <div class="discography-featured-content">
            <div class="discography-featured-image-wrapper">
                <img src="${imageUrl}" alt="${escapeHtml(trackName)}" class="discography-featured-image" loading="lazy">
            </div>
            <div class="discography-featured-info">
                <h2 class="discography-featured-title">${escapeHtml(trackName)}</h2>
                ${formattedDate ? `
                    <div class="discography-featured-release">
                        <span class="discography-featured-release-label">RELEASE</span>
                        <span>${formattedDate}</span>
                    </div>
                ` : ''}
                <div class="discography-featured-actions">
                    <button class="btn-preview" data-track-id="${escapeHtml(trackId)}" data-preview-url="${escapeHtml(previewUrl || '')}" data-track-name="${escapeHtml(trackName)}" data-artist-name="${escapeHtml(artistNames)}">
                        <span class="btn-preview-icon">▶︎</span>
                        <span class="btn-preview-text">PLAY PREVIEW</span>
                        <span class="btn-preview-progress"></span>
                    </button>
                </div>
            </div>
        </div>
    `;

    const previewBtn = targetEl.querySelector('.btn-preview');
    if (previewBtn) {
        attachPreviewHandler(previewBtn);
    }
}

// 残りの曲を横スクロールで表示
function renderRailLP(tracks, gridEl, artistId) {
    if (!gridEl) return;

    gridEl.classList.add('discography-rail');

    const cards = tracks.map((track) => {
        const imageUrl = track?.album?.image || '';
        const trackName = track?.name || 'Unknown Track';
        const artistNames = (track?.artists || []).map((a) => a?.name).filter(Boolean).join(', ');
        const releaseDate = track?.album?.release_date || '';
        const spotifyUrl = track?.external_url || '';
        const previewUrl = track?.preview_url || null;
        const trackId = track?.id || `grid-${Date.now()}-${Math.random()}`;
        const year = releaseDate ? releaseDate.split('-')[0] : '';

        return `
            <div class="track-card ${!previewUrl ? 'no-preview' : ''}" data-track-id="${escapeHtml(trackId)}" data-preview-url="${escapeHtml(previewUrl || '')}" data-track-name="${escapeHtml(trackName)}" data-artist-name="${escapeHtml(artistNames)}">
                <div class="track-card-image-wrapper">
                    <img src="${imageUrl}" alt="${escapeHtml(trackName)}" class="track-card-image" loading="lazy">
                    <div class="track-card-overlay">
                        <span class="play-icon">▶︎</span>
                    </div>
                    <span class="btn-preview-progress"></span>
                </div>
                <div class="track-card-body">
                    <div class="track-card-title">${escapeHtml(trackName)}</div>
                    ${year ? `<div class="track-card-year">${year}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    gridEl.innerHTML = `${cards}`;

    gridEl.querySelectorAll('.track-card').forEach((card) => {
        if (card.classList.contains('no-preview')) return;
        
        card.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePreviewClick(card);
        });
    });

    // 末尾のSpotifyリンクボタン（スクロール外に配置して跳ね返りを防ぐ）
    if (artistId) {
        const isEnglish = currentLang === 'en';
        const moreLink = document.createElement('a');
        moreLink.className = 'discography-more';
        moreLink.href = `https://open.spotify.com/artist/${artistId}/discography/all`;
        moreLink.target = '_blank';
        moreLink.rel = 'noopener noreferrer';
        moreLink.setAttribute('aria-label', 'Spotifyで全曲を見る');
        moreLink.textContent = isEnglish ? 'View all on Spotify' : 'Spotifyで全曲を見る';

        const parent = gridEl.parentElement;
        // 既存のボタンを削除してから配置
        if (parent) {
            parent.querySelectorAll('.discography-more').forEach((el) => el.remove());
            parent.appendChild(moreLink);
        } else {
            gridEl.appendChild(moreLink);
        }
    }
}

// 簡易再生リストのレンダリング
function renderPlaylist(tracks, containerEl) {
    if (!containerEl) return;

    const existing = containerEl.querySelector('.discography-playlist-wrapper');
    if (existing) existing.remove();

    const previewable = tracks.filter((t) => t?.preview_url);
    if (previewable.length === 0) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'discography-playlist-wrapper';

    const isEnglish = currentLang === 'en';
    const title = isEnglish ? 'PREVIEW TRACKS' : 'プレビュー再生';

    wrapper.innerHTML = `
        <div class="discography-playlist-header">
            <h3 class="discography-playlist-title">${title}</h3>
        </div>
        <div class="discography-playlist">
            ${previewable.map((t) => {
                const tId = t?.id || `pl-${Math.random()}`;
                const tName = t?.name || 'Unknown Track';
                const artists = (t?.artists || []).map((a) => a?.name).filter(Boolean).join(', ');
                const pUrl = t?.preview_url;
                const sUrl = t?.external_url || '';
                return `
                    <button class="playlist-item" data-track-id="${escapeHtml(tId)}" data-preview-url="${escapeHtml(pUrl)}" data-track-name="${escapeHtml(tName)}" data-artist-name="${escapeHtml(artists)}" data-spotify-url="${sUrl ? escapeHtml(sUrl) : ''}">
                        <div class="playlist-item__content">
                            <span class="playlist-item__title">${escapeHtml(tName)}</span>
                            <span class="playlist-item__artist">${escapeHtml(artists)}</span>
                        </div>
                        <div class="playlist-item__action">
                            <span class="playlist-item__icon">▶︎</span>
                            <span class="btn-preview-progress"></span>
                        </div>
                    </button>
                `;
            }).join('')}
        </div>
    `;

    containerEl.appendChild(wrapper);

    wrapper.querySelectorAll('.playlist-item').forEach((btn) => {
        attachPreviewHandler(btn);
    });
}


// 30秒プレビューのクリック制御
function attachPreviewHandler(buttonEl) {
    if (!buttonEl) return;

    buttonEl.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handlePreviewClick(buttonEl);
    });
}

async function handlePreviewClick(element) {
    const previewUrl = element.dataset.previewUrl;
    const trackId = element.dataset.trackId;
    const card = element.closest('.track-card, .discography-featured-content');
    const trackName = element.dataset.trackName
        || (card?.querySelector('.track-card-title, .discography-featured-title')?.textContent?.trim())
        || 'Unknown Track';
    const artistName = element.dataset.artistName || '';

    if (!previewUrl) return;

    const isSameTrack = currentTrackId === trackId && !previewAudio.paused;

    if (isSameTrack) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
        updatePreviewButtonsForCurrentTrack(false);
        updateMiniPlayerUI();
        return;
    }

    try {
        previewAudio.pause();
        previewAudio.currentTime = 0;
        previewAudio.src = previewUrl;

        currentTrackId = trackId;
        currentTrackName = trackName || 'Unknown Track';
        currentArtistName = artistName || '';

        await previewAudio.play();

        setPlayingState(element);
        if (card) card.classList.add('is-playing');
        showAudioPlayer(currentTrackName, currentArtistName);
    } catch (error) {
        console.error('Audio play failed:', error);
        resetPreviewState();
    }
}

// 再生状態をUIに反映
function updatePreviewButtonsForCurrentTrack(isPlaying) {
    document.querySelectorAll('.btn-preview, .playlist-item, .track-card').forEach((btn) => {
        const match = isPlaying && currentTrackId && btn.dataset.trackId === currentTrackId;
        updatePreviewButton(btn, match);
        const card = btn.closest('.track-card, .discography-featured-content');
        if (card) {
            card.classList.toggle('is-playing', match);
        }
    });
}

function setPlayingState(activeButton) {
    const trackId = activeButton?.dataset.trackId;
    if (trackId) {
        currentTrackId = trackId;
    }
    updatePreviewButtonsForCurrentTrack(true);
}

// 再生ボタンの表示を更新
function updatePreviewButton(buttonEl, isPlaying) {
    if (!buttonEl) return;
    const isPlaylistItem = buttonEl.classList.contains('playlist-item');
    const isTrackCard = buttonEl.classList.contains('track-card');

    if (isTrackCard) {
        const iconEl = buttonEl.querySelector('.play-icon');
        if (iconEl) iconEl.textContent = isPlaying ? '⏸︎' : '▶︎';
    } else if (isPlaylistItem) {
        const iconEl = buttonEl.querySelector('.playlist-item__icon');
        if (iconEl) iconEl.textContent = isPlaying ? '⏸︎' : '▶︎';
    } else {
        const iconEl = buttonEl.querySelector('.btn-preview-icon');
        const textEl = buttonEl.querySelector('.btn-preview-text');
        if (iconEl) iconEl.textContent = isPlaying ? '⏸︎' : '▶︎';
        if (textEl) textEl.textContent = isPlaying ? 'PAUSE' : 'PLAY PREVIEW';
    }

    buttonEl.classList.toggle('is-playing', isPlaying);

    if (!isPlaying) {
        const bar = buttonEl.querySelector('.btn-preview-progress');
        if (bar) bar.style.width = '0%';
    }
}

// すべての再生を停止しUIをリセット
function resetPreviewState() {
    previewAudio.pause();
    previewAudio.currentTime = 0;

    updatePreviewButtonsForCurrentTrack(false);
    hideAudioPlayer();
}

// オーディオプレイヤーの初期化
function initAudioPlayer() {
    const playerEl = document.getElementById('mini-player');
    const toggleBtn = playerEl?.querySelector('.mini-player__toggle');

    if (!playerEl || !toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        if (!previewAudio.src || !currentTrackId) return;

        if (previewAudio.paused) {
            previewAudio.play().catch(err => console.error('Play failed:', err));
        } else {
            previewAudio.pause();
            previewAudio.currentTime = 0;
        }

        updateMiniPlayerUI();
    });
}

// オーディオプレイヤーを表示
function showAudioPlayer(trackName, artistName) {
    const playerEl = document.getElementById('mini-player');
    const titleEl = playerEl?.querySelector('.mini-player__title');
    const artistEl = playerEl?.querySelector('.mini-player__artist');

    if (!playerEl) return;

    if (titleEl) {
        titleEl.textContent = trackName || currentTrackName || 'Unknown Track';
    }
    if (artistEl) {
        artistEl.textContent = artistName || currentArtistName || '';
    }

    playerEl.classList.remove('hidden');
    updateMiniPlayerUI();
}

// オーディオプレイヤーを非表示
function hideAudioPlayer() {
    const playerEl = document.getElementById('mini-player');
    if (playerEl) {
        playerEl.classList.add('hidden');
    }
}

function updateMiniPlayerUI() {
    const playerEl = document.getElementById('mini-player');
    const toggleEl = playerEl?.querySelector('.mini-player__toggle');

    if (!playerEl || !toggleEl) return;

    toggleEl.textContent = previewAudio.paused ? '▶︎' : '⏸';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

// -------- Contact Form --------
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
        const priority = currentLang === 'ja' ? '内容 / 希望時期 / 予算感（任意）' : 'Content / Preferred Date / Budget (Optional)';
        const fallback = currentLang === 'ja' ? 'ご用件をお書きください。' : 'Please write your inquiry.';
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
            if (btnText) btnText.textContent = currentLang === 'ja' ? '送信中...' : 'Sending...';
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

        const errorMessages = currentLang === 'ja' ? {
            category: 'お問い合わせ種別を選択してください。',
            name: 'お名前を入力してください。',
            email: '有効なメールアドレスを入力してください。',
            message: 'メッセージをご記入ください。',
            messageLength: `メッセージは${maxMessageLength}文字以内にしてください。`,
            website: '送信できませんでした。',
            interval: '送信間隔を空けてください（1分ほど）。',
            timing: 'ページ表示から3秒以上お待ちください。',
            success: 'ありがとうございます。自動返信はありませんが、追って担当よりご連絡いたします。',
            error: '通信に失敗しました。時間をおいて再度お試しください。'
        } : {
            category: 'Please select an inquiry type.',
            name: 'Please enter your name.',
            email: 'Please enter a valid email address.',
            message: 'Please enter your message.',
            messageLength: `Message must be within ${maxMessageLength} characters.`,
            website: 'Unable to send.',
            interval: 'Please wait about 1 minute between submissions.',
            timing: 'Please wait at least 3 seconds after the page loads.',
            success: 'Thank you. There is no automatic reply, but we will contact you later.',
            error: 'Communication failed. Please try again later.'
        };

        if (!payload.category) {
            setStatus('error', errorMessages.category);
            return;
        }
        if (!payload.name) {
            setStatus('error', errorMessages.name);
            return;
        }
        if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
            setStatus('error', errorMessages.email);
            return;
        }
        if (!payload.message) {
            setStatus('error', errorMessages.message);
            return;
        }
        if (payload.message.length > maxMessageLength) {
            setStatus('error', errorMessages.messageLength);
            return;
        }
        if (payload.website) {
            setStatus('error', errorMessages.website);
            return;
        }

        const lastSubmit = getLastSubmit();
        if (lastSubmit && now - lastSubmit < 60_000) {
            setStatus('warning', errorMessages.interval);
            return;
        }

        if (now - formLoadedAt < 3000) {
            setStatus('warning', errorMessages.timing);
            return;
        }

        setButtonState(true);
        setStatus('', '');

        try {
            await sendPost(payload);
            recordSubmit();
            setStatus('success', errorMessages.success);
            form.reset();
            updatePlaceholder();
        } catch (postError) {
            try {
                await sendGet(payload);
                recordSubmit();
                setStatus('success', errorMessages.success);
                form.reset();
                updatePlaceholder();
            } catch (getError) {
                setStatus('error', errorMessages.error);
            }
        } finally {
            setButtonState(false);
        }
    });
}
