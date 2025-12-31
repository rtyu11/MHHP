// /api/spotify.js

// トークンキャッシュ（expires_inを使用して期限管理）
let cachedToken = null;
let tokenExpiresAt = 0;

// データキャッシュ（TTL: 1時間fresh、24時間stale OK）
let cachedPayload = null;
let payloadExpiresAt = 0;
const PAYLOAD_TTL_FRESH = 3600 * 1000; // 1時間（ミリ秒）
const PAYLOAD_TTL_STALE = 86400 * 1000; // 24時間（ミリ秒）

// インフライト（進行中）のPromiseを保持（同時更新を1本にまとめる）
let inFlight = null;

// キャッシュされたペイロードが有効かチェック（fresh）
function isPayloadFresh() {
  if (!cachedPayload || !payloadExpiresAt) return false;
  const now = Date.now();
  return (now - payloadExpiresAt) < PAYLOAD_TTL_FRESH;
}

// キャッシュされたペイロードがstaleとして使えるかチェック
function isPayloadStale() {
  if (!cachedPayload || !payloadExpiresAt) return false;
  const now = Date.now();
  return (now - payloadExpiresAt) < PAYLOAD_TTL_STALE;
}

// トークンが有効かチェック
function isTokenValid() {
  if (!cachedToken || !tokenExpiresAt) return false;
  const now = Date.now();
  // 5分のマージンを取る（期限切れ前に再取得）
  return (tokenExpiresAt - now) > 5 * 60 * 1000;
}

// トークンを取得（キャッシュがあれば再利用）
async function getAccessToken(clientId, clientSecret) {
  if (isTokenValid()) {
    return cachedToken;
  }

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
    if (tokenResp.status === 429) {
      const error = {
        status: 429,
        retryAfter: tokenResp.headers.get("Retry-After"),
        message: "Token request rate limited",
      };
      throw error;
    }
    const t = await tokenResp.text();
    const error = {
      status: 500,
      message: "Token request failed",
      detail: t,
    };
    throw error;
  }

  const tokenData = await tokenResp.json();
  cachedToken = tokenData.access_token;
  // expires_in（秒）をミリ秒に変換して期限を設定
  tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
  
  return cachedToken;
}

export default async function handler(req, res) {
  try {
    // フレッシュなキャッシュがあれば即返す
    if (isPayloadFresh()) {
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
      return res.status(200).json(cachedPayload);
    }

    // インフライトのPromiseがあれば、それを待つ（同時アクセスを束ねる）
    if (inFlight) {
      try {
        const result = await inFlight;
        res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
        return res.status(200).json(result);
      } catch (inflightError) {
        // インフライトが失敗した場合、staleキャッシュがあれば返す
        if (isPayloadStale()) {
          const staleResult = { ...cachedPayload, stale: true };
          res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
          res.setHeader("X-Cache", "STALE");
          return res.status(200).json(staleResult);
        }
        // staleキャッシュも無い場合はエラーを再スロー
        throw inflightError;
      }
    }

    // 新しいリクエストを開始
    inFlight = (async () => {
      try {
        // Vercel Environment Variables に入れた値を読む
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        const artistId = process.env.SPOTIFY_ARTIST_ID;

        if (!clientId || !clientSecret || !artistId) {
          const error = {
            status: 500,
            message: "Missing env vars",
            detail: { required: ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_ARTIST_ID"] },
          };
          throw error;
        }

        // トークン取得（キャッシュがあれば再利用）
        const access_token = await getAccessToken(clientId, clientSecret);

        // アーティストのアルバムを取得（シングルとアルバムのみ、市場はJP固定）
        let allAlbums = [];
        let nextUrl = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=JP&limit=50`;

        // ページネーションで全アルバムを取得
        while (nextUrl) {
          const albumsResp = await fetch(nextUrl, {
            headers: { Authorization: `Bearer ${access_token}` },
          });

          if (!albumsResp.ok) {
            if (albumsResp.status === 429) {
              const error = {
                status: 429,
                retryAfter: albumsResp.headers.get("Retry-After"),
                message: "Albums request rate limited",
              };
              throw error;
            }
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

        // 各アルバムのトラックリストを取得
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
                if (tracksResp.status === 429) {
                  const error = {
                    status: 429,
                    retryAfter: tracksResp.headers.get("Retry-After"),
                    message: `Tracks request rate limited for album ${album.id}`,
                  };
                  throw error;
                }
                // その他のエラーは警告のみ（個別トラック取得なので）
                break;
              }

              const tracksData = await tracksResp.json();
              allTracks = allTracks.concat(tracksData.items || []);
              tracksNextUrl = tracksData.next;
            }

            return {
              id: album.id,
              name: album.name,
              album_type: album.album_type,
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

        // release_date降順でソート
        albumsWithTracks.sort((a, b) => {
          const da = a.release_date || '';
          const db = b.release_date || '';
          return db.localeCompare(da);
        });

        const result = { artistId, albums: albumsWithTracks };

        // 成功時のみキャッシュに保存
        cachedPayload = result;
        payloadExpiresAt = Date.now();

        return result;
      } finally {
        // 成功/失敗に関わらず、インフライトPromiseをクリア
        inFlight = null;
      }
    })();

    // インフライトPromiseの結果を待つ
    const result = await inFlight;

    // 成功時のレスポンス
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(result);

  } catch (e) {
    // 429/5xx/ネットワーク失敗時はstaleキャッシュを返す
    if (e.status === 429 || (e.status >= 500 && e.status < 600) || !e.status) {
      if (isPayloadStale()) {
        // staleキャッシュがあれば200で返す
        const staleResult = { ...cachedPayload, stale: true };
        res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
        res.setHeader("X-Cache", "STALE");
        return res.status(200).json(staleResult);
      }
    }

    // staleキャッシュも無い場合はエラーを返す
    if (e.status === 429) {
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

    // その他のエラー
    return res.status(500).json({
      error: "Unexpected error",
      detail: String(e.message || e),
    });
  }
}
