// /api/spotify.js

export default async function handler(req, res) {
  try {
    // Vercel Environment Variables に入れた値を読む
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const artistId = process.env.SPOTIFY_ARTIST_ID;

    if (!clientId || !clientSecret || !artistId) {
      return res.status(200).json({
        success: false,
        data: null,
        message: "Missing environment variables"
      });
    }

    // 1) App用トークン取得（Client Credentials Flow）
    let tokenResp;
    try {
      tokenResp = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        },
        body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
      });
    } catch (fetchError) {
      return res.status(200).json({
        success: false,
        data: null,
        message: "Failed to connect to Spotify API"
      });
    }

    if (!tokenResp.ok) {
      const errorText = await tokenResp.text().catch(() => '');
      return res.status(200).json({
        success: false,
        data: null,
        message: `Token request failed: ${tokenResp.status}`
      });
    }

    let tokenData;
    try {
      tokenData = await tokenResp.json();
    } catch (parseError) {
      return res.status(200).json({
        success: false,
        data: null,
        message: "Invalid token response format"
      });
    }

    const { access_token } = tokenData;
    if (!access_token) {
      return res.status(200).json({
        success: false,
        data: null,
        message: "No access token received"
      });
    }

    // 2) アーティストのアルバムを取得（シングルとアルバムのみ、市場はJP固定）
    let allAlbums = [];
    let nextUrl = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=JP&limit=50`;
    
    // ページネーションで全アルバムを取得
    while (nextUrl) {
      let albumsResp;
      try {
        albumsResp = await fetch(nextUrl, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
      } catch (fetchError) {
        return res.status(200).json({
          success: false,
          data: null,
          message: "Failed to fetch albums from Spotify API"
        });
      }
      
      if (!albumsResp.ok) {
        return res.status(200).json({
          success: false,
          data: null,
          message: `Albums request failed: ${albumsResp.status}`
        });
      }
      
      let albumsData;
      try {
        albumsData = await albumsResp.json();
      } catch (parseError) {
        return res.status(200).json({
          success: false,
          data: null,
          message: "Invalid albums response format"
        });
      }
      
      allAlbums = allAlbums.concat(albumsData.items || []);
      nextUrl = albumsData.next;
    }

    // 3) 各アルバムのトラックリストを取得
    let albumsWithTracks;
    try {
      albumsWithTracks = await Promise.all(
        allAlbums.map(async (album) => {
          let allTracks = [];
          let tracksNextUrl = `https://api.spotify.com/v1/albums/${album.id}/tracks?market=JP&limit=50`;
          
          // ページネーションで全トラックを取得
          while (tracksNextUrl) {
            let tracksResp;
            try {
              tracksResp = await fetch(tracksNextUrl, {
                headers: { Authorization: `Bearer ${access_token}` },
              });
            } catch (fetchError) {
              console.warn(`Failed to fetch tracks for album ${album.id}`);
              break;
            }
            
            if (!tracksResp.ok) {
              console.warn(`Failed to fetch tracks for album ${album.id}: ${tracksResp.status}`);
              break;
            }
            
            let tracksData;
            try {
              tracksData = await tracksResp.json();
            } catch (parseError) {
              console.warn(`Invalid tracks response for album ${album.id}`);
              break;
            }
            
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
    } catch (promiseError) {
      return res.status(200).json({
        success: false,
        data: null,
        message: "Failed to process album tracks"
      });
    }

    // 4) release_date降順でソート
    albumsWithTracks.sort((a, b) => {
      const da = a.release_date || '';
      const db = b.release_date || '';
      return db.localeCompare(da);
    });

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600"); // 5分キャッシュ
    return res.status(200).json({
      success: true,
      data: { artistId, albums: albumsWithTracks },
      message: null
    });
  } catch (e) {
    return res.status(200).json({
      success: false,
      data: null,
      message: `Unexpected error: ${String(e.message || e)}`
    });
  }
}
