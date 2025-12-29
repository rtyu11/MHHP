// Discography Page - Spotify API Integration
document.addEventListener('DOMContentLoaded', () => {
    const loadingEl = document.getElementById('discography-loading');
    const errorEl = document.getElementById('discography-error');
    const latestEl = document.getElementById('discography-latest');
    const gridEl = document.getElementById('discography-grid');

    async function fetchDiscography() {
        try {
            const response = await fetch('/api/spotify');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.tracks || !Array.isArray(data.tracks) || data.tracks.length === 0) {
                throw new Error('No tracks found');
            }

            // Sort tracks by release_date (newest first)
            const sortedTracks = [...data.tracks].sort((a, b) => {
                const dateA = a.album?.release_date || '';
                const dateB = b.album?.release_date || '';
                return dateB.localeCompare(dateA);
            });

            // Get latest release (first track)
            const latestTrack = sortedTracks[0];
            const otherTracks = sortedTracks.slice(1);

            // Hide loading
            if (loadingEl) loadingEl.style.display = 'none';

            // Render latest release
            if (latestTrack && latestEl) {
                renderLatestRelease(latestTrack);
                latestEl.style.display = 'block';
            }

            // Render grid
            if (otherTracks.length > 0 && gridEl) {
                renderGrid(otherTracks);
                gridEl.style.display = 'grid';
            }

        } catch (error) {
            console.error('Error fetching discography:', error);
            
            // Hide loading
            if (loadingEl) loadingEl.style.display = 'none';
            
            // Show error
            if (errorEl) {
                errorEl.style.display = 'block';
            }
        }
    }

    function renderLatestRelease(track) {
        if (!latestEl) return;

        const imageUrl = track.album?.image || '';
        const trackName = track.name || 'Unknown Track';
        const releaseDate = track.album?.release_date || '';
        const spotifyUrl = track.external_url || '';

        // Format release date (YYYY-MM-DD -> YYYY-MM-DD)
        let formattedDate = '';
        if (releaseDate) {
            formattedDate = releaseDate.split('T')[0];
        }

        latestEl.innerHTML = `
            <div class="discography-hero-content">
                <div class="discography-hero-image-wrapper">
                    <img src="${imageUrl}" alt="${trackName}" class="discography-hero-image" loading="lazy">
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
    }

    function renderGrid(tracks) {
        if (!gridEl) return;

        gridEl.innerHTML = tracks.map(track => {
            const imageUrl = track.album?.image || '';
            const trackName = track.name || 'Unknown Track';
            const releaseDate = track.album?.release_date || '';
            const spotifyUrl = track.external_url || '';

            // Extract year from release date
            let year = '';
            if (releaseDate) {
                year = releaseDate.split('-')[0];
            }

            return `
                <div class="track-card" ${spotifyUrl ? `onclick="window.open('${spotifyUrl}', '_blank')"` : ''}>
                    <div class="track-card-image-wrapper">
                        <img src="${imageUrl}" alt="${trackName}" class="track-card-image" loading="lazy">
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
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize
    fetchDiscography();
});

