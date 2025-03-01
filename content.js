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

//** TESTI HIDELISTA */ */
function updateHidelistaCache() {
    const posts = document.querySelectorAll('.post-message, .post-content');
    let candidates = [];
    const markerRegex = /(#hidelista|langan vakiohidet:)/i;
    const guidance = [
        "hidetysohje", 
        "rybo", 
        "rybot", 
        "ohje", 
        "#rybolista", 
        "muistutus"
    ];
    
    chrome.storage.local.set({ postIds: [] }, () => {
        console.log("HIDELISTA cache cleared.");
    });
    
    posts.forEach((post, idx) => {
        const rawText = post.innerText.trim();
        const lowerText = rawText.toLowerCase();
        if (markerRegex.test(rawText) && guidance.some(g => lowerText.includes(g))) {
            let listPart = "";
            if (rawText.indexOf(':') !== -1) {
                listPart = rawText.split(/:\s*/).slice(1).join(" ");
            } else {
                let lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
                if (lines[0] && markerRegex.test(lines[0])) {
                    lines.shift();
                }
                listPart = lines.join(" ");
            }
            listPart = listPart.replace(/\n/g, " ").trim();
            
            let numbers = [];
            if (/ID\s*\d+/i.test(listPart)) {
                let matches = listPart.match(/ID\s*([0-9]+)/gi);
                if (matches) {
                    numbers = matches.map(s => {
                        let m = s.match(/\d+/);
                        return m ? parseInt(m[0], 10) : null;
                    }).filter(n => n !== null);
                }
            } else {
                let nums = listPart.match(/\b\d+\b/g);
                if (nums) {
                    numbers = nums.map(n => parseInt(n, 10));
                }
            }
            numbers = numbers.filter(n => n < 1000);
            
            console.log(`Post ${idx} -> extracted numbers:`, numbers);
            if (numbers.length >= 3) {
                candidates.push({ numbers, idx });
            }
        }
    });
    
    if (candidates.length > 0) {
        let bestCandidate = candidates.reduce((prev, curr) => {
            if (curr.numbers.length > prev.numbers.length) return curr;
            else if (curr.numbers.length === prev.numbers.length)
                return (curr.idx < prev.idx ? curr : prev);
            return prev;
        });
        let uniqueNumbers = Array.from(new Set(bestCandidate.numbers)).sort((a, b) => a - b);
        console.log("Detected HIDELISTA numbers:", uniqueNumbers);
        chrome.storage.local.set({ postIds: uniqueNumbers.map(String) }, () => {
            console.log("HIDELISTA cache updated:", uniqueNumbers);
        });
    } else {
        console.log("No real HIDELISTA found.");
    }
}
//** TESTI HIDELISTA 0.7.7 */

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