//background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log('installed.');
  });
  
//** UPDATER - TOP - added in 0.7.3 */
chrome.runtime.onInstalled.addListener(() => {
  checkForUpdates();
  chrome.alarms.create("checkForUpdates", { periodInMinutes: 1440 });
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "checkForUpdates") {
      checkForUpdates();
  }
});

function checkForUpdates() {
  const repoUrl = 'https://api.github.com/repos/uncrypt3d/Ylis/releases/latest';

  fetch(repoUrl)
      .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
      })
      .then(data => {
          const latestVersion = data.tag_name.replace(/^v/, '');
          const currentVersion = chrome.runtime.getManifest().version;

          if (compareVersions(latestVersion, currentVersion)) {
              notifyUser(data);
          }
      })
      .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
      });
}

function compareVersions(latest, current) {
  const latestParts = latest.split('.');
  const currentParts = current.split('.');
  for (let i = 0; i < latestParts.length; i++) {
      const latestPart = parseInt(latestParts[i] || '0', 10);
      const currentPart = parseInt(currentParts[i] || '0', 10);

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
  }
  return false;
}

function notifyUser(releaseData) {
  chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'KELA-GOLD - New Version Available!',
      message: `Version ${releaseData.tag_name} is available. Update now?`,
      buttons: [{ title: 'Update! >' }, { title: 'Later. >' }]
  });

  chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
      if (btnIdx === 0) {
          chrome.tabs.create({ url: releaseData.html_url });
      }
  });
}

//** UPDATER - END */
