//'asetukset'
let highlightEnabled = true;
let hidePostsEnabled = true;
let shoutboxEnabled = true;
let postIds = [];
let fakePostIds = [];

//scriptit

function enableShoutbox() {
    const elements = ['#shoutbox', '#shouts', '#shout-form'];
    elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = 'none';
        }
    });
    console.log('Shoutbox hidden');
}

function disableShoutbox() {
    const elements = ['#shoutbox', '#shouts', '#shout-form'];
    elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = '';
        }
    });
    console.log('Shoutbox displayed');
}

function hidePosts(ids) {
    if (window.location.pathname.includes('/sodat/')) {
        document.querySelectorAll('.post').forEach(post => {
            const userId = post.getAttribute('data-user-id');
            if (userId && ids.includes(userId)) {
                post.style.display = 'none';
            }
        });
        console.log('Posts hidden:', ids);
    } else {
        console.log('Not on /sodat/ page, hidePosts skipped');
    }
}

function showPosts(ids) {
    if (window.location.pathname.includes('/sodat/')) {
        document.querySelectorAll('.post').forEach(post => {
            const userId = post.getAttribute('data-user-id');
            if (userId && ids.includes(userId)) {
                post.style.display = '';
            }
        });
        console.log('Posts shown:', ids);
    } else {
        console.log('Not on /sodat/ page, showPosts skipped');
    }
}

function applyPostHighlighting() {
    const baseURL = 'https://ylilauta.org/sodat/';
    if (window.location.href.startsWith(baseURL)) {
        const config = { upvoteThreshold: 5 };
        function processPost(post) {
            const upvoteElement = post.querySelector(".post-button .post-upvotes");
            if (upvoteElement) {
                const upvoteCount = parseInt(upvoteElement.textContent);
                if (upvoteCount > config.upvoteThreshold) {
                    post.style.border = "3px solid green";
                    post.style.backgroundColor = "rgba(0, 255, 0, 0.1)";
                }
            }
        }
        document.querySelectorAll(".post").forEach(processPost);
    }
    console.log('Highlighting enabled');
}

function removePostHighlighting() {
    document.querySelectorAll(".post").forEach(post => {
        post.style.border = '';
        post.style.backgroundColor = '';
    });
    console.log('Highlighting disabled');
}

function removeCSSRules() {
    const stylesheets = document.styleSheets;

    Array.from(stylesheets).forEach(stylesheet => {
        try {
            const rules = stylesheet.cssRules || stylesheet.rules;
            if (!rules) return;

            for (let j = rules.length - 1; j >= 0; j--) {
                const rule = rules[j].cssText;
                if (rule.includes("#navbar .button-gold-buy") ||
                    rule.includes("a.button-gold-buy") ||
                    rule.includes("a.button-gold-buy @media (max-width: 900px)")) {
                    stylesheet.deleteRule(j);
                }
            }
        } catch (e) {
            console.error("Unable to modify stylesheet:", e);
        }
    });
}

removeCSSRules();

function replaceGoldBuyButtons() {
    const targetButtons = document.querySelectorAll('.button.button-gold-buy');

    targetButtons.forEach(buttonElement => {
        buttonElement.removeAttribute('onclick');
        if (buttonElement.tagName.toLowerCase() === 'a') {
            buttonElement.removeAttribute('href');
        }

        const newButtonElement = buttonElement.cloneNode(true);
        buttonElement.parentNode.replaceChild(newButtonElement, buttonElement);

        newButtonElement.innerHTML = '';

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'scroll-button-container';

        buttonContainer.appendChild(createScrollButton('icon-enter-up2', scrollToTop, 'Ylös'));
        buttonContainer.appendChild(createScrollButton('icon-enter-down2', scrollToBottom, 'Alas'));

        newButtonElement.appendChild(buttonContainer);
    });
}

replaceGoldBuyButtons();

