const status = document.querySelector('#status');
const segments = document.querySelector('#segments');
const videoTitle = document.querySelector('#video-title');
const refresh = document.querySelector('#refresh');
let generation = 0;
let transcript = null;
let summaryRequest = null;
const accordion = document.querySelector('.t-acc');
const accordionHead = accordion.querySelector('.t-acc-head');
const accordionPanel = document.querySelector('#transcript-panel');
accordionHead.addEventListener('click', () => {
  const open = accordion.dataset.open !== 'true';
  accordion.dataset.open = String(open);
  accordionHead.setAttribute('aria-expanded', String(open));
  accordionPanel.inert = !open;
});

async function readTranscript() {
  const myGeneration = ++generation;
  chatLoading();
  resetSummary();
  segments.replaceChildren();
  videoTitle.textContent = 'Video bekleniyor';
  status.textContent = 'Altyazılar aranıyor…';
  refresh.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (myGeneration !== generation) return;
    const url = new URL(tab?.url || 'about:blank');
    chatSetVideo(url.hostname === 'www.youtube.com' && url.pathname === '/watch' ? `${tab.id}:${url.searchParams.get('v') || ''}` : null);
    if (url.hostname !== 'www.youtube.com' || url.pathname !== '/watch' || !url.searchParams.get('v')) {
      status.textContent = 'Başlamak için bir YouTube videosu aç.';
      return;
    }
    const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractTranscript });
    if (myGeneration !== generation) return;
    const [current] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (myGeneration !== generation) return;
    if (current?.id !== tab.id || current.url !== tab.url) return void readTranscript();
    const data = result?.result;
    if (!data?.lines?.length) {
      status.textContent = data?.error || 'Bu videoda erişilebilir bir transkript bulunamadı.';
      return;
    }
    transcript = { ...data, tabId: tab.id, videoId: url.searchParams.get('v') };
    restoreSummary(transcript);
    chatReady();
    document.querySelector('#summarize').disabled = false;
    videoTitle.textContent = data.title;
    videoTitle.hidden = false;
    status.textContent = '';
    const fragment = document.createDocumentFragment();
    for (const line of data.lines) {
      const row = document.createElement('div');
      row.className = 'segment';
      const time = document.createElement('span');
      time.className = 'time';
      time.textContent = line.time;
      const text = document.createElement('p');
      text.textContent = line.text;
      row.append(time, text);
      fragment.append(row);
    }
    segments.append(fragment);
  } catch (error) {
    if (myGeneration === generation) status.textContent = 'Altyazılar alınamadı. Sayfayı yenileyip tekrar dene.';
  } finally {
    if (myGeneration === generation) refresh.disabled = false;
  }
}

// Runs in the YouTube tab; uses the site's own transcript rather than an external service.
async function extractTranscript() {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const findLines = () => [...document.querySelectorAll('ytd-transcript-segment-renderer, transcript-segment-view-model')].map(item => ({
    time: item.querySelector('.segment-timestamp, .ytwTranscriptSegmentViewModelTimestamp')?.textContent.trim() || '',
    text: item.querySelector('.segment-text, span[role="text"]')?.textContent.trim() || ''
  })).filter(item => item.text);
  const title = document.querySelector('h1.ytd-watch-metadata')?.textContent.trim() || document.title.replace(/\s*- YouTube$/, '');
  const originalVideo = new URL(location.href).searchParams.get('v');
  const transcriptPanel = () => [...document.querySelectorAll('ytd-engagement-panel-section-list-renderer[visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"]')].find(panel => /transcript/i.test(panel.getAttribute('target-id') || '') || panel.querySelector('transcript-segment-view-model, ytd-transcript-segment-renderer'));
  let openedByExtension = false;
  try {
  let lines = findLines();
  if (!lines.length) {
    let expand = document.querySelector('ytd-text-inline-expander #expand, ytd-watch-metadata #expand');
    for (let i = 0; i < 40 && !expand; i++) {
      await wait(250);
      expand = document.querySelector('ytd-text-inline-expander #expand, ytd-watch-metadata #expand');
    }
    expand?.click();
    let transcriptButton;
    for (let i = 0; i < 40 && !transcriptButton; i++) {
      transcriptButton = [...document.querySelectorAll('ytd-video-description-transcript-section-renderer button')].find(button => button.getClientRects().length && /^(show transcript|transkripti göster|transkripti goster|dökümü göster|dökümü goster)$/i.test((button.textContent || button.getAttribute('aria-label') || '').trim()));
      if (!transcriptButton) await wait(250);
    }
    if (!transcriptButton) return { title, lines: [], error: 'Transkript düğmesi bulunamadı. Video altyazı içermiyor olabilir veya YouTube’un arayüz dili desteklenmiyor olabilir.' };
    openedByExtension = !transcriptPanel();
    transcriptButton.click();
    for (let i = 0; i < 40 && !lines.length; i++) {
      await wait(250);
      lines = findLines();
    }
  }
  const channel = document.querySelector('ytd-video-owner-renderer #channel-name a');
  const channelName = channel?.textContent.trim() || '';
  const channelLink = channel?.href ? new URL(channel.href) : null;
  const channelUrl = channelLink?.hostname === 'www.youtube.com' ? `${channelLink.origin}${channelLink.pathname}` : '';
  const description = document.querySelector('ytd-watch-metadata #description-inline-expander #expanded yt-attributed-string, ytd-watch-metadata #description-inline-expander #expanded yt-formatted-string')?.textContent.trim() || '';
  return { title, lines, channelName, channelUrl, description, videoUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(originalVideo)}` };
  } finally {
    if (openedByExtension && new URL(location.href).searchParams.get('v') === originalVideo) {
      transcriptPanel()?.querySelector('ytd-engagement-panel-title-header-renderer #visibility-button button')?.click();
    }
  }
}

refresh.addEventListener('click', readTranscript);
chrome.tabs.onActivated.addListener(readTranscript);
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) readTranscript();
});
