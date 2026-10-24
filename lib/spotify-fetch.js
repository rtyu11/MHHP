import https from 'node:https';

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const SPOTIFY_HOSTS = new Set(['accounts.spotify.com', 'api.spotify.com']);

// node:https returns raw bytes: unlike fetch it never invokes a Brotli decoder.
export function spotifyFetch(input, options = {}) {
  const url = new URL(input);
  if (url.protocol !== 'https:' || !SPOTIFY_HOSTS.has(url.hostname) || url.username || url.password || (url.port && url.port !== '443')) {
    return Promise.reject(new Error('Invalid Spotify URL'));
  }
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: { ...options.headers, 'Accept-Encoding': 'identity' },
    }, (res) => {
      const encoding = String(res.headers['content-encoding'] || 'identity').trim().toLowerCase();
      if (encoding !== 'identity') {
        res.destroy();
        reject(new Error('Compressed Spotify responses are not accepted'));
        return;
      }
      if (Number(res.headers['content-length']) > MAX_RESPONSE_BYTES) {
        res.destroy();
        reject(new Error('Spotify response exceeds size limit'));
        return;
      }
      const chunks = [];
      let size = 0;
      res.on('error', reject);
      res.on('aborted', () => reject(new Error('Spotify response aborted')));
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_RESPONSE_BYTES) {
          res.destroy();
          reject(new Error('Spotify response exceeds size limit'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        const status = res.statusCode || 502;
        const endpoint = url.hostname === 'accounts.spotify.com' ? 'token' : url.pathname.endsWith('/tracks') ? 'tracks' : 'albums';
        console.info('[spotify-upstream]', JSON.stringify({ endpoint, status, bytes: size, encoding, at: new Date().toISOString() }));
        resolve({ status, ok: status >= 200 && status < 300, json: async () => JSON.parse(body) });
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Spotify request timed out')));
    req.end(options.body);
  });
}
