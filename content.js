// 'asetukset'
let highlightEnabled = true;
let hidePostsEnabled = true;
let shoutboxEnabled = true;
let postIds = [];
let fakePostIds = [];

// vierityspainikkeet
function createScrollButton(iconClass, onClick, label) {
    const button = document.createElement("button");
    button.className = "scroll-button";
    button.innerHTML = `<span class="${iconClass}">${label}</span>`;
    button.onclick = onClick;
    return button;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

// Shoutboxin piilotus
function enableShoutbox() {
    const elements = ['#shoutbox', '#shouts', '#shout-form'];
    elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = 'none';
        }
    });
    console.log('Shoutbox piilotettu');
}

// Shoutboxin näyttö
function disableShoutbox() {
    const elements = ['#shoutbox', '#shouts', '#shout-form'];
    elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = '';
        }
    });
    console.log('Shoutbox näytetty');
}

// Viestien piilotus
function hidePosts(ids) {
    if (window.location.pathname.includes('/sodat/')) {
        chrome.storage.local.get(['hidelistaPostIndex'], function(data) {
            const skipIdx = data.hidelistaPostIndex;
            document.querySelectorAll('.post').forEach((post, idx) => {
                const userId = post.getAttribute('data-user-id');
                if (idx !== skipIdx && userId && ids.includes(userId)) {
                    post.style.display = 'none';
                }
            });
            console.log('Posts hidden:', ids);
        });
    }
}

// Viestien näyttäminen
function showPosts(ids) {
    if (window.location.pathname.includes('/sodat/')) {
        document.querySelectorAll('.post').forEach(post => {
            const userId = post.getAttribute('data-user-id');
            if (userId && ids.includes(userId)) {
                post.style.display = '';
            }
        });
        console.log('Viestit näytetty:', ids);
    }
}

// Viestien korostus
function applyPostHighlighting() {
    const baseURL = 'https://ylilauta.org/sodat/';
    if (window.location.href.startsWith(baseURL)) {
        const config = { upvoteThreshold: 5 };
        document.querySelectorAll(".post").forEach(post => {
            const upvoteElement = post.querySelector(".post-button .post-upvotes");
            if (upvoteElement) {
                const upvoteCount = parseInt(upvoteElement.textContent);
                if (upvoteCount > config.upvoteThreshold) {
                    post.style.border = "3px solid green";
                    post.style.backgroundColor = "rgba(0, 255, 0, 0.1)";
                }
            }
        });
        console.log('Korostus käytössä');
    }
}

// Korostuksen poisto
function removePostHighlighting() {
    document.querySelectorAll(".post").forEach(post => {
        post.style.border = '';
        post.style.backgroundColor = '';
    });
    console.log('Korostus pois käytöstä');
}

// Poista vanhat CSS-säännöt, jotka piilottavat kultapainikkeen
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
            console.error("Tyylisääntöjä ei voitu muokata:", e);
        }
    });
}

removeCSSRules();

