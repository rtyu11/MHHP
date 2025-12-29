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
  
      // 2) アーティストのTop Tracksを取得（市場はJP固定）
      const tracksResp = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=JP`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
  
      if (!tracksResp.ok) {
        const t = await tracksResp.text();
        return res.status(500).json({ error: "Tracks request failed", detail: t });
      }
  
      const data = await tracksResp.json();
  
      // 3) フロントで使いやすい形に整形して返す
      const tracks = (data.tracks || []).map((tr) => ({
        id: tr.id,
        name: tr.name,
        preview_url: tr.preview_url,
        duration_ms: tr.duration_ms,
        album: {
          name: tr.album?.name,
          image: tr.album?.images?.[0]?.url || null,
          release_date: tr.album?.release_date || null,
        },
        artists: (tr.artists || []).map((a) => ({ id: a.id, name: a.name })),
        external_url: tr.external_urls?.spotify || null,
      }));
  
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600"); // 5分キャッシュ
      return res.status(200).json({ artistId, tracks });
    } catch (e) {
      return res.status(500).json({ error: "Unexpected error", detail: String(e) });
    }
  }
  