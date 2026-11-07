const updateRegion = document.querySelector('#update-region');
const updateLabel = document.querySelector('#update-label');
const updateTitle = document.querySelector('#update-title');
const updateDetail = document.querySelector('#update-detail');
let updateDismissed = false;

document.querySelector('#update-dismiss').addEventListener('click', () => {
  updateDismissed = true;
  updateRegion.inert = true;
  updateRegion.dataset.open = 'false';
});

function compareVersions(a, b) {
  const parse = value => /^v?(\d+(?:\.\d+){0,3})$/.exec(value)?.[1].split('.').map(Number);
  const left = parse(a);
  const right = parse(b);
  if (!left || !right) return null;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const difference = (left[i] || 0) - (right[i] || 0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}

function showUpdate(title, detail) {
  updateLabel.textContent = 'GÜNCELLEME';
  if (updateDismissed) return;
  updateTitle.textContent = title;
  updateDetail.textContent = detail;
  updateRegion.inert = false;
  requestAnimationFrame(() => {
    if (!updateDismissed) updateRegion.dataset.open = 'true';
  });
}

async function checkForUpdate() {
  const current = chrome.runtime.getManifest().version;
  try {
    const response = await fetch('https://api.github.com/repos/emi-ran/TSAVY/releases/latest', { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(8000) });
    if (!response.ok) return;
    const release = await response.json();
    if (compareVersions(release.tag_name, current) === 1) {
      showUpdate('Yeni bir sürüm hazır', `Yüklü: v${current} · Yeni: ${release.tag_name.startsWith('v') ? release.tag_name : `v${release.tag_name}`}`);
    }
  } catch (_) {
    // A failed check must not interfere with the panel.
  }
}

checkForUpdate();
