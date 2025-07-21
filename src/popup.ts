document.addEventListener('DOMContentLoaded', () => {
  const timeToggle = document.getElementById('timeToggle') as HTMLInputElement;

  if (!timeToggle) return;

  chrome.storage.sync.get(['timeDisplayEnabled'], (result) => {
    timeToggle.checked = result.timeDisplayEnabled ?? true;
  });

  timeToggle.addEventListener('change', () => {
    const isEnabled = timeToggle.checked;

    chrome.storage.sync.set(
      {
        timeDisplayEnabled: isEnabled,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
      }
    );
  });
});
