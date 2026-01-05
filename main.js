/* ============================================================
 * MASATO HAYASHI OFFICIAL - FINAL ULTIMATE BUILD
 * ============================================================ */

// フォーム送信用API URL（相対パス）
const API_URL = 'https://script.google.com/macros/s/AKfycbxnG4QxC_iQYZpPhy48Sau1e7E3Cu3Ou0f4ONv7gmHwWmL1q9bJXqdfzeNiYzsqb-tB/exec';

// INFORMATIONセクション（News/Ticker）用API URL
const NEWS_API_URL = 'https://script.google.com/macros/s/AKfycbyRWjZHf-qy3d7OZeSP4hjrryfsybjXWxp41Z6oMOLH3TtTmrw5gSJXxbu0yYhbCZLcmQ/exec';

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
    const isMobileSmall = window.matchMedia('(max-width: 768px)').matches;
    const navType = getNavigationType();
    if (navType === 'reload') {
        resetSessionLoaderFlag();
    }

    // GSAP ScrollTrigger を先に登録
    gsap.registerPlugin(ScrollTrigger);

    // スマホ幅（max-width: 768px）では Lenis を完全に無効化
    if (!isMobileSmall) {
        // Smooth Scroll（PC・タブレットのみ）
        lenis = new Lenis({
            duration: isAndroid ? 0.05 : (isMobile ? 0.1 : 1.5),
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
            mouseMultiplier: isMobile ? 0.5 : 1,
            touchMultiplier: isAndroid ? 1.5 : (isMobile ? 2 : 1),
            infinite: false,
            wheelMultiplier: isAndroid ? 0.5 : 1,
        });

        // Lenis と ScrollTrigger の同期設定
        lenis.on('scroll', ScrollTrigger.update);

        // ScrollTrigger の scrollerProxy を設定
        const smoothContent = document.querySelector('#smooth-content');
        if (smoothContent) {
            ScrollTrigger.scrollerProxy('#smooth-content', {
                scrollTop(value) {
                    if (arguments.length) {
                        lenis.scrollTo(value, { immediate: true });
                    }
                    return lenis.scroll;
                },
                getBoundingClientRect() {
                    return {
                        top: 0,
                        left: 0,
                        width: window.innerWidth,
                        height: window.innerHeight,
                    };
                },
                pinType: smoothContent.style.transform ? 'transform' : 'fixed',
            });
        }

        // ScrollTrigger のデフォルト scroller を設定
        ScrollTrigger.defaults({
            scroller: '#smooth-content',
        });

        // requestAnimationFrame で lenis.raf を回す
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // ScrollTrigger の refresh を Lenis の scroll イベント後に実行
        ScrollTrigger.addEventListener('refresh', () => {
            if (lenis) {
                lenis.resize();
            }
        });
    } else {
        // スマホでは ScrollTrigger のデフォルト scroller を window に設定
        ScrollTrigger.defaults({
            scroller: window,
        });
    }

    // Android向けのパフォーマンス最適化
    if (isAndroid || isMobileSmall) {
        // パッシブリスナーの使用（スクロールパフォーマンス向上）
        document.addEventListener('touchstart', () => { }, { passive: true });
        document.addEventListener('touchmove', () => { }, { passive: true });
        document.addEventListener('touchend', () => { }, { passive: true });

        // メモリ使用量の最適化
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                // アイドル時に最適化処理を実行
            });
        }
        
        // スマホ版でスクロールイベントのパフォーマンス最適化
        let ticking = false;
        const optimizeScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    // スクロール時の処理を最適化
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        // パッシブリスナーでスクロールイベントを最適化
        window.addEventListener('scroll', optimizeScroll, { passive: true });
    }

    // モバイル向けに ScrollTrigger.refresh() を適切に呼ぶ
    let resizeTimeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 150);
    };

    let orientationTimeout;
    const handleOrientationChange = () => {
        clearTimeout(orientationTimeout);
        orientationTimeout = setTimeout(() => {
            // ビューポート高さの変化を待つ
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 300);
        }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });

    // ビューポート高さの変化を検知（モバイルのアドレスバー表示/非表示対応）
    let lastViewportHeight = window.innerHeight;
    const handleViewportChange = () => {
        const currentHeight = window.innerHeight;
        if (Math.abs(currentHeight - lastViewportHeight) > 50) {
            lastViewportHeight = currentHeight;
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 200);
        }
    };

    // ビューポート高さの変化を監視（モバイルのみ）
    if (isMobileSmall) {
        let viewportCheckInterval = setInterval(handleViewportChange, 100);
        // ページが非表示になったら監視を停止
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(viewportCheckInterval);
            } else {
                viewportCheckInterval = setInterval(handleViewportChange, 100);
            }
        });
    }

    initLoader(navType);
    initCursor();
    initAnimations();
    initDistortionCanvas();
    initHamburgerMenu();
    initLogoScroll();
    initLanguageSwitcher();
    initVideoOptimization(); // 動画最適化を追加
    initSectionNavigation(); // セクションナビゲーション初期化
    initArtistBioToggle(); // アーティスト説明文の折りたたみ機能
    initArtistPhotoToggle(); // アーティスト画像の色切り替え機能
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
        hero: {
            subtitle1: 'FORMERLY KNOWN AS PABLO BLASTA',
            subtitle2: 'REBORN IN'
        },
        loader: {
            loading: 'NOW LOADING...',
            ready: 'READY?'
        },
        discography: {
            title: 'DISCOGRAPHY',
            subtitle: '作品',
            loading: 'NOW LOADING...',
            error: 'データの取得に失敗しました。しばらく時間をおいて再度お試しください。'
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
            more: 'MORE',
            modalLink: 'こちら →',
            moreButton: 'もっと見る',
            collapseButton: '折りたたむ'
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
        },
        player: {
            close: 'プレーヤーを閉じる'
        },
        menu: {
            open: 'メニューを開く',
            close: 'メニューを閉じる'
        },
        visual: {
            statement: 'Silence is not empty,<br>it\'s full of <span class="highlight">answers</span>.',
            location: 'TOKYO / 2025'
        },
        footer: {
            privacy: 'PRIVACY POLICY'
        }
    },
    en: {
        nav: {
            artist: 'ARTIST',
            info: 'INFORMATION',
            contact: 'CONTACT'
        },
        hero: {
            subtitle1: 'FORMERLY KNOWN AS PABLO BLASTA',
            subtitle2: 'REBORN IN'
        },
        loader: {
            loading: 'NOW LOADING...',
            ready: 'READY?'
        },
        discography: {
            title: 'DISCOGRAPHY',
            subtitle: 'Works',
            loading: 'NOW LOADING...',
            error: 'Failed to retrieve data. Please try again later.'
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
            more: 'MORE',
            modalLink: 'Here →',
            moreButton: 'Show More',
            collapseButton: 'Show Less'
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
        },
        player: {
            close: 'Close player'
        },
        menu: {
            open: 'Open menu',
            close: 'Close menu'
        },
        visual: {
            statement: 'Silence is not empty,<br>it\'s full of <span class="highlight">answers</span>.',
            location: 'TOKYO / 2025'
        },
        footer: {
            privacy: 'PRIVACY POLICY'
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
                // アーティスト紹介文の場合は改行防止クラスを保持
                if (key && key.startsWith('artist.bio.')) {
                    let htmlValue = value;
                    // 改行防止が必要な文字列を検索して置換（日本語版）
                    htmlValue = htmlValue.replace(/& DJ TATSUKI/g, '<span class="keep-together">& DJ TATSUKI</span>');
                    htmlValue = htmlValue.replace(/& JP THE WAVY/g, '<span class="keep-together">& JP THE WAVY</span>');
                    htmlValue = htmlValue.replace(/J-HIPHOPの聖地/g, '<span class="keep-together">J-HIPHOPの聖地</span>');
                    // 「Good Die Young feat. RYKEY & Pablo Blasta」の部分を改行防止
                    htmlValue = htmlValue.replace(/「Good Die Young feat\. RYKEY & Pablo Blasta」/g, '<span class="keep-together">「Good Die Young feat. RYKEY & Pablo Blasta」</span>');
                    // 英語版も同様に処理
                    htmlValue = htmlValue.replace(/& DJ TATSUKI/g, '<span class="keep-together">& DJ TATSUKI</span>');
                    htmlValue = htmlValue.replace(/& JP THE WAVY/g, '<span class="keep-together">& JP THE WAVY</span>');
                    htmlValue = htmlValue.replace(/J-HIPHOP/g, '<span class="keep-together">J-HIPHOP</span>');
                    el.innerHTML = htmlValue;
                } else if (key === 'hero.subtitle2') {
                    // 年号を保持しながらテキストを更新
                    const yearHighlight = el.querySelector('.year-highlight');
                    const yearText = yearHighlight ? yearHighlight.textContent : '2021';
                    el.innerHTML = value + ' <span class="year-highlight">' + yearText + '</span>';
                } else if (key === 'visual.statement') {
                    // HTMLを含むテキストをそのまま設定
                    el.innerHTML = value;
                } else {
                    el.textContent = value;
                }
            }
        }
    });
    
    // Update aria-label attributes with data-i18n-aria-label
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        const value = getNestedValue(t, key);
        if (value !== undefined) {
            el.setAttribute('aria-label', value);
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
    
    // Update artist bio toggle button text
    updateArtistBioToggleText();
    
    // Update Spotify player close button aria-label if it exists
    const spotifyCloseBtn = document.querySelector('.spotify-player-close');
    if (spotifyCloseBtn) {
        const closeLabel = getNestedValue(t, 'player.close') || (lang === 'ja' ? 'プレーヤーを閉じる' : 'Close player');
        spotifyCloseBtn.setAttribute('aria-label', closeLabel);
    }
    
    // Update news more button aria-label if it exists
    const newsMoreBtn = document.getElementById('news-more-btn');
    if (newsMoreBtn && newsMoreBtn.dataset.initialized) {
        const isExpanded = newsMoreBtn.dataset.expanded === 'true';
        const moreLabel = getNestedValue(t, 'news.moreButton') || (lang === 'ja' ? 'もっと見る' : 'Show More');
        const collapseLabel = getNestedValue(t, 'news.collapseButton') || (lang === 'ja' ? '折りたたむ' : 'Show Less');
        newsMoreBtn.setAttribute('aria-label', isExpanded ? collapseLabel : moreLabel);
    }
    
    // Update news modal link label if modal is open
    const newsModalLink = document.getElementById('news-modal-link');
    if (newsModalLink && newsModalLink.style.display !== 'none') {
        const modalLinkText = getNestedValue(t, 'news.modalLink') || (lang === 'ja' ? 'こちら →' : 'Here →');
        newsModalLink.textContent = modalLinkText;
    }
    
    // Explicitly update discography subtitle to ensure it's updated
    const discographySubtitle = document.querySelector('[data-i18n="discography.subtitle"]');
    if (discographySubtitle) {
        const subtitleValue = getNestedValue(t, 'discography.subtitle');
        if (subtitleValue !== undefined) {
            discographySubtitle.textContent = subtitleValue;
        }
    }
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
    const loadingText = getNestedValue(translations[currentLang], 'loader.loading') || 'NOW LOADING...';
    tl.call(() => {
        if (textEl) textEl.textContent = loadingText;
    });

    // Count: 3
    countStep('3', 'images/count3.jpg');

    // Count: 2
    countStep('2', 'images/count2.jpg');

    // Count: 1 (画像と同じ間隔で黒背景＋ノイズ)
    const readyText = getNestedValue(translations[currentLang], 'loader.ready') || 'READY?';
    tl.call(() => {
        if (loader) loader.classList.add('show-noise');
        // ここで「READY?」に変更（NOW LOADINGと同じ位置）
        if (textEl) {
            textEl.textContent = readyText;
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

// アーティスト画像の色切り替え機能（タップで独立して切り替え）
function initArtistPhotoToggle() {
    const artistPhotos = document.querySelectorAll('.artist-photo');
    
    if (artistPhotos.length === 0) return;
    
    // 各画像に独立したクリック/タップイベントを追加
    artistPhotos.forEach(photo => {
        // タッチ状態管理
        const touchState = {
            startY: 0,
            startX: 0,
            startTime: 0,
            moved: false,
            cancelled: false
        };
        
        const SCROLL_THRESHOLD = 15;
        const MAX_TAP_TIME = 300;
        const MAX_TAP_DISTANCE = 10;
        
        // タッチ開始
        photo.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchState.startY = touch.clientY;
            touchState.startX = touch.clientX;
            touchState.startTime = Date.now();
            touchState.moved = false;
            touchState.cancelled = false;
        }, { passive: true });
        
        // タッチ移動（スクロール検知）
        photo.addEventListener('touchmove', (e) => {
            if (touchState.cancelled) return;
            
            const touch = e.touches[0];
            const deltaY = Math.abs(touch.clientY - touchState.startY);
            const deltaX = Math.abs(touch.clientX - touchState.startX);
            const distance = Math.sqrt(deltaY * deltaY + deltaX * deltaX);
            
            if (distance > SCROLL_THRESHOLD) {
                if (deltaY > deltaX * 1.5) {
                    touchState.moved = true;
                }
            }
        }, { passive: true });
        
        // タッチ終了（クリック判定）
        photo.addEventListener('touchend', (e) => {
            if (touchState.cancelled) {
                touchState.cancelled = false;
                return;
            }
            
            const touchTime = Date.now() - touchState.startTime;
            const touch = e.changedTouches[0];
            const deltaY = Math.abs(touch.clientY - touchState.startY);
            const deltaX = Math.abs(touch.clientX - touchState.startX);
            const distance = Math.sqrt(deltaY * deltaY + deltaX * deltaX);
            
            const isScroll = touchState.moved || 
                            distance > SCROLL_THRESHOLD || 
                            touchTime > MAX_TAP_TIME ||
                            (deltaY > MAX_TAP_DISTANCE && deltaY > deltaX * 1.5);
            
            if (isScroll) {
                touchState.moved = false;
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // 少し遅延を入れて確実にクリックイベントを発火
            setTimeout(() => {
                if (!touchState.cancelled) {
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        detail: 1
                    });
                    photo.dispatchEvent(clickEvent);
                }
            }, 50);
        }, { passive: false });
        
        // タッチキャンセル
        photo.addEventListener('touchcancel', () => {
            touchState.cancelled = true;
            touchState.moved = false;
        }, { passive: true });
        
        // クリックイベント（色の切り替え）
        photo.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // この画像だけのクラスをトグル（他の画像には影響しない）
            photo.classList.toggle('is-colored');
        });
    });
}

