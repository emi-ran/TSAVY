// Runs in YouTube's main world so it can read the active player's metadata.
async function extractPlayerCaptions(expectedVideoId) {
  const currentId = () => {
    const url = new URL(location.href);
    return url.origin === 'https://www.youtube.com' ? (url.pathname === '/watch' ? url.searchParams.get('v') : /^\/shorts\/([^/]+)\/?$/.exec(url.pathname)?.[1]) : null;
  };
  if (currentId() !== expectedVideoId) return null;
  const player = document.querySelector(location.pathname.startsWith('/shorts/') ? '#shorts-player' : '#movie_player');
  const response = player?.getPlayerResponse?.();
  if (response?.videoDetails?.videoId !== expectedVideoId) return null;
  const selectedTrack = player.getOption?.('captions', 'track');
  const language = selectedTrack?.languageCode;
  const track = response.captions?.playerCaptionsTracklistRenderer?.captionTracks?.find(item => item.languageCode === language);
  if (!track) return null;
  const findRequest = () => performance.getEntriesByType('resource').map(entry => {
    try { return new URL(entry.name); } catch { return null; }
  }).filter(url => url?.origin === 'https://www.youtube.com' && url.pathname === '/api/timedtext' && url.searchParams.get('v') === expectedVideoId && url.searchParams.get('lang') === language && url.searchParams.get('fmt') === 'json3').at(-1);
  let request = findRequest();
  // The player's own request supplies its current signature and proof token.
  if (!request && player.isSubtitlesOn?.()) {
    player.setOption?.('captions', 'track', {});
    player.setOption?.('captions', 'track', selectedTrack);
  }
  for (let i = 0; !request && i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 250));
    if (currentId() !== expectedVideoId) return null;
    request = findRequest();
  }
  if (!request) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const result = await fetch(request.href, { credentials: 'same-origin', signal: controller.signal, redirect: 'error' });
    if (!result.ok) return null;
    const data = await result.json();
    if (currentId() !== expectedVideoId || player.getPlayerResponse?.()?.videoDetails?.videoId !== expectedVideoId) return null;
    const lines = [];
    for (const event of data.events || []) {
      if (!Number.isFinite(event.tStartMs) || event.tStartMs < 0 || !Array.isArray(event.segs)) continue;
      const text = event.segs.map(segment => typeof segment.utf8 === 'string' ? segment.utf8 : '').join('').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      if (event.aAppend && lines.length) {
        lines[lines.length - 1].text += ` ${text}`;
        continue;
      }
      const seconds = Math.floor(event.tStartMs / 1000);
      const time = seconds >= 3600
        ? `${Math.floor(seconds / 3600)}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
        : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
      lines.push({ time, text });
    }
    if (!lines.length) return null;
    const details = response.videoDetails;
    return {
      title: details.title || document.title.replace(/\s*- YouTube$/, ''),
      lines,
      channelName: details.author || '',
      channelUrl: details.channelId ? `https://www.youtube.com/channel/${encodeURIComponent(details.channelId)}` : '',
      description: details.shortDescription || '',
      videoUrl: `https://www.youtube.com/watch?v=${expectedVideoId}`
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
