document.addEventListener('DOMContentLoaded', function() {
    const toggleHighlightButton = document.getElementById('toggleHighlight');
    const toggleHideButton = document.getElementById('toggleHide');

    chrome.storage.local.get(['highlightEnabled', 'hidePostsEnabled', 'postIds'], function(data) {
        const highlightEnabled = data.highlightEnabled !== undefined ? data.highlightEnabled : true;
        const hidePostsEnabled = data.hidePostsEnabled !== undefined ? data.hidePostsEnabled : true;
        const postIds = data.postIds || [];

        toggleHighlightButton.textContent = highlightEnabled ? '(+5 väriscripti) pois' : '(+5 väriscripti) päälle';
        toggleHideButton.textContent = hidePostsEnabled ? '1VENÄJÄ PROPAGANDA PÄÄLLE' : '((VENÄJÄ PROPAGANDA PÄÄLLE';

        toggleHighlightButton.addEventListener('click', () => {
            const newHighlightEnabled = !highlightEnabled;
            chrome.storage.local.set({ highlightEnabled: newHighlightEnabled }, function() {
                toggleHighlightButton.textContent = newHighlightEnabled ? '(+5 väriscripti) pois' : '(+5 väriscripti) päälle';
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
                toggleHideButton.textContent = newHidePostsEnabled ? '11VENÄJÄ PROPAGANDA PÄÄLLE' : 'RYBOT VITTUUN LAUDALTA';
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
});