// アーティスト説明文の折りたたみ機能
function initArtistBioToggle() {
    const artistBio = document.querySelector('.artist-bio');
    const fadeArea = document.querySelector('.artist-bio-fade');
    const toggleBtn = document.querySelector('.artist-bio-toggle');
    
    if (!artistBio) return;
    
    // PCサイズでは折りたたみ機能を無効化
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    
    // PCサイズでは常に展開状態にする
    if (!isMobile) {
        artistBio.classList.add('is-expanded');
        return; // PCサイズではイベントリスナーを追加しない
    }
    
    // 初期状態を確実に折りたたみ状態にする（モバイルのみ）
    artistBio.classList.remove('is-expanded');
    
    // フェードエリアの位置を保存（折りたたみ時にスクロール位置を戻すため）
    let fadeAreaTop = null;
    
    // 展開処理
    const handleExpand = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // フェードエリアの位置を保存
        if (fadeArea) {
            fadeAreaTop = fadeArea.getBoundingClientRect().top + window.scrollY;
        }
        
        artistBio.classList.add('is-expanded');
        if (fadeArea) {
            const fadeHint = fadeArea.querySelector('.fade-hint');
            if (fadeHint) {
                fadeHint.setAttribute('aria-expanded', 'true');
                fadeHint.setAttribute('aria-label', currentLang === 'ja' ? '全文を非表示' : 'Hide full text');
            }
        }
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'true');
            toggleBtn.setAttribute('aria-label', currentLang === 'ja' ? '全文を非表示' : 'Hide full text');
        }
    };
    
    // 折りたたみ処理
    const handleCollapse = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        artistBio.classList.remove('is-expanded');
        if (fadeArea) {
            const fadeHint = fadeArea.querySelector('.fade-hint');
            if (fadeHint) {
                fadeHint.setAttribute('aria-expanded', 'false');
                fadeHint.setAttribute('aria-label', currentLang === 'ja' ? '全文を表示' : 'Show full text');
            }
        }
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.setAttribute('aria-label', currentLang === 'ja' ? '全文を表示' : 'Show full text');
        }
        
        // フェードエリアの位置にスクロール
        if (fadeAreaTop !== null) {
            setTimeout(() => {
                if (lenis) {
                    lenis.scrollTo(fadeAreaTop - 100, {
                        duration: 0.6,
                        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                        offset: 0
                    });
                } else {
                    window.scrollTo({
                        top: fadeAreaTop - 100,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    };
    
    // フェードエリアのクリックイベント（展開）- MOREボタンのみに限定
    if (fadeArea) {
        const fadeHint = fadeArea.querySelector('.fade-hint');
        
        const handleFadeClick = (e) => {
            if (!artistBio.classList.contains('is-expanded')) {
                handleExpand(e);
            }
        };
        
        // fade-hint要素だけにクリックイベントを設定
        if (fadeHint) {
            // アクセシビリティ属性をfade-hintに移動
            fadeHint.setAttribute('role', 'button');
            fadeHint.setAttribute('tabindex', '0');
            fadeHint.setAttribute('aria-label', currentLang === 'ja' ? '全文を表示' : 'Show full text');
            fadeHint.setAttribute('aria-expanded', 'false');
            
            // fadeAreaからアクセシビリティ属性を削除
            fadeArea.removeAttribute('role');
            fadeArea.removeAttribute('tabindex');
            fadeArea.removeAttribute('aria-label');
            fadeArea.removeAttribute('aria-expanded');
            
            fadeHint.addEventListener('click', handleFadeClick);
            fadeHint.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleFadeClick(e);
            }, { passive: false });
            
            // キーボードアクセシビリティ
            fadeHint.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFadeClick(e);
                }
            });
        }
        
        // fadeArea全体のクリックイベントは削除（MOREボタン周辺をクリックしても展開されないように）
        // fadeAreaのpointer-eventsをnoneにして、クリックが通らないようにする
        fadeArea.style.pointerEvents = 'none';
    }
    
    // トグルボタンのクリックイベント（折りたたみ）
    if (toggleBtn) {
        toggleBtn.addEventListener('click', handleCollapse);
        toggleBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleCollapse(e);
        }, { passive: false });
    }
    
    // 初期状態を設定
    if (fadeArea) {
        const fadeHint = fadeArea.querySelector('.fade-hint');
        if (fadeHint) {
            fadeHint.setAttribute('aria-expanded', 'false');
            fadeHint.setAttribute('aria-label', currentLang === 'ja' ? '全文を表示' : 'Show full text');
        }
    }
    
    // リサイズ時の処理（PCサイズになったら展開状態にする）
    const handleResize = () => {
        const isMobileNow = window.matchMedia('(max-width: 900px)').matches;
        if (!isMobileNow) {
            artistBio.classList.add('is-expanded');
        } else if (!artistBio.classList.contains('is-expanded')) {
            artistBio.classList.remove('is-expanded');
        }
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
}

