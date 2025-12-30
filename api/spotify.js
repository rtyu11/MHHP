// /api/spotify.js
export default async function handler(req, res) {
    try {
      // Vercel Environment Variables に入れた値を読む
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      const artistId = process.env.SPOTIFY_ARTIST_ID; // 例: 5j7m1n3HAdmbJoYMizwzk2
  
      if (!clientId || !clientSecret || !artistId) {
        return res.status(500).json({
          error: "Missing env vars",
          required: ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_ARTIST_ID"],
        });
      }
  
      // 1) App用トークン取得（Client Credentials Flow）
      const tokenResp = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        },
        body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
      });
  
      if (!tokenResp.ok) {
        const t = await tokenResp.text();
        return res.status(500).json({ error: "Token request failed", detail: t });
      }
  
      const { access_token } = await tokenResp.json();
  
      // 2) アーティストのアルバムを取得（シングルとアルバムのみ、市場はJP固定）
      let allAlbums = [];
      let nextUrl = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=JP&limit=50`;
      
      // ページネーションで全アルバムを取得
      while (nextUrl) {
        const albumsResp = await fetch(nextUrl, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        
        if (!albumsResp.ok) {
          const t = await albumsResp.text();
          return res.status(500).json({ error: "Albums request failed", detail: t });
        }
        
        const albumsData = await albumsResp.json();
        allAlbums = allAlbums.concat(albumsData.items || []);
        nextUrl = albumsData.next;
      }
  
      // 3) 各アルバムのトラックリストを取得
      const albumsWithTracks = await Promise.all(
        allAlbums.map(async (album) => {
          let allTracks = [];
          let tracksNextUrl = `https://api.spotify.com/v1/albums/${album.id}/tracks?market=JP&limit=50`;
          
          // ページネーションで全トラックを取得
          while (tracksNextUrl) {
            const tracksResp = await fetch(tracksNextUrl, {
              headers: { Authorization: `Bearer ${access_token}` },
            });
            
            if (!tracksResp.ok) {
              console.warn(`Failed to fetch tracks for album ${album.id}`);
              break;
            }
            
            const tracksData = await tracksResp.json();
            allTracks = allTracks.concat(tracksData.items || []);
            tracksNextUrl = tracksData.next;
          }
          
          return {
            id: album.id,
            name: album.name,
            album_type: album.album_type, // 'album' or 'single'
            image: album.images?.[0]?.url || null,
            release_date: album.release_date || null,
            external_url: album.external_urls?.spotify || null,
            tracks: allTracks.map((track) => ({
              id: track.id,
              name: track.name,
              duration_ms: track.duration_ms,
              track_number: track.track_number,
              external_url: track.external_urls?.spotify || null,
            })),
          };
        })
      );
  
      // 4) release_date降順でソート
      albumsWithTracks.sort((a, b) => {
        const da = a.release_date || '';
        const db = b.release_date || '';
        return db.localeCompare(da);
      });
  
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600"); // 5分キャッシュ
      return res.status(200).json({ artistId, albums: albumsWithTracks });
    } catch (e) {
      return res.status(500).json({ error: "Unexpected error", detail: String(e) });
    }
  }
  