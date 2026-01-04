// /api/spotify.js

// メモリキャッシュ（warm instance内で保持）
let spotifyCache = null;
const SPOTIFY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24時間（ミリ秒）

// トークンキャッシュ
let tokenCache = null;

// アクセストークンを取得（キャッシュを利用）
async function getAccessToken(clientId, clientSecret) {
  const now = Date.now();
  
  // トークンキャッシュが有効ならそれを使用
  if (tokenCache && tokenCache.expiresAt > now) {
    return tokenCache.accessToken;
  }

  // トークンを取得
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
    throw new Error("Failed to connect to Spotify API");
  }

  if (!tokenResp.ok) {
    throw new Error(`Token request failed: ${tokenResp.status}`);
  }

  let tokenData;
  try {
    tokenData = await tokenResp.json();
  } catch (parseError) {
    throw new Error("Invalid token response format");
  }

  const { access_token, expires_in } = tokenData;
  if (!access_token) {
    throw new Error("No access token received");
  }

  // トークンをキャッシュ（expires_in秒 - 60秒のマージンで有効期限を設定）
  const expiresInMs = (expires_in || 3600) * 1000;
  tokenCache = {
    accessToken: access_token,
    expiresAt: now + expiresInMs - 60000, // 60秒のマージン
  };

  return access_token;
}

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

    // メモリキャッシュをチェック
    const now = Date.now();
    if (spotifyCache && (now - spotifyCache.ts) < SPOTIFY_CACHE_TTL) {
      // キャッシュが有効なら即座に返す
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
      return res.status(200).json(spotifyCache.payload);
    }

    // アクセストークンを取得（キャッシュを利用）
    let access_token;
    try {
      access_token = await getAccessToken(clientId, clientSecret);
    } catch (tokenError) {
      // トークン取得失敗時、staleキャッシュがあれば返す
      if (spotifyCache) {
        res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
        return res.status(200).json(spotifyCache.payload);
      }
      return res.status(200).json({
        success: false,
        data: null,
        message: tokenError.message || "Failed to get access token"
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
        // アルバム取得失敗時、staleキャッシュがあれば返す
        if (spotifyCache) {
          res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
          return res.status(200).json(spotifyCache.payload);
        }
        return res.status(200).json({
          success: false,
          data: null,
          message: "Failed to fetch albums from Spotify API"
        });
      }
      
      if (!albumsResp.ok) {
        // アルバム取得失敗時、staleキャッシュがあれば返す
        if (spotifyCache) {
          res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
          return res.status(200).json(spotifyCache.payload);
        }
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
        // パース失敗時、staleキャッシュがあれば返す
        if (spotifyCache) {
          res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
          return res.status(200).json(spotifyCache.payload);
        }
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
      // トラック処理失敗時、staleキャッシュがあれば返す
      if (spotifyCache) {
        res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
        return res.status(200).json(spotifyCache.payload);
      }
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

    // レスポンスを構築
    const responsePayload = {
      success: true,
      data: { artistId, albums: albumsWithTracks },
      message: null
    };

    // メモリキャッシュに保存
    spotifyCache = {
      ts: now,
      payload: responsePayload
    };

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800"); // 24時間キャッシュ、1週間stale許可
    return res.status(200).json(responsePayload);
  } catch (e) {
    // エラー時、staleキャッシュがあれば返す
    if (spotifyCache) {
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
      return res.status(200).json(spotifyCache.payload);
    }
    return res.status(200).json({
      success: false,
      data: null,
      message: `Unexpected error: ${String(e.message || e)}`
    });
  }
}
