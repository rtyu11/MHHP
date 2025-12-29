(() => {
    const hasDocument = typeof document !== 'undefined' && document;
    if (!hasDocument) return;

    const escapeHtml = (text) => {
        const value = text ?? '';
        const div = document.createElement('div');
        div.textContent = String(value);
        return div.innerHTML;
    };

    const getEl = (id) => {
        if (!hasDocument) return null;
        try {
            return document.getElementById(id);
        } catch (_) {
            return null;
        }
    };

    const safelySetDisplay = (el, display) => {
        if (!el || !el.style) return;
        el.style.display = display;
    };

    const renderLatestRelease = (track, latestEl) => {
        if (!latestEl || !track) return;

        const album = track.album ?? {};
        const imageUrl = album.image ?? '';
        const trackName = track.name ?? 'Unknown Track';
        const releaseDate = album.release_date ?? '';
        const spotifyUrl = track.external_url ?? '';
        const formattedDate = releaseDate ? releaseDate.split('T')[0] : '';

        latestEl.innerHTML = `
            <div class="discography-hero-content">
                <div class="discography-hero-image-wrapper">
                    <img src="${imageUrl}" alt="${escapeHtml(trackName)}" class="discography-hero-image" loading="lazy">
                </div>
                <div class="discography-hero-info">
                    <h2 class="discography-hero-title">${escapeHtml(trackName)}</h2>
                    ${formattedDate ? `
                        <div class="discography-hero-release">
                            <span class="discography-hero-release-label">RELEASE</span>
                            <span>${formattedDate}</span>
                        </div>
                    ` : ''}
                    ${spotifyUrl ? `
                        <a href="${spotifyUrl}" target="_blank" rel="noopener" class="btn-spotify">
                            <i class="fa-brands fa-spotify"></i>
                            <span>Open in Spotify</span>
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    };

    const renderGrid = (tracks, gridEl) => {
        if (!gridEl || !Array.isArray(tracks)) return;

        const cards = tracks.map((track) => {
            const safeTrack = track ?? {};
            const album = safeTrack.album ?? {};
            const imageUrl = album.image ?? '';
            const trackName = safeTrack.name ?? 'Unknown Track';
            const releaseDate = album.release_date ?? '';
            const spotifyUrl = safeTrack.external_url ?? '';
            const year = releaseDate ? releaseDate.split('-')[0] : '';

            return `
                <div class="track-card" ${spotifyUrl ? `data-spotify-url="${escapeHtml(spotifyUrl)}"` : ''}>
                    <div class="track-card-image-wrapper">
                        <img src="${imageUrl}" alt="${escapeHtml(trackName)}" class="track-card-image" loading="lazy">
                        <div class="track-card-info">
                            <div class="track-card-title">${escapeHtml(trackName)}</div>
                            ${year ? `<div class="track-meta">${year}</div>` : ''}
                        </div>
                    </div>
                    <div class="track-card-name">${escapeHtml(trackName)}</div>
                    ${year ? `<div class="track-card-year">${year}</div>` : ''}
                </div>
            `;
        }).join('');

        gridEl.innerHTML = cards;

        const cardsEls = gridEl.querySelectorAll ? gridEl.querySelectorAll('.track-card') : [];
        cardsEls.forEach((card) => {
            const url = card?.dataset?.spotifyUrl;
            if (!url) return;
            card.addEventListener('click', () => {
                window.open(url, '_blank');
            });
        });
    };

    const fetchDiscography = async (els) => {
        const { loadingEl, errorEl, latestEl, gridEl } = els;

        try {
            const response = await fetch('/api/spotify');
            if (!response || !response.ok) {
                throw new Error(`HTTP ${response ? response.status : 'unknown'}`);
            }

            const data = await response.json();
            const tracks = Array.isArray(data?.tracks) ? data.tracks : [];
            if (!tracks.length) {
                throw new Error('No tracks');
            }

            const sortedTracks = [...tracks].sort((a, b) => {
                const dateA = (a?.album?.release_date ?? '');
                const dateB = (b?.album?.release_date ?? '');
                return dateB.localeCompare(dateA);
            });

            const [latestTrack, ...otherTracks] = sortedTracks;

            safelySetDisplay(loadingEl, 'none');

            if (latestTrack && latestEl) {
                renderLatestRelease(latestTrack, latestEl);
                safelySetDisplay(latestEl, 'block');
            }

            if (otherTracks.length && gridEl) {
                renderGrid(otherTracks, gridEl);
                safelySetDisplay(gridEl, 'grid');
            }
        } catch (err) {
            safelySetDisplay(loadingEl, 'none');
            if (errorEl) safelySetDisplay(errorEl, 'block');
        }
    };

    const onReady = () => {
        const loadingEl = getEl('discography-loading');
        const errorEl = getEl('discography-error');
        const latestEl = getEl('discography-latest');
        const gridEl = getEl('discography-grid');

        const hasTargets = loadingEl || errorEl || latestEl || gridEl;
        if (!hasTargets) return;

        fetchDiscography({ loadingEl, errorEl, latestEl, gridEl });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady, { once: true });
    } else {
        onReady();
    }
})();
