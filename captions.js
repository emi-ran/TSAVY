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
  const tracks = response.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks?.length) return null;
  const wasOn = player.isSubtitlesOn?.();
  let selectedTrack = player.getOption?.('captions', 'track');
  let language = selectedTrack?.languageCode;
  let enabledByExtension = false;
  const findRequest = () => performance.getEntriesByType('resource').map(entry => {
    try { return new URL(entry.name); } catch { return null; }
  }).filter(url => url?.origin === 'https://www.youtube.com' && url.pathname === '/api/timedtext' && url.searchParams.get('v') === expectedVideoId && url.searchParams.get('lang') === language && url.searchParams.get('fmt') === 'json3').at(-1);
  let request = language ? findRequest() : null;
  try {
    if (!request && wasOn === false && typeof player.toggleSubtitles === 'function') {
      player.toggleSubtitles();
      enabledByExtension = true;
    } else if (!request && wasOn && selectedTrack?.languageCode) {
      player.setOption?.('captions', 'track', {});
      player.setOption?.('captions', 'track', selectedTrack);
    }
    for (let i = 0; !request && i < 20; i++) {
      if (currentId() !== expectedVideoId || player.getPlayerResponse?.()?.videoDetails?.videoId !== expectedVideoId) return null;
      selectedTrack = player.getOption?.('captions', 'track');
      language = selectedTrack?.languageCode;
      if (language) request = findRequest();
      if (!request) await new Promise(resolve => setTimeout(resolve, 250));
    }
  } finally {
    if (enabledByExtension && currentId() === expectedVideoId && player.getPlayerResponse?.()?.videoDetails?.videoId === expectedVideoId && player.isSubtitlesOn?.()) player.toggleSubtitles();
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
    const ownerUrl = response.microformat?.playerMicroformatRenderer?.ownerProfileUrl;
    const ownerLink = player.closest('ytd-reel-video-renderer')?.querySelector('a[href^="/@"]')?.href;
    let channelUrl = details.channelId ? `https://www.youtube.com/channel/${encodeURIComponent(details.channelId)}` : '';
    for (const value of [ownerUrl, ownerLink]) {
      if (!value) continue;
      try {
        const url = new URL(value, location.origin);
        if (url.origin === location.origin && /^\/@[^/]+\/?$/.test(url.pathname)) {
          channelUrl = `${url.origin}${url.pathname.replace(/\/$/, '')}`;
          break;
        }
      } catch (_) {}
    }
    return {
      title: details.title || document.title.replace(/\s*- YouTube$/, ''),
      lines,
      channelName: details.author || '',
      channelUrl,
      description: details.shortDescription || '',
      videoUrl: `https://www.youtube.com/watch?v=${expectedVideoId}`
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