// Korvaa kultapainike vierityspainikkeilla
function replaceGoldBuyButtons() {
    const targetButtons = document.querySelectorAll(
        '.button.button-gold-buy, a.button.gold-button'
    );

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

// Hidelistan hakuviestien perusteella
function updateHidelistaCache() {
    const posts = document.querySelectorAll('.post-message, .post-content');
    let candidates = [];
    const markerRegex = /#hidelista/i;
    const guidanceKeywords = ["hidetysohje", "rybo", "rybot", "ohje", "#rybolista", "muistutus"];
    const minLength = 100; 

    // Tyhjennetään aiemmat id:t välittömästi, että piilotus toimii heti
    postIds = [];
    chrome.storage.local.set({ postIds: [] }, () => {
        console.log("HIDELISTA välimuisti tyhjennetty.");
    });

    posts.forEach((post, idx) => {
        const rawText = post.innerText.trim();
        const lowerText = rawText.toLowerCase();

        if (rawText.length < minLength) return;

        if (markerRegex.test(rawText)) {
            // Vanha tyyli: etsitään "ID x" -numerot
            const oldStyleIds = [];
            const idMatches = rawText.matchAll(/ID\s?(\d+)/gi);
            for (const match of idMatches) {
                oldStyleIds.push(parseInt(match[1], 10));
            }

            if (oldStyleIds.length > 0) {
                if (!oldStyleIds.includes(1)) oldStyleIds.push(1);
                oldStyleIds.sort((a, b) => a - b);
                candidates.push({ numbers: oldStyleIds, idx });
                return;
            }

            // Uusi tyyli: ohjetekstin sisältö ja rivien numerot
            if (guidanceKeywords.filter(g => lowerText.includes(g)).length >= 2) {
                let lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
                if (markerRegex.test(lines[0])) lines.shift();

                let numbers = [];
                for (const line of lines) {
                    let cleanedLine = line.replace(/\([^)]*\)/g, '').trim();
                    if (/^\d+$/.test(cleanedLine)) numbers.push(parseInt(cleanedLine, 10));
                }
                numbers = numbers.filter(n => n < 1000);

                if (numbers.length >= 3) candidates.push({ numbers, idx });
            }
        }
    });

    if (candidates.length > 0) {
        let bestCandidate = candidates.reduce((prev, curr) => {
            if (curr.numbers.length > prev.numbers.length) return curr;
            if (curr.numbers.length === prev.numbers.length)
                return (curr.idx < prev.idx ? curr : prev);
            return prev;
        });

        let uniqueNumbers = Array.from(new Set(bestCandidate.numbers)).sort((a, b) => a - b);

        postIds = uniqueNumbers.map(String);

        chrome.storage.local.set({
            postIds,
            hidelistaPostIndex: bestCandidate.idx
        }, () => {
            console.log("HIDELISTA välimuisti päivitetty:", postIds);
            if (hidePostsEnabled && window.location.pathname.includes('/sodat/')) {
                hidePosts(postIds);
            }
        });
    } else {
        console.log("HIDELISTA-viestiä ei löytynyt.");
        postIds = [];
        chrome.storage.local.set({ postIds: [] });
        if (window.location.pathname.includes('/sodat/')) {
            showPosts(postIds);
        }
    }
}

// Yläotsikko /sodat/-sivulle tilatiedoilla
function insertStatusHeader() {
    if (!window.location.pathname.includes('/sodat/')) return;

    chrome.storage.local.get(['highlightEnabled', 'hidePostsEnabled', 'shoutboxEnabled'], function(data) {
        const highlightEnabled = data.highlightEnabled !== undefined ? data.highlightEnabled : true;
        const hidePostsEnabled = data.hidePostsEnabled !== undefined ? data.hidePostsEnabled : true;
        const shoutboxEnabled = data.shoutboxEnabled !== undefined ? data.shoutboxEnabled : true;

        const header = document.createElement('h2');
        header.style.fontSize = '1.2rem';
        header.style.margin = '10px';
        header.style.padding = '10px';
        header.style.border = '2px solid #ccc';
        header.style.borderRadius = '8px';
        header.style.background = '#f5f5f5';
        header.style.color = '#333';
        header.style.textAlign = 'center';
        header.style.fontFamily = 'sans-serif';
        header.innerHTML = `
            <span>${highlightEnabled ? '✅ Korostus käytössä' : '❌ Korostus pois'}</span> |
            <span>${hidePostsEnabled ? '✅ Piilotus käytössä' : '❌ Piilotus pois'}</span> |
            <span>${shoutboxEnabled ? '✅ Shoutbox käytössä' : '❌ Shoutbox pois'}</span>
        `;

        document.body.insertBefore(header, document.body.firstChild);
    });
}

// PÄÄSUORITUS

// Alustetaan tilat local storagesta
chrome.storage.local.get(['highlightEnabled', 'hidePostsEnabled', 'shoutboxEnabled', 'postIds'], function(data) {
    if (data.highlightEnabled !== undefined) highlightEnabled = data.highlightEnabled;
    if (data.hidePostsEnabled !== undefined) hidePostsEnabled = data.hidePostsEnabled;
    if (data.shoutboxEnabled !== undefined) shoutboxEnabled = data.shoutboxEnabled;
    if (data.postIds !== undefined) postIds = data.postIds;

    // Suorita asetusten mukaiset toimenpiteet
    if (highlightEnabled) {
        applyPostHighlighting();
    } else {
        removePostHighlighting();
    }

    if (hidePostsEnabled) {
        hidePosts(postIds);
    } else {
        showPosts(postIds);
    }

    if (!shoutboxEnabled) {
        enableShoutbox();
    } else {
        disableShoutbox();
    }

    insertStatusHeader();
    replaceGoldBuyButtons();
    updateHidelistaCache();
});

// Pidä hidelista päivityksissä esim. 5 minuutin välein
setInterval(updateHidelistaCache, 5 * 60 * 1000);
