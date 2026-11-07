importScripts('transcript.js');

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'shorts-transcript') return;
  let tabId = null;
  let disconnected = false;
  let started = false;
  let cancelWait = null;

  const closeTab = () => {
    if (tabId !== null) {
      const id = tabId;
      tabId = null;
      chrome.tabs.remove(id).catch(() => {});
    }
  };
  port.onDisconnect.addListener(() => {
    disconnected = true;
    cancelWait?.();
    closeTab();
  });

  port.onMessage.addListener(message => {
    if (started) return;
    started = true;
    const { videoId, windowId } = message || {};
    const run = async () => {
      try {
        if (typeof videoId !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) throw new Error('Invalid video ID');
        if (disconnected) return;
        const createProps = { url: 'about:blank', active: false };
        if (Number.isInteger(windowId)) createProps.windowId = windowId;
        const tab = await chrome.tabs.create(createProps);
        tabId = tab.id;
        if (disconnected) return;
        port.postMessage({ tabId });
        await chrome.tabs.update(tabId, { muted: true });
        if (disconnected) return;
        const groupId = await chrome.tabs.group({ tabIds: [tabId] });
        if (disconnected) return;
        await chrome.tabGroups.update(groupId, { title: 'TSAVY', color: 'blue', collapsed: true });
        if (disconnected) return;
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const ready = new Promise((resolve, reject) => {
          const cleanup = () => {
            clearTimeout(timer);
            chrome.tabs.onUpdated.removeListener(onUpdated);
            chrome.tabs.onRemoved.removeListener(onRemoved);
            cancelWait = null;
          };
          const onUpdated = (id, change, updatedTab) => {
            if (id === tabId && updatedTab.url === watchUrl && change.status === 'complete') {
              cleanup();
              resolve();
            }
          };
          const onRemoved = id => {
            if (id === tabId) {
              cleanup();
              reject(new Error('Temporary tab closed'));
            }
          };
          const timer = setTimeout(() => { cleanup(); reject(new Error('Temporary tab timed out')); }, 30000);
          cancelWait = () => { cleanup(); reject(new Error('Disconnected')); };
          chrome.tabs.onUpdated.addListener(onUpdated);
          chrome.tabs.onRemoved.addListener(onRemoved);
        });
        const navigation = chrome.tabs.update(tabId, { url: watchUrl });
        await Promise.all([navigation, ready]);
        if (disconnected) return;
        const [result] = await chrome.scripting.executeScript({ target: { tabId }, injectImmediately: true, func: extractTranscript, args: [videoId] });
        if (disconnected) return;
        port.postMessage({ data: result?.result });
      } catch (_) {
        cancelWait?.();
        if (!disconnected) {
          try { port.postMessage({ error: true }); } catch (_) {}
        }
      } finally {
        closeTab();
      }
    };
    void run();
  });
});
