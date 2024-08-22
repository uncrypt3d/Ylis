// background.js

console.log('Background script loaded');

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed or updated');
    checkForUpdates();
    chrome.alarms.create("checkForUpdates", { periodInMinutes: 1440 });
});

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === "checkForUpdates") {
        console.log('Alarm triggered: checkForUpdates');
        checkForUpdates();
    }
});

function checkForUpdates() {
    const repoUrl = 'https://api.github.com/repos/uncrypt3d/Ylis/releases/latest';

    console.log('Checking for updates from:', repoUrl);

    chrome.storage.local.get('skipUntil', function(data) {
        const currentTime = Date.now();
        if (data.skipUntil && currentTime < data.skipUntil) {
            console.log('Update check skipped until:', new Date(data.skipUntil).toLocaleString());
            return;
        }

        fetch(repoUrl)
            .then(response => {
                if (!response.ok) {
                    console.error('Failed to fetch release information:', response.statusText);
                    throw new Error('Failed to fetch release information');
                }
                return response.json();
            })
            .then(data => {
                const latestVersion = data.tag_name.replace(/^v/, '');
                const currentVersion = chrome.runtime.getManifest().version;

                console.log('Latest version:', latestVersion);
                console.log('Current version:', currentVersion);

                if (compareVersions(latestVersion, currentVersion)) {
                    console.log('New version available:', latestVersion);
                    chrome.storage.local.set({
                        latestVersion: latestVersion,
                        releaseUrl: data.html_url
                    }, () => {
                        chrome.tabs.create({ url: chrome.runtime.getURL('updater.html') });
                    });
                } else {
                    console.log('No new version available.');
                }
            })
            .catch(error => {
                console.error('Error during update check:', error);
            });
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

chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
    if (notifId === 'updateNotification') {
        if (btnIdx === 0) {
            console.log('Update button clicked. Opening release page...');
            chrome.tabs.create({ url: 'https://github.com/uncrypt3d/Ylis/releases/latest' });
        } else {
            console.log('Later button clicked. No action taken.');
        }
    }
});
