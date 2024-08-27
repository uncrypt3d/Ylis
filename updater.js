// added in 0.7.3
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['latestVersion', 'releaseUrl', 'skipUntil'], function(data) {
      const currentTime = Date.now();
      if (data.skipUntil && currentTime < data.skipUntil) {
        console.log('Update check skipped until:', new Date(data.skipUntil).toLocaleString());
        window.close();
        return;
      }

      document.getElementById('latest-version').textContent = data.latestVersion || 'Unknown';
      document.getElementById('update-button').addEventListener('click', function() {
        chrome.tabs.create({ url: data.releaseUrl });
        window.close();
      });

      document.getElementById('later-button').addEventListener('click', function() {
        const skipUntil = currentTime + 60 * 60 * 1000;
        chrome.storage.local.set({ skipUntil: skipUntil }, function() {
          window.close();
        });
      });
    });
  });
  