function createScrollButton(iconClass, scrollFunction, title) {
    const button = document.createElement('button');
    button.className = `scroll-button ${iconClass}`;
    button.title = title;
    button.addEventListener('click', scrollFunction);
    return button;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function updateHidelistaCache() {
    const regex = /^#HIDELISTA/;
    const postMessages = document.querySelectorAll('.post-message');
    let currentRealIDs = [];
    const requiredTexts = ["HIDETYSOHJE:", "RYBO", "RYBOT", "HIDETTÄMISEN AVUKSI:", "OHJE:", "#RYBOLISTA"];
    const realHIDELISTAs = [];

    postMessages.forEach(message => {
        const messageText = message.textContent.trim();

        if (regex.test(messageText)) {
            const containsRequiredTexts = requiredTexts.some(text => messageText.includes(text));
            const containsOnlyIDs = !containsRequiredTexts && /ID\s?\d+\s?/g.test(messageText);

            if (containsRequiredTexts) {
                realHIDELISTAs.push(messageText);
            }
        }
    });

    if (realHIDELISTAs.length > 0) {
        currentRealIDs = realHIDELISTAs.flatMap(text => Array.from(text.matchAll(/ID\s?([0-9]+)\s?/g)).map(r => r[1]));
        console.log('Current real HIDELISTA detected:', currentRealIDs);

        chrome.storage.local.get('postIds', function(data) {
            const cachedRealIDs = data.postIds || [];
            const newIDs = currentRealIDs.filter(id => !cachedRealIDs.includes(id));

            if (newIDs.length > 0) {
                const updatedIDs = [...new Set([...cachedRealIDs, ...currentRealIDs])];
                chrome.storage.local.set({ postIds: updatedIDs }, function() {
                    console.log('New IDs found. HIDELISTA cache updated:', updatedIDs);
                    hidePosts(updatedIDs);
                });
            } else {
                console.log('No new IDs in HIDELISTA. Cache is up to date.');
            }
        });
    } else {
        console.log('No real HIDELISTA found.');
    }
}

chrome.storage.local.get(['highlightEnabled', 'hidePostsEnabled', 'shoutboxEnabled', 'postIds', 'fakePostIds'], function(data) {
    highlightEnabled = data.highlightEnabled !== undefined ? data.highlightEnabled : true;
    hidePostsEnabled = data.hidePostsEnabled !== undefined ? data.hidePostsEnabled : true;
    shoutboxEnabled = data.shoutboxEnabled !== undefined ? data.shoutboxEnabled : true;
    postIds = data.postIds || [];
    fakePostIds = data.fakePostIds || [];

    if (highlightEnabled) {
        applyPostHighlighting();
    }

    if (hidePostsEnabled && window.location.pathname.includes('/sodat/')) {
        hidePosts(postIds);
    }

    if (shoutboxEnabled) {
        enableShoutbox();
    } else {
        disableShoutbox();
    }
});

if (window.location.pathname.includes('/sodat/')) {
    updateHidelistaCache();
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

chrome.runtime.onMessage.addListener(debounce((request, sender, sendResponse) => {
    if (request.type === 'UPDATE_HIDELISTA_CACHE') {
        updateHidelistaCache();
    }

    if (request.type === 'TOGGLE_HIGHLIGHT') {
        highlightEnabled = request.enable;
        if (highlightEnabled) {
            applyPostHighlighting();
        } else {
            removePostHighlighting();
        }
        chrome.storage.local.set({ highlightEnabled });
    }

    if (request.type === 'TOGGLE_HIDE_POSTS') {
        hidePostsEnabled = request.enable;
        postIds = request.ids || [];
        if (hidePostsEnabled && window.location.pathname.includes('/sodat/')) {
            hidePosts(postIds);
        } else {
            showPosts(postIds);
        }
        chrome.storage.local.set({ hidePostsEnabled, postIds });
    }

    if (request.type === 'TOGGLE_SHOUTBOX') {
        shoutboxEnabled = request.enable;
        if (shoutboxEnabled) {
            enableShoutbox();
        } else {
            disableShoutbox();
        }
        chrome.storage.local.set({ shoutboxEnabled });
    }
}, 300));
