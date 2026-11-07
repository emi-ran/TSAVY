const status = document.querySelector('#status');
const segments = document.querySelector('#segments');
const videoTitle = document.querySelector('#video-title');
const refresh = document.querySelector('#refresh');
let generation = 0;
let transcript = null;
let summaryRequest = null;
let cancelShorts = null;
const temporaryTabs = new Set();

function getYouTubeVideoId(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'www.youtube.com') return null;
    const id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/shorts\/([^/]+)\/?$/.exec(url.pathname)?.[1];
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch (_) {
    return null;
  }
}

function loadShortsTranscript(videoId, windowId) {
  return new Promise((resolve, reject) => {
    const port = chrome.runtime.connect({ name: 'shorts-transcript' });
    const cancel = () => finish(new Error('Transcript request cancelled'));
    cancelShorts = cancel;
    let settled = false;
    const finish = (error, data) => {
      if (settled) return;
      settled = true;
      if (cancelShorts === cancel) cancelShorts = null;
      port.disconnect();
      if (error) reject(error); else resolve(data);
    };
    port.onMessage.addListener(message => {
      if (message.tabId !== undefined) temporaryTabs.add(message.tabId);
      else finish(message.error ? new Error('Transcript unavailable') : null, message.data);
    });
    port.onDisconnect.addListener(() => finish(new Error('Transcript request disconnected')));
    port.postMessage({ videoId, windowId });
  });
}
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
  cancelShorts?.();
  chatLoading();
  resetSummary();
  segments.replaceChildren();
  videoTitle.textContent = 'Video bekleniyor';
  status.textContent = 'Altyazılar aranıyor…';
  refresh.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (myGeneration !== generation) return;
    const videoId = getYouTubeVideoId(tab?.url);
    chatSetVideo(videoId ? `${tab.id}:${videoId}` : null);
    if (!videoId) {
      status.textContent = 'Başlamak için bir YouTube videosu aç.';
      return;
    }
    const url = new URL(tab.url);
    let data;
    if (url.pathname === '/watch') {
      data = (await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractTranscript, args: [videoId] }))[0]?.result;
    } else {
      status.textContent = 'Shorts altyazıları okunuyor…';
      data = (await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', func: extractPlayerCaptions, args: [videoId] }))[0]?.result;
      if (myGeneration !== generation) return;
      if (!data?.lines?.length) {
        status.textContent = 'Transkript TSAVY grubunda hazırlanıyor…';
        data = await loadShortsTranscript(videoId, tab.windowId);
      }
    }
    if (myGeneration !== generation) return;
    const [current] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (myGeneration !== generation) return;
    if (current?.id !== tab.id || current.url !== tab.url) return void readTranscript();
    if (!data?.lines?.length) {
      status.textContent = data?.error || 'Bu videoda erişilebilir bir transkript bulunamadı.';
      return;
    }
    transcript = { ...data, tabId: tab.id, videoId };
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


refresh.addEventListener('click', readTranscript);
chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (!temporaryTabs.has(tabId)) readTranscript();
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!temporaryTabs.has(tabId) && tab.active && (changeInfo.url || changeInfo.status === 'complete')) readTranscript();
});
chrome.tabs.onRemoved.addListener(tabId => temporaryTabs.delete(tabId));
