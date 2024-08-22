//content.js
//'asetukset'
let highlightEnabled = true;
let hidePostsEnabled = true;
let shoutboxEnabled = true;
let postIds = [];




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
    document.querySelectorAll('.post').forEach(post => {
        const userId = post.getAttribute('data-user-id');
        if (userId && ids.includes(userId)) {
            post.style.display = 'none';
        }
    });
    console.log('Posts hidden');
}

function showPosts(ids) {
    document.querySelectorAll('.post').forEach(post => {
        const userId = post.getAttribute('data-user-id');
        if (userId && ids.includes(userId)) {
            post.style.display = '';
        }
    });
    console.log('Posts shown');
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

        newButtonElement.appendChild(createScrollButton('^', scrollToTop));
        newButtonElement.appendChild(createScrollButton('v', scrollToBottom));
    });
}

replaceGoldBuyButtons();

function createScrollButton(symbol, scrollFunction) {
    const button = document.createElement('button');
    button.innerText = symbol;
    button.style.cssText = `
        padding: 10px;
        margin: 5px;
        font-size: 18px;
        background-color: #333;
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    `;
    button.addEventListener('click', scrollFunction);
    return button;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

chrome.storage.local.get(['highlightEnabled', 'hidePostsEnabled', 'shoutboxEnabled', 'postIds'], function(data) {
    highlightEnabled = data.highlightEnabled !== undefined ? data.highlightEnabled : true;
    hidePostsEnabled = data.hidePostsEnabled !== undefined ? data.hidePostsEnabled : true;
    shoutboxEnabled = data.shoutboxEnabled !== undefined ? data.shoutboxEnabled : true;
    postIds = data.postIds || [];

    if (highlightEnabled) {
        applyPostHighlighting();
    }
    if (hidePostsEnabled) {
        hidePosts(postIds);
    }
    if (shoutboxEnabled) {
        enableShoutbox();
    } else {
        disableShoutbox();
    }
});

if (window.location.pathname.includes('/sodat/')) {
    (function() {
        const regex = /^#HIDELISTA/;
        const postMessages = document.querySelectorAll('.post-message');
        let ids = [];
        postMessages.forEach(message => {
            if (regex.test(message.textContent)) {
                const messageText = message.textContent;
                ids = Array.from(messageText.matchAll(/ID\s?([0-9]+)\s?/g)).map(r => r[1]);
                console.log('IDs extracted:', ids);
                chrome.storage.local.set({ postIds: ids });
                return;
            }
        });
        if (ids.length > 0) {
            hidePosts(ids);
        } else {
            console.log('No matching message with IDs found');
        }
    })();
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

chrome.runtime.onMessage.addListener(debounce((request, sender, sendResponse) => {
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
        if (hidePostsEnabled) {
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
