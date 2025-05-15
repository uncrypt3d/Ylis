document.addEventListener('DOMContentLoaded', function() {
    const toggleHighlightButton = document.getElementById('toggleHighlight');
    const toggleHideButton = document.getElementById('toggleHide');
    const toggleShoutboxButton = document.getElementById('toggleShoutbox');

    // Initialize button text from storage
    chrome.storage.local.get(['highlightEnabled', 'hidePostsEnabled', 'shoutboxEnabled'], function(data) {
        toggleHighlightButton.textContent = (data.highlightEnabled !== undefined ? data.highlightEnabled : true) ? '>väriscripti pois' : '>>väriscripti päälle';
        toggleHideButton.textContent = (data.hidePostsEnabled !== undefined ? data.hidePostsEnabled : true) ? '>VENÄJÄ PROPAGANDA PÄÄLLE' : '>>VENÄJÄ PROPAGANDA POIS';
        toggleShoutboxButton.textContent = (data.shoutboxEnabled !== undefined ? data.shoutboxEnabled : true) ? '>>Vittuiluboxi päälle' : '>Pakotusboxi pois';
    });

    toggleHighlightButton.addEventListener('click', () => {
        chrome.storage.local.get('highlightEnabled', (data) => {
            const current = data.highlightEnabled !== undefined ? data.highlightEnabled : true;
            const newHighlightEnabled = !current;
            chrome.storage.local.set({ highlightEnabled: newHighlightEnabled }, () => {
                toggleHighlightButton.textContent = newHighlightEnabled ? '>väriscripti pois' : '>>väriscripti päälle';
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'TOGGLE_HIGHLIGHT',
                        enable: newHighlightEnabled
                    });
                });
            });
        });
    });

    toggleHideButton.addEventListener('click', () => {
        chrome.storage.local.get(['hidePostsEnabled', 'postIds'], (data) => {
            const current = data.hidePostsEnabled !== undefined ? data.hidePostsEnabled : true;
            const postIds = data.postIds || [];
            const newHidePostsEnabled = !current;
            chrome.storage.local.set({ hidePostsEnabled: newHidePostsEnabled, postIds }, () => {
                toggleHideButton.textContent = newHidePostsEnabled ? '>VENÄJÄ PROPAGANDA PÄÄLLE' : '>>VENÄJÄ PROPAGANDA POIS';
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'TOGGLE_HIDE_POSTS',
                        enable: newHidePostsEnabled,
                        ids: postIds
                    });
                });
            });
        });
    });

    toggleShoutboxButton.addEventListener('click', () => {
        chrome.storage.local.get('shoutboxEnabled', (data) => {
            const current = data.shoutboxEnabled !== undefined ? data.shoutboxEnabled : true;
            const newShoutboxEnabled = !current;
            chrome.storage.local.set({ shoutboxEnabled: newShoutboxEnabled }, () => {
                toggleShoutboxButton.textContent = newShoutboxEnabled ? '>Vittuiluboxi päälle' : '>>Pakotusboxi pois';
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'TOGGLE_SHOUTBOX',
                        enable: newShoutboxEnabled
                    });
                });
            });
        });
    });
});
