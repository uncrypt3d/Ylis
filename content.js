// kultishuoracss
function removeCSSRules() {
    const stylesheets = document.styleSheets;

    for (let i = 0; i < stylesheets.length; i++) {
        const stylesheet = stylesheets[i];
        try {
            const rules = stylesheet.cssRules || stylesheet.rules;
            if (!rules) continue;

            for (let j = rules.length - 1; j >= 0; j--) {
                const rule = rules[j].cssText;

                // Match and remove specific rules
                if (rule.includes("#navbar .button-gold-buy") ||
                    rule.includes("a.button-gold-buy") ||
                    rule.includes("a.button-gold-buy @media (max-width: 900px)")) {

                    stylesheet.deleteRule(j);
                }
            }
        } catch (e) {
            console.error("Can't touch css: ", e);
        }
    }
}

removeCSSRules();

const targetButtons = document.querySelectorAll('.button.button-gold-buy');

targetButtons.forEach(buttonElement => {

    buttonElement.removeAttribute('onclick');

    if (buttonElement.tagName.toLowerCase() === 'a') {
        buttonElement.removeAttribute('href');
    }

    const newButtonElement = buttonElement.cloneNode(true);
    buttonElement.parentNode.replaceChild(newButtonElement, buttonElement);

    newButtonElement.innerHTML = '';

    const scrollToTopButton = createScrollButton('^', scrollToTop);
    const scrollToBottomButton = createScrollButton('v', scrollToBottom);

    newButtonElement.appendChild(scrollToTopButton);
    newButtonElement.appendChild(scrollToBottomButton);
});

function createScrollButton(symbol, scrollFunction) {
    const button = document.createElement('button');
    button.innerText = symbol;
    button.style.padding = '10px';
    button.style.margin = '5px';
    button.style.fontSize = '18px'; 
    button.style.backgroundColor = '#333';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.addEventListener('click', scrollFunction);
    return button;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function applyPostHighlighting() {
    const baseURL = 'https://ylilauta.org/sodat/';
    
    if (window.location.href.startsWith(baseURL)) {
        function highlightPosts() {
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

        highlightPosts();
    }
}

applyPostHighlighting();
