document.addEventListener('DOMContentLoaded', function() {
    const toggleHighlightButton = document.getElementById('toggleHighlight');
    const toggleHideButton = document.getElementById('toggleHide');
    const toggleShoutboxButton = document.getElementById('toggleShoutbox');
    

    chrome.storage.local.get(['highlightEnabled', 'hidePostsEnabled', 'shoutboxEnabled', 'postIds'], function(data) {
        const highlightEnabled = data.highlightEnabled !== undefined ? data.highlightEnabled : true;
        const hidePostsEnabled = data.hidePostsEnabled !== undefined ? data.hidePostsEnabled : true;
        const shoutboxEnabled = data.shoutboxEnabled !== undefined ? data.shoutboxEnabled : true;
        const postIds = data.postIds || [];

        toggleHighlightButton.textContent = highlightEnabled ? '>väriscripti pois' : '>>väriscripti päälle';
        toggleHideButton.textContent = hidePostsEnabled ? '>VENÄJÄ PROPAGANDA PÄÄLLE' : '>>VENÄJÄ PROPAGANDA POIS';
        toggleShoutboxButton.textContent = shoutboxEnabled ? '>>Vittuiluboxi päälle' : '>Pakotusboxi pois';

        toggleHighlightButton.addEventListener('click', () => {
            const newHighlightEnabled = !highlightEnabled;
            chrome.storage.local.set({ highlightEnabled: newHighlightEnabled }, function() {
                toggleHighlightButton.textContent = newHighlightEnabled ? '>>väriscripti pois' : '>väriscripti päälle';
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'TOGGLE_HIGHLIGHT',
                        enable: newHighlightEnabled
                    });
                });
            });
        });

        toggleHideButton.addEventListener('click', () => {
            const newHidePostsEnabled = !hidePostsEnabled;
            chrome.storage.local.set({ hidePostsEnabled: newHidePostsEnabled, postIds }, function() {
                toggleHideButton.textContent = newHidePostsEnabled ? '>>VENÄJÄ PROPAGANDA PÄÄLLE' : '>VENÄJÄ PROPAGANDA POIS';
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'TOGGLE_HIDE_POSTS',
                        enable: newHidePostsEnabled,
                        ids: postIds
                    });
                });
            });
        });

        toggleShoutboxButton.addEventListener('click', () => {
            const newShoutboxEnabled = !shoutboxEnabled;
            chrome.storage.local.set({ shoutboxEnabled: newShoutboxEnabled }, function() {
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
