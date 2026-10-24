import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import https from 'node:https';
import { spotifyFetch } from '../lib/spotify-fetch.js';

function responseFixture({ encoding, chunks = ['{"items":[]}'], length, status = 200 } = {}) {
  let sentOptions;
  const response = new EventEmitter();
  response.headers = { ...(encoding ? { 'content-encoding': encoding } : {}), ...(length ? { 'content-length': String(length) } : {}) };
  response.statusCode = status;
  response.destroyed = false;
  response.destroy = () => { response.destroyed = true; };
  const request = new EventEmitter();
  request.setTimeout = () => request;
  request.destroy = (error) => { request.emit('error', error); };
  request.end = () => queueMicrotask(() => {
    callback(response);
    for (const chunk of chunks) if (!response.destroyed) response.emit('data', Buffer.from(chunk));
    if (!response.destroyed) response.emit('end');
  });
  let callback;
  const stub = mock.method(https, 'request', (_url, options, handler) => { sentOptions = options; callback = handler; return request; });
  return { response, restore: () => stub.mock.restore(), options: () => sentOptions };
}

test('identity JSON preserves status and authorization', async () => {
  const f = responseFixture();
  try {
    const result = await spotifyFetch('https://api.spotify.com/v1/albums', { headers: { Authorization: 'Bearer fixture' } });
    assert.equal(result.ok, true);
    assert.deepEqual(await result.json(), { items: [] });
    assert.equal(f.options().headers['Accept-Encoding'], 'identity');
    assert.equal(f.options().headers.Authorization, 'Bearer fixture');
  } finally { f.restore(); }
});

for (const encoding of ['br', 'gzip', 'deflate', 'br, gzip']) {
  test(`rejects ${encoding} before consuming any response data`, async () => {
    const f = responseFixture({ encoding });
    try { await assert.rejects(spotifyFetch('https://api.spotify.com/v1/albums'), /Compressed/); assert.equal(f.response.destroyed, true); }
    finally { f.restore(); }
  });
}

test('limits declared and streamed response size', async () => {
  for (const config of [{ length: 2097153 }, { chunks: ['x'.repeat(2097153)] }]) {
    const f = responseFixture(config);
    try { await assert.rejects(spotifyFetch('https://api.spotify.com/v1/albums'), /size limit/); }
    finally { f.restore(); }
  }
});

test('rejects pagination to another origin without a network request', async () => {
  await assert.rejects(spotifyFetch('https://example.com/token'), /Invalid Spotify URL/);
  await assert.rejects(spotifyFetch('http://api.spotify.com/v1/albums'), /Invalid Spotify URL/);
});

test('preserves error status and rejects invalid JSON', async () => {
  const f = responseFixture({ status: 429, chunks: ['invalid'] });
  try { const result = await spotifyFetch('https://api.spotify.com/v1/albums'); assert.equal(result.status, 429); assert.equal(result.ok, false); await assert.rejects(result.json(), SyntaxError); }
  finally { f.restore(); }
});