// アーティスト説明文トグルボタンのテキストを更新
function updateArtistBioToggleText() {
    const artistBio = document.querySelector('.artist-bio');
    const fadeArea = document.querySelector('.artist-bio-fade');
    const toggleBtn = document.querySelector('.artist-bio-toggle');
    const fadeHintText = fadeArea?.querySelector('.fade-hint-text');
    const toggleText = toggleBtn?.querySelector('.toggle-text');
    
    const isExpanded = artistBio?.classList.contains('is-expanded');
    
    if (fadeArea) {
        const fadeHint = fadeArea.querySelector('.fade-hint');
        const fadeHintText = fadeHint?.querySelector('.fade-hint-text');
        if (fadeHintText) {
            fadeHintText.textContent = 'MORE';
        }
        if (fadeHint) {
            const isExpanded = artistBio?.classList.contains('is-expanded');
            fadeHint.setAttribute('aria-label', currentLang === 'ja' ? '全文を表示' : 'Show full text');
            fadeHint.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        }
    }
    
    if (toggleBtn && toggleText) {
        toggleText.textContent = currentLang === 'ja' ? '閉じる' : 'Show Less';
        toggleBtn.setAttribute('aria-label', currentLang === 'ja' ? '全文を非表示' : 'Hide full text');
    }
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
            // クリックされた要素がリンク要素またはその子要素（テキスト、アイコンなど）であることを確認
            // 余白部分をクリックした場合は処理をスキップ
            const clickedElement = e.target;
            if (clickedElement !== link && !link.contains(clickedElement)) {
                return;
            }
            
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
    // 注意: once は scrollTriggerDefaults から削除（Hero のような往復アニメには適用しない）
    const scrollTriggerDefaults = {
        markers: false,
        // Android向けにrefreshPriorityを下げてパフォーマンス向上
        refreshPriority: isAndroid ? -1 : 0,
        // Android向けにinvalidateOnRefreshをfalseにしてパフォーマンス向上
        invalidateOnRefresh: !isAndroid,
    };

    // Hero のパララックスアニメーション（スクロールで往復する必要があるため once: false を明示）
    gsap.to('.hero-bg-container', {
        yPercent: 30, ease: 'none',
        scrollTrigger: { 
            trigger: '.hero', 
            start: 'top top', 
            end: 'bottom top', 
            scrub: isAndroid ? 0.5 : true, // Androidではscrubを軽量化
            once: false, // 往復アニメのため必ず false
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
                once: isAndroid, // 一度だけ再生する演出
                ...scrollTriggerDefaults
            }
        });
    });

    // img-reveal-maskのScrollTrigger設定
    // 注意: インタラクティブ要素（album-card内など）には適用しない
    // 出現アニメ専用に限定し、once設定も出現アニメ専用
    gsap.utils.toArray('.img-reveal-mask').forEach(mask => {
        // album-card内の要素には適用しない（インタラクティブ要素を保護）
        if (mask.closest('.album-card') || mask.closest('.track-card')) {
            return; // スキップ
        }
        gsap.to(mask, {
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            duration: isAndroid ? 1.0 : 1.5, // Android向けに短縮
            ease: 'power4.out',
            scrollTrigger: { 
                trigger: mask, 
                start: 'top 85%',
                once: isAndroid, // 出現アニメ専用：一度だけ再生する演出
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
                    once: isAndroid, // 一度だけ再生する演出
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

    const isAndroid = /Android/i.test(navigator.userAgent);
    gsap.from('.statement-text', {
        y: 50, opacity: 0, duration: 1.5, ease: 'power3.out',
        scrollTrigger: { 
            trigger: '.visual-break', 
            start: 'center 70%',
            once: isAndroid // 一度だけ再生する演出
        }
    });
}

async function fetchData() {
    try {
        console.log('Fetching data from:', NEWS_API_URL);
        const res = await fetch(NEWS_API_URL);

        if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('Fetched Data:', data);

        // Normalize data to array - 複数の形式に対応
        let items = [];
        if (Array.isArray(data)) {
            items = data;
        } else if (typeof data === 'object' && data !== null) {
            // {items: [...]} 形式
            if (Array.isArray(data.items)) {
                items = data.items;
            }
            // {news: [...], ticker: [...]} 形式
            else if (Array.isArray(data.news) || Array.isArray(data.ticker)) {
                items = [...(data.news || []), ...(data.ticker || [])];
            }
            // その他のオブジェクト形式
            else {
                items = Object.values(data);
            }
        }

        // publishの型揺れを正規化する関数
        function normalizePublish(value) {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'string') {
                const lower = value.toLowerCase().trim();
                if (lower === 'true' || lower === '1') return true;
                if (lower === 'false' || lower === '0' || lower === '') return false;
            }
            if (typeof value === 'number') return value !== 0;
            return false;
        }

        // dateの型揺れを正規化する関数（YYYY-MM-DD形式に統一）
        function normalizeDateString(dateValue) {
            if (!dateValue) return null;
            if (typeof dateValue === 'string') {
                // ISO文字列（2025-01-01T00:00:00.000Zなど）の場合は先頭10文字を取得
                if (dateValue.includes('T') || dateValue.includes('Z')) {
                    return dateValue.substring(0, 10);
                }
                // 既にYYYY-MM-DD形式ならそのまま
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                    return dateValue;
                }
            }
            // Date型の場合は文字列化して先頭10文字を取得
            if (dateValue instanceof Date) {
                return dateValue.toISOString().substring(0, 10);
            }
            return String(dateValue).substring(0, 10);
        }

        // Current Date for filtering
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // --- 1. Separate News and Ticker ---

        // News: type='news', publish=true, date <= today
        const newsItems = items.filter(item => {
            if (!item || typeof item !== 'object') return false;
            if (item.type !== 'news') return false;
            if (!normalizePublish(item.publish)) return false;
            if (!item.date) return false;
            const normalizedDate = normalizeDateString(item.date);
            if (!normalizedDate) return false;
            // ローカル日付基準で比較（未来日を除外）
            const itemDate = new Date(normalizedDate + 'T23:59:59');
            return itemDate <= today;
        });

        // Ticker: type='ticker', publish=true
        const tickerItems = items.filter(item => {
            if (!item || typeof item !== 'object') return false;
            if (item.type !== 'ticker') return false;
            return normalizePublish(item.publish);
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
        // dateの正規化（YYYY-MM-DD形式に統一）
        const normalizeDateString = (dateValue) => {
            if (!dateValue) return '';
            if (typeof dateValue === 'string') {
                if (dateValue.includes('T') || dateValue.includes('Z')) {
                    return dateValue.substring(0, 10);
                }
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                    return dateValue;
                }
            }
            if (dateValue instanceof Date) {
                return dateValue.toISOString().substring(0, 10);
            }
            return String(dateValue).substring(0, 10);
        };
        const da = normalizeDateString(a.date);
        const db = normalizeDateString(b.date);
        return db.localeCompare(da); // Descending (新しい順)
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
        let activeNewsItem = null;
        
        const openModal = (clickedItem) => {
            // まず記事にクラスを追加して横にずれるアニメーションを開始
            if (clickedItem) {
                activeNewsItem = clickedItem;
                clickedItem.classList.add('is-active');
                document.body.classList.add('news-modal-open');
            }
            
            // 少し遅延してからモーダルを開く（記事のアニメーションを見せるため）
            setTimeout(() => {
                modal.classList.add('is-open');
                modal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            }, 250); // 250ms遅延
        };
        const closeModal = () => {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            document.body.classList.remove('news-modal-open');
            
            // アクティブな記事からクラスを削除
            if (activeNewsItem) {
                activeNewsItem.classList.remove('is-active');
                activeNewsItem = null;
            }
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
            const defaultLabel = getNestedValue(translations[currentLang], 'news.modalLink') || (currentLang === 'ja' ? 'こちら →' : 'Here →');
            return item.link_label || defaultLabel;
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

        // タッチ状態管理用のオブジェクト（各要素ごとに独立）
        const touchState = {
            startY: 0,
            startX: 0,
            startTime: 0,
            moved: false,
            cancelled: false
        };

        const SCROLL_THRESHOLD = 15; // 15px以上移動したらスクロールと判定（少し緩和）
        const MAX_TAP_TIME = 300; // 300ms以内のタッチはタップと判定
        const MAX_TAP_DISTANCE = 10; // 10px以内の移動はタップと判定

        // タッチ開始
        a.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchState.startY = touch.clientY;
            touchState.startX = touch.clientX;
            touchState.startTime = Date.now();
            touchState.moved = false;
            touchState.cancelled = false;
        }, { passive: true });

        // タッチ移動（スクロール検知）
        a.addEventListener('touchmove', (e) => {
            if (touchState.cancelled) return;
            
            const touch = e.touches[0];
            const deltaY = Math.abs(touch.clientY - touchState.startY);
            const deltaX = Math.abs(touch.clientX - touchState.startX);
            const distance = Math.sqrt(deltaY * deltaY + deltaX * deltaX);
            
            // 移動距離が閾値を超えたらスクロールと判定
            if (distance > SCROLL_THRESHOLD) {
                // 縦方向の移動が横方向より大きい場合のみスクロールと判定
                if (deltaY > deltaX * 1.5) {
                    touchState.moved = true;
                }
            }
        }, { passive: true });

        // タッチ終了（クリック判定）
        a.addEventListener('touchend', (e) => {
            if (touchState.cancelled) {
                touchState.cancelled = false;
                return;
            }

            const touchTime = Date.now() - touchState.startTime;
            const touch = e.changedTouches[0];
            const deltaY = Math.abs(touch.clientY - touchState.startY);
            const deltaX = Math.abs(touch.clientX - touchState.startX);
            const distance = Math.sqrt(deltaY * deltaY + deltaX * deltaX);

            // スクロール判定：移動距離が閾値を超えている、または時間が長すぎる
            const isScroll = touchState.moved || 
                            distance > SCROLL_THRESHOLD || 
                            touchTime > MAX_TAP_TIME ||
                            (deltaY > MAX_TAP_DISTANCE && deltaY > deltaX * 1.5);

            if (isScroll) {
                // スクロールの場合は何もしない
                touchState.moved = false;
                return;
            }

            // タップと判定：短時間で短距離のタッチ
            e.preventDefault();
            e.stopPropagation();
            
            // 少し遅延を入れて確実にクリックイベントを発火
            setTimeout(() => {
                if (!touchState.cancelled) {
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        detail: 1
                    });
                    a.dispatchEvent(clickEvent);
                }
            }, 50);
        }, { passive: false });

        // タッチキャンセル
        a.addEventListener('touchcancel', () => {
            touchState.cancelled = true;
            touchState.moved = false;
        }, { passive: true });

        // Modal Click Event
        let isProcessing = false;
        a.addEventListener('click', (e) => {
            // 処理中の重複実行を防ぐ
            if (isProcessing) {
                e.preventDefault();
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            
            if (modal && modal.open) {
                isProcessing = true;
                
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
                
                modal.open(a); // クリックされた記事を渡す
                
                // 処理完了後にフラグをリセット（少し遅延を入れる）
                setTimeout(() => {
                    isProcessing = false;
                }, 300);
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
        
        // 追加記事用のスクロールコンテナを作成
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'news-more-scroll-container';
        scrollContainer.style.display = 'none'; // 初期状態は非表示
        
        // 残りのアイテムをスクロールコンテナ内に追加
        remainingItems.forEach(item => {
            const hiddenItem = createNewsItem(item, false);
            scrollContainer.appendChild(hiddenItem);
        });
        
        // スクロールコンテナを「もっと見る」ボタンの前に挿入
        moreWrapper.parentNode.insertBefore(scrollContainer, moreWrapper);

        // スクロールコンテナ内でのマウスホイールイベントを処理（Lenisの干渉を防ぐ）
        scrollContainer.addEventListener('wheel', (e) => {
            // スクロールコンテナが展開されている場合のみ処理
            if (!scrollContainer.classList.contains('is-expanded')) {
                return;
            }
            
            // スクロールコンテナの境界内かチェック
            const rect = scrollContainer.getBoundingClientRect();
            const isInside = e.clientY >= rect.top && e.clientY <= rect.bottom &&
                            e.clientX >= rect.left && e.clientX <= rect.right;
            
            if (isInside) {
                const scrollTop = scrollContainer.scrollTop;
                const scrollHeight = scrollContainer.scrollHeight;
                const clientHeight = scrollContainer.clientHeight;
                const maxScroll = scrollHeight - clientHeight;
                
                // スクロール可能かチェック
                const canScrollDown = scrollTop < maxScroll - 1; // 1pxの余裕を持たせる
                const canScrollUp = scrollTop > 1; // 1pxの余裕を持たせる
                
                // 下方向にスクロール可能な場合
                if (e.deltaY > 0 && canScrollDown) {
                    e.preventDefault();
                    e.stopPropagation();
                    scrollContainer.scrollTop += e.deltaY;
                    return;
                }
                
                // 上方向にスクロール可能な場合
                if (e.deltaY < 0 && canScrollUp) {
                    e.preventDefault();
                    e.stopPropagation();
                    scrollContainer.scrollTop += e.deltaY;
                    return;
                }
                
                // スクロールコンテナの端に達している場合は、親のスクロールに伝播させる
                // （何もしない = イベントをそのまま伝播）
            }
        }, { passive: false });

        // スマホ版のタッチスクロール処理（最上部/最下部でページスクロールに移行）
        const isMobileSmall = window.matchMedia('(max-width: 768px)').matches;
        
        if (isMobileSmall) {
            let touchStartY = 0;
            let lastTouchY = 0;
            let isScrollingContainer = false;
            let allowPageScroll = false;
            let initialScrollY = 0;

            const handleTouchStart = (e) => {
                if (!scrollContainer.classList.contains('is-expanded')) {
                    return;
                }
                
                touchStartY = e.touches[0].clientY;
                lastTouchY = touchStartY;
                isScrollingContainer = false;
                allowPageScroll = false;
                initialScrollY = window.scrollY || window.pageYOffset || 0;
            };

            const handleTouchMove = (e) => {
                if (!scrollContainer.classList.contains('is-expanded')) {
                    return;
                }

                const touchY = e.touches[0].clientY;
                const deltaY = lastTouchY - touchY;
                const scrollTop = scrollContainer.scrollTop;
                const scrollHeight = scrollContainer.scrollHeight;
                const clientHeight = scrollContainer.clientHeight;
                const maxScroll = Math.max(0, scrollHeight - clientHeight);

                // スクロール可能かチェック（少し余裕を持たせる）
                const threshold = 1; // 1pxの余裕
                const isAtTop = scrollTop <= threshold;
                const isAtBottom = scrollTop >= maxScroll - threshold;
                const canScrollDown = scrollTop < maxScroll - threshold;
                const canScrollUp = scrollTop > threshold;

                // スクロール方向を判定
                const isScrollingDown = deltaY < 0;
                const isScrollingUp = deltaY > 0;

                // 下方向にスクロールしようとしている場合
                if (isScrollingDown) {
                    // 最下部に達している場合は、ページスクロールに移行
                    if (isAtBottom) {
                        isScrollingContainer = false;
                        allowPageScroll = true;
                        // preventDefaultを呼ばず、イベントを親要素に伝播
                        // 親要素（window）に直接スクロールイベントを送る
                        const currentScrollY = window.scrollY || window.pageYOffset || 0;
                        const pageScrollDelta = -deltaY; // 下方向なので負の値
                        window.scrollTo({
                            top: currentScrollY + pageScrollDelta,
                            behavior: 'auto'
                        });
                        lastTouchY = touchY;
                        return;
                    }
                    // スクロール可能な場合は、コンテナ内でスクロール
                    if (canScrollDown) {
                        e.preventDefault();
                        e.stopPropagation();
                        isScrollingContainer = true;
                        allowPageScroll = false;
                        const newScrollTop = Math.max(0, Math.min(maxScroll, scrollTop - deltaY));
                        scrollContainer.scrollTop = newScrollTop;
                        lastTouchY = touchY;
                    }
                }
                // 上方向にスクロールしようとしている場合
                else if (isScrollingUp) {
                    // 最上部に達している場合は、ページスクロールに移行
                    if (isAtTop) {
                        isScrollingContainer = false;
                        allowPageScroll = true;
                        // preventDefaultを呼ばず、イベントを親要素に伝播
                        // 親要素（window）に直接スクロールイベントを送る
                        const currentScrollY = window.scrollY || window.pageYOffset || 0;
                        const pageScrollDelta = -deltaY; // 上方向なので正の値
                        window.scrollTo({
                            top: currentScrollY + pageScrollDelta,
                            behavior: 'auto'
                        });
                        lastTouchY = touchY;
                        return;
                    }
                    // スクロール可能な場合は、コンテナ内でスクロール
                    if (canScrollUp) {
                        e.preventDefault();
                        e.stopPropagation();
                        isScrollingContainer = true;
                        allowPageScroll = false;
                        const newScrollTop = Math.max(0, Math.min(maxScroll, scrollTop - deltaY));
                        scrollContainer.scrollTop = newScrollTop;
                        lastTouchY = touchY;
                    }
                } else {
                    // deltaYが0に近い場合は、位置を更新するだけ
                    lastTouchY = touchY;
                }
            };

            const handleTouchEnd = (e) => {
                if (!scrollContainer.classList.contains('is-expanded')) {
                    return;
                }
                isScrollingContainer = false;
                allowPageScroll = false;
            };

            scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
            scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
            scrollContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
        }

        // 「もっと見る」ボタンのイベント（重複防止）
        // 既存のイベントリスナーを削除
        const newMoreBtn = moreBtn.cloneNode(true);
        moreBtn.parentNode.replaceChild(newMoreBtn, moreBtn);
        const currentMoreBtn = newMoreBtn;
        
        if (!currentMoreBtn.dataset.initialized) {
            currentMoreBtn.addEventListener('click', () => {
                const isExpanded = currentMoreBtn.dataset.expanded === 'true';
                
                if (!isExpanded) {
                    // 展開：スクロールコンテナを表示
                    scrollContainer.style.display = 'block';
                    const isMobile = window.matchMedia('(max-width: 768px)').matches;
                    const maxHeight = isMobile ? '300px' : '500px';
                    const padding = isMobile ? '1rem' : '1.5rem';
                    // レイアウトを確定させるために少し待機
                    setTimeout(() => {
                        scrollContainer.classList.add('is-expanded');
                        gsap.fromTo(scrollContainer, 
                            { 
                                opacity: 0, 
                                maxHeight: 0,
                                marginTop: 0,
                                paddingTop: 0,
                                paddingBottom: 0
                            },
                            { 
                                opacity: 1, 
                                maxHeight: maxHeight,
                                marginTop: '1rem',
                                paddingTop: padding,
                                paddingBottom: padding,
                                duration: 0.4, 
                                ease: 'power2.out'
                            }
                        );
                    }, 10);
                    const iconEl = currentMoreBtn.querySelector('.news-more-icon');
                    if (iconEl) iconEl.textContent = '−';
                    currentMoreBtn.dataset.expanded = 'true';
                    const collapseLabel = getNestedValue(translations[currentLang], 'news.collapseButton') || (currentLang === 'ja' ? '折りたたむ' : 'Show Less');
                    currentMoreBtn.setAttribute('aria-label', collapseLabel);
                } else {
                    // 折りたたみ：スクロールコンテナを非表示
                    gsap.to(scrollContainer, {
                        opacity: 0,
                        maxHeight: 0,
                        marginTop: 0,
                        paddingTop: 0,
                        paddingBottom: 0,
                        duration: 0.3,
                        ease: 'power2.in',
                        onComplete: () => {
                            scrollContainer.style.display = 'none';
                            scrollContainer.classList.remove('is-expanded');
                            
                            // +ボタンが画面中央に来るようにスクロール位置を調整
                            setTimeout(() => {
                                const moreBtnRect = currentMoreBtn.getBoundingClientRect();
                                const scrollY = window.scrollY || window.pageYOffset || 0;
                                const moreBtnTop = moreBtnRect.top + scrollY;
                                
                                // 画面の中央に来るように調整
                                const viewportHeight = window.innerHeight;
                                const targetScroll = moreBtnTop - (viewportHeight / 2) + (moreBtnRect.height / 2);
                                
                                if (lenis) {
                                    lenis.scrollTo(targetScroll, {
                                        duration: 0.6,
                                        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                                        offset: 0
                                    });
                                } else {
                                    window.scrollTo({
                                        top: targetScroll,
                                        behavior: 'smooth'
                                    });
                                }
                            }, 100);
                        }
                    });
                    const iconEl = currentMoreBtn.querySelector('.news-more-icon');
                    if (iconEl) iconEl.textContent = '+';
                    currentMoreBtn.dataset.expanded = 'false';
                    const moreLabel = getNestedValue(translations[currentLang], 'news.moreButton') || (currentLang === 'ja' ? 'もっと見る' : 'Show More');
                    currentMoreBtn.setAttribute('aria-label', moreLabel);
                }
            });
            currentMoreBtn.dataset.initialized = 'true';
            currentMoreBtn.dataset.expanded = 'false';
            const initialMoreLabel = getNestedValue(translations[currentLang], 'news.moreButton') || (currentLang === 'ja' ? 'もっと見る' : 'Show More');
            currentMoreBtn.setAttribute('aria-label', initialMoreLabel);
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
    // スマホでは画面幅が狭いため、より多くのセットが必要
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const LOOP_SETS = isMobile ? 12 : 6; // スマホでは12セット、PCでは6セット

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
    // isMobile は上で既に定義済み
    const marqueeDuration = isMobile ? 40 : 35; // Slower, more elegant speed

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
// Spotify Embed用の状態管理
let currentEmbedTrackId = null;

// Spotify API取得用のPromise共有（複数回呼ばれても1回のみリクエスト）
let spotifyPromise = null;

// localStorageキャッシュのキー
const SPOTIFY_CACHE_KEY = 'spotify_cache_v1';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24時間（ミリ秒）

// localStorageからキャッシュを読み込む
function loadSpotifyCache() {
    try {
        const cached = localStorage.getItem(SPOTIFY_CACHE_KEY);
        if (!cached) return null;
        
        const parsed = JSON.parse(cached);
        const now = Date.now();
        
        // 30分を超えている場合は無効
        if (now - parsed.timestamp > CACHE_MAX_AGE) {
            localStorage.removeItem(SPOTIFY_CACHE_KEY);
            return null;
        }
        
        return parsed.data;
    } catch (e) {
        // パースエラーなどは無視
        return null;
    }
}

// localStorageにキャッシュを保存
function saveSpotifyCache(data) {
    try {
        const cacheData = {
            data: data,
            timestamp: Date.now(),
        };
        localStorage.setItem(SPOTIFY_CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
        // 保存失敗は無視（localStorageが無効な場合など）
    }
}

// データをレンダリング（共通処理）
function renderDiscographyData(data) {
    const featuredEl = document.getElementById('discography-featured');
    const gridEl = document.getElementById('discography-grid');
    
    if (!featuredEl || !gridEl) return;
    
    const albums = data.albums;
    const latestAlbum = albums[0];
    const otherAlbums = albums.slice(1);
    const artistId = data.artistId || '';

    if (latestAlbum) {
        renderLatestReleaseLP(latestAlbum, featuredEl);
        featuredEl.style.display = 'block';
    }

    if (otherAlbums.length > 0) {
        renderRailLP(otherAlbums, gridEl, artistId);
        gridEl.style.display = 'flex';
    }
}

function loadSpotifyOnce() {
    // 既にリクエスト中のPromiseがあればそれを返す
    if (spotifyPromise) {
        return spotifyPromise;
    }

    // 新しいリクエストを作成
    spotifyPromise = fetch('/api/spotify')
        .then((res) => {
            if (res.status === 200) {
                return res.json();
            }
            throw new Error(`HTTP ${res.status}`);
        })
        .then((response) => {
            // 新しいレスポンス形式（success/data/message）に対応
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response format');
            }
            
            // success: false の場合はエラー
            if (response.success === false) {
                throw new Error(response.message || 'Failed to fetch Spotify data');
            }
            
            // success: true の場合、data から取得
            const data = response.data || response;
            
            // 後方互換性のため、直接albumsがある場合も対応
            const albums = data.albums || response.albums;
            if (!albums || !Array.isArray(albums) || albums.length === 0) {
                throw new Error('no albums');
            }
            
            // 成功時はキャッシュを更新
            const cacheData = {
                artistId: data.artistId || response.artistId || '',
                albums: albums
            };
            saveSpotifyCache(cacheData);
            return cacheData;
        })
        .catch((err) => {
            // エラー時はPromiseをリセットして再試行可能にする
            spotifyPromise = null;
            throw err;
        });

    return spotifyPromise;
}

function initLandingDiscography() {
    // 初期化の多重実行を防ぐ
    if (window.__discographyInitDone) return;
    window.__discographyInitDone = true;
    
    const featuredEl = document.getElementById('discography-featured');
    const gridEl = document.getElementById('discography-grid');
    const loadingEl = document.getElementById('discography-loading-lp');
    const errorEl = document.getElementById('discography-error-lp');

    if (!featuredEl || !gridEl) return;

    const hideLoading = () => {
        if (loadingEl) loadingEl.style.display = 'none';
    };

    const showError = () => {
        if (errorEl) errorEl.style.display = 'block';
    };

    // まずlocalStorageからキャッシュを読み込んで即レンダリング
    const cachedData = loadSpotifyCache();
    if (cachedData) {
        renderDiscographyData(cachedData);
        hideLoading();
    }

    // 次に /api/spotify をfetchして成功したらキャッシュ更新＆再レンダリング
    loadSpotifyOnce()
        .then((data) => {
            // キャッシュから表示済みの場合でも、最新データで再レンダリング
            renderDiscographyData(data);
            hideLoading();
        })
        .catch((err) => {
            // fetch失敗時はshowError()を出さない（キャッシュ表示を維持）
            // ただし、キャッシュも無い場合のみエラー表示
            if (!cachedData) {
                hideLoading();
                showError();
            }
            // キャッシュがある場合は何もしない（既に表示済み）
        });
}

// 最新アルバム/シングルを大きく表示（常にトラックリストを表示）
function renderLatestReleaseLP(album, targetEl) {
    if (!targetEl) return;

    const imageUrl = album?.image || '';
    const albumName = album?.name || 'Unknown Album';
    const albumType = album?.album_type || 'album';
    const releaseDate = album?.release_date || '';
    const albumId = album?.id || `featured-${Date.now()}`;
    const tracks = album?.tracks || [];

    const formattedDate = releaseDate ? releaseDate.split('T')[0] : '';
    const isEnglish = currentLang === 'en';

    // トラックリストを生成
    const tracksList = tracks.map((track, index) => {
        return `
            <div class="track-list-item" data-track-id="${escapeHtml(track.id)}">
                <span class="track-number">${track.track_number || index + 1}</span>
                <span class="track-name">${escapeHtml(track.name)}</span>
                <button class="track-play-button" aria-label="${isEnglish ? 'Play track' : '再生'}">
                    <span class="music-icon">♪</span>
                </button>
            </div>
        `;
    }).join('');

    targetEl.innerHTML = `
        <div class="discography-featured-content" data-album-id="${escapeHtml(albumId)}">
            <div class="discography-featured-image-wrapper">
                <img src="${imageUrl}" alt="${escapeHtml(albumName)}" class="discography-featured-image" loading="lazy">
                <div class="featured-label">
                    New Release${formattedDate ? ` ${formattedDate}` : ''}
                </div>
            </div>
            <div class="discography-featured-info">
                <h2 class="discography-featured-title">${escapeHtml(albumName)}</h2>
                ${tracks.length > 0 ? `
                    <div class="discography-featured-tracks">
                        <div class="tracks-list">
                            ${tracksList}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // トラックリストアイテムのクリックイベント
    const trackItems = targetEl.querySelectorAll('.track-list-item');
    trackItems.forEach((item) => {
        const playButton = item.querySelector('.track-play-button');
        const trackId = item.dataset.trackId;
        
        // 再生ボタンのクリックイベント
        if (playButton) {
            playButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (trackId) {
                    // すべてのトラックリストアイテムからis-activeを削除
                    removeAllActiveStates();
                    
                    // プレーヤーを開いた場合のみis-activeを追加（閉じた場合は追加しない）
                    const playerOpened = showGlobalSpotifyPlayer(trackId);
                    if (playerOpened) {
                        // クリックされたアイテムにis-activeを追加
                        item.classList.add('is-active');
                    }
                }
            });
        }
        
        // トラックリストアイテム全体のクリックイベント（再生ボタン以外）
        item.addEventListener('click', (e) => {
            // 再生ボタンがクリックされた場合は処理しない
            if (e.target.closest('.track-play-button')) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            if (trackId) {
                // すべてのトラックリストアイテムからis-activeを削除
                removeAllActiveStates();
                
                // プレーヤーを開いた場合のみis-activeを追加（閉じた場合は追加しない）
                const playerOpened = showGlobalSpotifyPlayer(trackId);
                if (playerOpened) {
                    // クリックされたアイテムにis-activeを追加
                    item.classList.add('is-active');
                }
            }
        });
    });
}


// 残りのアルバム/シングルを横スクロールで表示
function renderRailLP(albums, gridEl, artistId) {
    if (!gridEl) return;

    gridEl.classList.add('discography-rail');

    const cards = albums.map((album) => {
        const imageUrl = album?.image || '';
        const albumName = album?.name || 'Unknown Album';
        const albumType = album?.album_type || 'album';
        const releaseDate = album?.release_date || '';
        const albumId = album?.id || `grid-${Date.now()}-${Math.random()}`;
        const year = releaseDate ? releaseDate.split('-')[0] : '';
        const isEnglish = currentLang === 'en';

        return `
            <div class="album-card" data-album-id="${escapeHtml(albumId)}">
                <div class="album-card-image-wrapper">
                    <img src="${imageUrl}" alt="${escapeHtml(albumName)}" class="album-card-image" loading="lazy">
                </div>
                <div class="album-card-body">
                    <div class="album-card-title">${escapeHtml(albumName)}</div>
                    ${year ? `<div class="album-card-year">${year}</div>` : ''}
                </div>
                <div class="album-tracks-list">
                    ${(album.tracks || []).map((track, index) => {
                        return `
                            <div class="track-list-item" data-track-id="${escapeHtml(track.id)}">
                                <span class="track-number">${track.track_number || index + 1}</span>
                                <div class="track-name-wrapper">
                                    <span class="track-name">${escapeHtml(track.name)}</span>
                                    <button class="track-play-button" aria-label="${isEnglish ? 'Play track' : '再生'}">
                                        <span class="music-icon">♪</span>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');

    gridEl.innerHTML = cards;

    // トラックリストをScrollTriggerの影響から完全に分離
    // すべてのalbum-card内のトラックリストに対して、ScrollTriggerの影響を無効化
    gridEl.querySelectorAll('.album-tracks-list').forEach(tracksList => {
        // ScrollTriggerがトラックリストに影響しないように、明示的にスタイルを設定
        tracksList.style.pointerEvents = 'auto';
        tracksList.style.overflow = 'visible';
        tracksList.style.willChange = 'height, opacity';
        // ScrollTriggerの影響を無効化するため、transformをリセット
        gsap.set(tracksList, { clearProps: 'transform' });
    });

    // すべての展開されているトラックリストを閉じる関数
    // ScrollTriggerの影響を受けないように、純粋なclickイベントで処理
    const closeAllTracksLists = () => {
        gridEl.querySelectorAll('.album-card.is-expanded').forEach(card => {
            card.classList.remove('is-expanded');
            const tracksList = card.querySelector('.album-tracks-list');
            if (tracksList) {
                // ScrollTriggerの影響を無視して、直接スタイルを操作
                tracksList.style.pointerEvents = 'auto';
                tracksList.style.overflow = 'visible';
                gsap.to(tracksList, {
                    height: 0,
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.in',
                    immediateRender: false, // ScrollTriggerの影響を避ける
                    onComplete: () => {
                        tracksList.style.display = 'none';
                        // ScrollTriggerの影響を完全に無効化
                        tracksList.style.pointerEvents = 'auto';
                        tracksList.style.overflow = 'visible';
                    }
                });
            }
        });
    };

    // discographyセクション内の余白をクリックしたときにトラックリストを閉じる
    const discographySection = document.getElementById('discography');
    if (discographySection) {
        discographySection.addEventListener('click', (e) => {
            // アルバムカードやその子要素がクリックされた場合は何もしない
            if (e.target.closest('.album-card')) {
                return;
            }
            // トラックリストアイテムがクリックされた場合も何もしない（再生処理があるため）
            if (e.target.closest('.track-list-item')) {
                return;
            }
            // 音楽サービスリンクがクリックされた場合も何もしない
            if (e.target.closest('.discography-streaming-links')) {
                return;
            }
            // その他の要素（余白）がクリックされた場合はトラックリストを閉じる
            closeAllTracksLists();
        });
    }

    // album-cardのクリックイベント
    gridEl.querySelectorAll('.album-card').forEach((card) => {
        const imageWrapper = card.querySelector('.album-card-image-wrapper');
        const tracksList = card.querySelector('.album-tracks-list');
        const trackItems = card.querySelectorAll('.track-list-item');
        
        // トラックリストをScrollTriggerの影響から完全に分離
        // pointer-events、height、overflowをScrollTrigger側で触らないようにする
        if (tracksList) {
            // ScrollTriggerがトラックリストに影響しないように、明示的にスタイルをリセット
            tracksList.style.pointerEvents = 'auto';
            tracksList.style.overflow = 'visible';
            // ScrollTriggerの影響を無効化するため、will-changeを設定
            tracksList.style.willChange = 'height, opacity';
        }
        
        // ジャケット画像のクリックでトラックリストを開閉
        // ScrollTriggerと無関係な純粋なclickイベントで処理
        if (imageWrapper) {
            imageWrapper.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // 他のカードのトラックリストを閉じる
                gridEl.querySelectorAll('.album-card').forEach(c => {
                    if (c !== card) {
                        c.classList.remove('is-expanded');
                        const otherTracksList = c.querySelector('.album-tracks-list');
                        if (otherTracksList) {
                            // ScrollTriggerの影響を無視して、直接スタイルを操作
                            otherTracksList.style.pointerEvents = 'auto';
                            otherTracksList.style.overflow = 'visible';
                            gsap.to(otherTracksList, {
                                height: 0,
                                opacity: 0,
                                duration: 0.3,
                                ease: 'power2.in',
                                immediateRender: false, // ScrollTriggerの影響を避ける
                                onComplete: () => {
                                    otherTracksList.style.display = 'none';
                                    // ScrollTriggerの影響を完全に無効化
                                    otherTracksList.style.pointerEvents = 'auto';
                                    otherTracksList.style.overflow = 'visible';
                                }
                            });
                        }
                    }
                });
                
                // イベントの伝播を防ぐ（余白クリック処理が発動しないように）
                e.stopPropagation();
                
                // このカードのトラックリストを開閉
                const isExpanded = card.classList.contains('is-expanded');
                if (isExpanded) {
                    card.classList.remove('is-expanded');
                    if (tracksList) {
                        // ScrollTriggerの影響を無視して、直接スタイルを操作
                        tracksList.style.pointerEvents = 'auto';
                        tracksList.style.overflow = 'visible';
                        gsap.to(tracksList, {
                            height: 0,
                            opacity: 0,
                            duration: 0.3,
                            ease: 'power2.in',
                            immediateRender: false, // ScrollTriggerの影響を避ける
                            onComplete: () => {
                                tracksList.style.display = 'none';
                                // ScrollTriggerの影響を完全に無効化
                                tracksList.style.pointerEvents = 'auto';
                                tracksList.style.overflow = 'visible';
                            }
                        });
                    }
                } else {
                    card.classList.add('is-expanded');
                    if (tracksList) {
                        // ScrollTriggerの影響を無視して、直接スタイルを操作
                        tracksList.style.pointerEvents = 'auto';
                        tracksList.style.overflow = 'visible';
                        tracksList.style.display = 'block';
                        // レイアウトを確定させるために少し待機
                        setTimeout(() => {
                            gsap.fromTo(tracksList, 
                                { height: 0, opacity: 0 },
                                { 
                                    height: 'auto',
                                    opacity: 1,
                                    duration: 0.4,
                                    ease: 'power2.out',
                                    immediateRender: false, // ScrollTriggerの影響を避ける
                                    onComplete: () => {
                                        // ScrollTriggerの影響を完全に無効化
                                        tracksList.style.pointerEvents = 'auto';
                                        tracksList.style.overflow = 'visible';
                                    }
                                }
                            );
                        }, 10);
                    }
                }
            });
        }
        
        // トラックリストアイテムのクリックイベント
        trackItems.forEach((item) => {
            const playButton = item.querySelector('.track-play-button');
            const trackId = item.dataset.trackId;
            
            // 再生ボタンのクリックイベント
            if (playButton) {
                playButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (trackId) {
                        // すべてのトラックリストアイテムからis-activeを削除
                        removeAllActiveStates();
                        
                        // プレーヤーを開いた場合のみis-activeを追加（閉じた場合は追加しない）
                        const playerOpened = showGlobalSpotifyPlayer(trackId);
                        if (playerOpened) {
                            // クリックされたアイテムにis-activeを追加
                            item.classList.add('is-active');
                        }
                    }
                });
            }
            
            // トラックリストアイテム全体のクリックイベント（再生ボタン以外）
            item.addEventListener('click', (e) => {
                // 再生ボタンがクリックされた場合は処理しない
                if (e.target.closest('.track-play-button')) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation(); // 余白クリック処理が発動しないように
                if (trackId) {
                    // すべてのトラックリストアイテムからis-activeを削除
                    removeAllActiveStates();
                    
                    // プレーヤーを開いた場合のみis-activeを追加（閉じた場合は追加しない）
                    const playerOpened = showGlobalSpotifyPlayer(trackId);
                    if (playerOpened) {
                        // クリックされたアイテムにis-activeを追加
                        item.classList.add('is-active');
                    }
                }
            });
        });
    });

    // 末尾の音楽サービスリンクアイコン（スクロール外に配置して跳ね返りを防ぐ）
    const parent = gridEl.parentElement;
    if (parent) {
        // 既存のリンクコンテナを削除
        parent.querySelectorAll('.discography-streaming-links').forEach((el) => el.remove());
        
        const linksContainer = document.createElement('div');
        linksContainer.className = 'discography-streaming-links';
        
        // 各音楽サービスへのリンク（4つのサービス）
        const streamingServices = [
            {
                name: 'Spotify',
                icon: 'fa-brands fa-spotify',
                href: artistId ? `https://open.spotify.com/artist/${artistId}` : 'https://open.spotify.com/search/masato%20hayashi',
                ariaLabel: 'SpotifyでMasato Hayashiを聴く'
            },
            {
                name: 'Apple Music',
                icon: 'fa-brands fa-apple',
                href: 'https://music.apple.com/jp/search?term=masato%20hayashi',
                ariaLabel: 'Apple MusicでMasato Hayashiを聴く'
            },
            {
                name: 'YouTube Music',
                icon: 'fa-brands fa-youtube',
                href: 'https://music.youtube.com/search?q=masato%20hayashi',
                ariaLabel: 'YouTube MusicでMasato Hayashiを聴く'
            },
            {
                name: 'Amazon Music',
                icon: 'fa-brands fa-amazon',
                href: 'https://music.amazon.co.jp/search/masato%20hayashi',
                ariaLabel: 'Amazon MusicでMasato Hayashiを聴く'
            }
        ];
        
        streamingServices.forEach((service) => {
            const link = document.createElement('a');
            link.className = 'streaming-link';
            link.href = service.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('aria-label', service.ariaLabel);
            link.innerHTML = `<i class="${service.icon}"></i>`;
            linksContainer.appendChild(link);
        });
        
        parent.appendChild(linksContainer);
    }
}


// すべてのis-activeクラスを削除する関数
function removeAllActiveStates() {
    // すべてのトラックリストアイテムからis-activeを削除
    document.querySelectorAll('.track-list-item.is-active').forEach(el => {
        el.classList.remove('is-active');
    });
}

// プレーヤーを閉じる共通処理
function closeSpotifyPlayer() {
    const playerEl = document.getElementById('spotify-global-player');
    if (!playerEl) return;
    
    playerEl.classList.remove('active');
    const embedContainer = playerEl.querySelector('.spotify-player-embed');
    if (embedContainer) {
        embedContainer.innerHTML = '';
    }
    currentEmbedTrackId = null;

    // すべてのis-playingを解除
    document.querySelectorAll('.track-card.is-playing, .discography-featured-content.is-playing').forEach(el => {
        el.classList.remove('is-playing');
    });
    
    // すべてのis-activeを解除（色を戻す）
    removeAllActiveStates();
}

// グローバルなSpotifyプレーヤーを表示（フッター固定）
// 戻り値: true = プレーヤーを開いた, false = プレーヤーを閉じた
function showGlobalSpotifyPlayer(trackId) {
    let playerEl = document.getElementById('spotify-global-player');

    if (!playerEl) {
        playerEl = document.createElement('div');
        playerEl.id = 'spotify-global-player';
        playerEl.className = 'spotify-global-player';
        const closeLabel = getNestedValue(translations[currentLang], 'player.close') || (currentLang === 'ja' ? 'プレーヤーを閉じる' : 'Close player');
        playerEl.innerHTML = `
            <button class="spotify-player-close" aria-label="${closeLabel}">×</button>
            <div class="spotify-player-embed"></div>
        `;
        document.body.appendChild(playerEl);

        // 閉じるボタンのクリックイベント
        playerEl.querySelector('.spotify-player-close').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSpotifyPlayer();
        });

        // プレーヤーの外側（ページの他の部分）をクリックしたときに閉じる
        const handleOutsideClick = (e) => {
            // プレーヤー自体やその子要素がクリックされた場合は何もしない
            if (playerEl.contains(e.target)) {
                return;
            }
            
            // プレーヤーがアクティブな場合のみ閉じる
            if (playerEl.classList.contains('active')) {
                closeSpotifyPlayer();
            }
        };
        
        // プレーヤーがアクティブなときのみ外側クリックを監視
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (playerEl.classList.contains('active')) {
                        // プレーヤーがアクティブになったら外側クリックを監視
                        document.addEventListener('click', handleOutsideClick);
                    } else {
                        // プレーヤーが非アクティブになったら外側クリックの監視を解除
                        document.removeEventListener('click', handleOutsideClick);
                        // プレーヤーが閉じられたときに確実に色を戻す
                        removeAllActiveStates();
                    }
                }
            });
        });
        
        observer.observe(playerEl, { attributes: true, attributeFilter: ['class'] });
    }

    const embedContainer = playerEl.querySelector('.spotify-player-embed');

    if (currentEmbedTrackId === trackId && playerEl.classList.contains('active')) {
        // 同じ曲なら閉じる
        closeSpotifyPlayer();
        return false; // プレーヤーを閉じた
    }

    currentEmbedTrackId = trackId;
    embedContainer.innerHTML = `
        <iframe 
            src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0&autoplay=true" 
            width="100%" 
            height="80" 
            frameBorder="0" 
            allowfullscreen="" 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
            loading="lazy">
        </iframe>
    `;
    playerEl.classList.add('active');
    return true; // プレーヤーを開いた
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
        // 改行を<br>タグに変換して表示
        statusEl.innerHTML = message ? message.replace(/\n/g, '<br>') : '';
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
            website: '', // ハニーポット: 常に空文字で送信
            timestamp: new Date().toISOString()
        };
    };

    const sendGet = async (params) => {
        try {
            const query = new URLSearchParams(params).toString();
            const url = `${API_URL}?${query}`;
            console.log('Contact form sending to:', url);
            const res = await fetch(url, { method: 'GET' });
            const json = await res.json();
            console.log('Contact form response:', json.ok ? 'ok' : `error: ${json.error || 'unknown'}`);
            if (!json.ok) {
                throw new Error(json.error || '送信に失敗しました。');
            }
            return json;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('NETWORK_ERROR');
            }
            throw error;
        }
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
            success: 'お問い合わせありがとうございます。\n内容を確認のうえ、担当者よりご連絡いたします。',
            error: '通信に失敗しました。時間をおいて再度お試しください。',
            networkError: 'ネットワークエラーが発生しました。インターネット接続を確認して再度お試しください。',
            serverError: 'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。'
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
            error: 'Communication failed. Please try again later.',
            networkError: 'A network error occurred. Please check your internet connection and try again.',
            serverError: 'A server error occurred. Please try again later.'
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
            await sendGet(payload);
            recordSubmit();
            setStatus('success', errorMessages.success);
            form.reset();
            updatePlaceholder();
            // 成功メッセージを数秒後にフェードアウト
            setTimeout(() => {
                if (statusEl) {
                    statusEl.classList.add('fade-out');
                    setTimeout(() => {
                        if (statusEl) {
                            statusEl.classList.remove('is-success', 'fade-out');
                            statusEl.textContent = '';
                        }
                    }, 500);
                }
            }, 3000);
        } catch (getError) {
            let errorMsg = errorMessages.error;
            if (getError.message === 'NETWORK_ERROR') {
                errorMsg = errorMessages.networkError;
            } else if (getError.message.includes('HTTP 5')) {
                errorMsg = errorMessages.serverError;
            } else if (getError.message && getError.message !== 'GET_FAILED') {
                errorMsg = getError.message;
            }
            setStatus('error', errorMsg);
            console.error('Form submission error:', getError);
        } finally {
            setButtonState(false);
        }
    });
}
