// Injected into a YouTube watch tab; uses YouTube's own transcript UI.
async function extractTranscript(expectedVideoId) {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const isExpectedVideo = () => {
    const url = new URL(location.href);
    return url.hostname === 'www.youtube.com' && url.pathname === '/watch' && url.searchParams.get('v') === expectedVideoId;
  };
  const findLines = () => [...document.querySelectorAll('ytd-transcript-segment-renderer, transcript-segment-view-model')].map(item => ({
    time: item.querySelector('.segment-timestamp, .ytwTranscriptSegmentViewModelTimestamp')?.textContent.trim() || '',
    text: item.querySelector('.segment-text, span[role="text"]')?.textContent.trim() || ''
  })).filter(item => item.text);
  if (!isExpectedVideo()) return null;
  const readTitle = () => document.querySelector('h1.ytd-watch-metadata')?.textContent.trim() || document.title.replace(/\s*- YouTube$/, '');
  const transcriptPanel = () => [...document.querySelectorAll('ytd-engagement-panel-section-list-renderer[visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"]')].find(panel => /transcript/i.test(panel.getAttribute('target-id') || '') || panel.querySelector('transcript-segment-view-model, ytd-transcript-segment-renderer'));
  const descriptionPanel = () => document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-structured-description"][visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"]');
  let openedDescription = false;
  let openedByExtension = false;
  try {
    let lines = findLines();
    if (!lines.length) {
      const descriptionControl = () => [...document.querySelectorAll('ytd-text-inline-expander #expand, ytd-watch-metadata #expand, yt-side-rail-view-model button')].find(button => button.getClientRects().length && (button.id === 'expand' || /^(description|açıklama)(,|$)/i.test(button.getAttribute('aria-label') || '')));
      let expand = descriptionControl();
      for (let i = 0; i < 40 && !expand; i++) {
        await wait(250);
        if (!isExpectedVideo()) return null;
        expand = descriptionControl();
      }
      openedDescription = !!expand?.closest('yt-side-rail-view-model') && !descriptionPanel();
      expand?.click();
      let transcriptButton;
      for (let i = 0; i < 40 && !transcriptButton; i++) {
        transcriptButton = [...document.querySelectorAll('ytd-video-description-transcript-section-renderer button')].find(button => button.getClientRects().length && /^(show transcript|transkripti göster|transkripti goster|dökümü göster|dökümü goster)$/i.test((button.textContent || button.getAttribute('aria-label') || '').trim()));
        if (!transcriptButton) {
          await wait(250);
          if (!isExpectedVideo()) return null;
        }
      }
      if (!transcriptButton) return { title: readTitle(), lines: [], error: 'Transkript düğmesi bulunamadı. Video altyazı içermiyor olabilir veya YouTube’un arayüz dili desteklenmiyor olabilir.' };
      openedByExtension = !transcriptPanel();
      transcriptButton.click();
      for (let i = 0; i < 40 && !lines.length; i++) {
        await wait(250);
        if (!isExpectedVideo()) return null;
        lines = findLines();
      }
    }
    const channel = document.querySelector('ytd-video-owner-renderer #channel-name a');
    const channelName = channel?.textContent.trim() || '';
    const channelLink = channel?.href ? new URL(channel.href) : null;
    const channelUrl = channelLink?.hostname === 'www.youtube.com' ? `${channelLink.origin}${channelLink.pathname}` : '';
    const description = [...document.querySelectorAll('ytd-watch-metadata #description-inline-expander #expanded yt-attributed-string, ytd-watch-metadata #description-inline-expander #expanded yt-formatted-string, ytd-expandable-video-description-body-renderer #expanded yt-attributed-string, ytd-expandable-video-description-body-renderer #snippet-text yt-attributed-string')].map(item => item.textContent.trim()).find(Boolean) || '';
    return { title: readTitle(), lines, channelName, channelUrl, description, videoUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(expectedVideoId)}` };
  } finally {
    if (openedByExtension && isExpectedVideo()) {
      transcriptPanel()?.querySelector('ytd-engagement-panel-title-header-renderer #visibility-button button')?.click();
    }
    if (openedDescription && isExpectedVideo()) {
      descriptionPanel()?.querySelector('ytd-engagement-panel-title-header-renderer #visibility-button button')?.click();
    }
  }
}
