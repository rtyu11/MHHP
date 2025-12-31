// /api/spotify.js

// メモリキャッシュ（TTL 5分 = 300秒）
let memoryCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 300 * 1000; // 5分（ミリ秒）

// インフライト（進行中）のPromiseを保持（同時アクセスを束ねる）
let inflightPromise = null;

// キャッシュが有効かチェック
function isCacheValid() {
  if (!memoryCache || !cacheTimestamp) return false;
  const now = Date.now();
  return (now - cacheTimestamp) < CACHE_TTL;
}

// キャッシュを取得（TTLチェックなしで、存在するかどうかだけ確認）
function getCachedData() {
  return memoryCache;
}

// キャッシュを保存
function setCachedData(data) {
  memoryCache = data;
  cacheTimestamp = Date.now();
}

export default async function handler(req, res) {
    try {
      // キャッシュがあれば返す（有効期限内のみ）
      const cached = getCachedData();
      if (cached && isCacheValid()) {
        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        return res.status(200).json(cached);
      }

      // インフライトのPromiseがあれば、それを待つ（同時アクセスを束ねる）
      if (inflightPromise) {
        try {
          const result = await inflightPromise;
          // インフライトの結果が成功なら、そのまま返す
          res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
          return res.status(200).json(result);
        } catch (inflightError) {
          // インフライトが失敗した場合、429エラーならキャッシュを返す処理に進む
          if (inflightError.status === 429) {
            // 下記の429処理にフォールスルー
          } else {
            // その他のエラーは再スロー
            throw inflightError;
          }
        }
      }

      // 新しいリクエストを開始
      inflightPromise = (async () => {
        try {
          // Vercel Environment Variables に入れた値を読む
          const clientId = process.env.SPOTIFY_CLIENT_ID;
          const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
          const artistId = process.env.SPOTIFY_ARTIST_ID; // 例: 5j7m1n3HAdmbJoYMizwzk2
      
          if (!clientId || !clientSecret || !artistId) {
            const error = {
              status: 500,
              message: "Missing env vars",
              detail: { required: ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_ARTIST_ID"] },
            };
            throw error;
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
            // 429エラーの場合
            if (tokenResp.status === 429) {
              const error = {
                status: 429,
                retryAfter: tokenResp.headers.get("Retry-After"),
                message: "Token request rate limited",
              };
              throw error;
            }
            // その他のエラー
            const t = await tokenResp.text();
            const error = {
              status: 500,
              message: "Token request failed",
              detail: t,
            };
            throw error;
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
              // 429エラーの場合
              if (albumsResp.status === 429) {
                const error = {
                  status: 429,
                  retryAfter: albumsResp.headers.get("Retry-After"),
                  message: "Albums request rate limited",
                };
                throw error;
              }
              // その他のエラー
              const t = await albumsResp.text();
              const error = {
                status: 500,
                message: "Albums request failed",
                detail: t,
              };
              throw error;
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
                  // 429エラーの場合
                  if (tracksResp.status === 429) {
                    const error = {
                      status: 429,
                      retryAfter: tracksResp.headers.get("Retry-After"),
                      message: `Tracks request rate limited for album ${album.id}`,
                    };
                    throw error;
                  }
                  // その他のエラーは警告のみ（個別トラック取得なので）
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
      
          const result = { artistId, albums: albumsWithTracks };
          
          // 成功時のみキャッシュに保存
          setCachedData(result);
          
          return result;
        } finally {
          // 成功/失敗に関わらず、インフライトPromiseをクリア
          inflightPromise = null;
        }
      })();

      // インフライトPromiseの結果を待つ
      const result = await inflightPromise;
      
      // 成功時のレスポンス
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json(result);
      
    } catch (e) {
      // 429エラーの場合
      if (e.status === 429) {
        const cached = getCachedData();
        if (cached) {
          // キャッシュが存在するなら、TTLを超えていても返す（stale: trueを追加）
          const staleResult = { ...cached, stale: true };
          res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
          return res.status(200).json(staleResult);
        } else {
          // キャッシュが無い場合は503を返す
          res.setHeader("Cache-Control", "no-store");
          if (e.retryAfter) {
            res.setHeader("Retry-After", e.retryAfter);
          }
          return res.status(503).json({
            error: "Service Unavailable",
            message: e.message || "Rate limited and no cache available",
            retryAfter: e.retryAfter || null,
          });
        }
      }
      
      // その他のエラーの場合、キャッシュがあれば返す
      const cached = getCachedData();
      if (cached) {
        // TTLを超えていても、エラー時は古いキャッシュを返す（stale: trueを追加）
        const staleResult = { ...cached, stale: true };
        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        return res.status(200).json(staleResult);
      }
      
      // キャッシュも無い場合は500エラー
      return res.status(500).json({ 
        error: "Unexpected error", 
        detail: String(e.message || e) 
      });
    }
  }
