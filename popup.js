// When the popup Paste Button is clicked
const onCopyButtonClick = () => {
    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            chrome.cookies.getAll({ url: tab[0].url }, cookie => {
                localStorage.aviCookieData = JSON.stringify(cookie);
            });
        },
    );
    setTimeout(() => handlePopupUI('copy'), 200);
};

// When the popup Paste Button is clicked
const onPasteButtonClick = () => {
    const aviCookieData = localStorage.aviCookieData
        ? JSON.parse(localStorage.aviCookieData)
        : null;
    if (!aviCookieData)
        return alert('Oh Man! You need to copy the cookies first.');

    let validTabUrl = true;

    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            if (tab[0].url) {
                aviCookieData.forEach(({ name, path, value }, index) => {
                    try {
                        const currentUrl = tab[0].url;
                        const url = new URL(currentUrl);
                        chrome.cookies.set({
                            url: currentUrl,
                            name,
                            path,
                            value,
                            domain: url.domain || url.hostname,
                        });
                    } catch (error) {
                        console.error(`There was an error: ${error}`);
                    }
                });
            } else {
                validTabUrl = false;
                return alert('Tab with invalid URL. Are you kidding me ???');
            }
        },
    );
    setTimeout(() => {
        if (validTabUrl) onResetButtonClick('paste');
    }, 200);
};

// When the popup Reset Button is clicked
const onResetButtonClick = action => {
    localStorage.removeItem('aviCookieData');
    handlePopupUI(action);
};

const onClearButtonClick = () => {
    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            if (tab[0].url) {
                const url = tab[0].url;
                const { domain } = new URL(url);
                chrome.cookies.getAll({ domain }, cookies => {
                    if (Array.isArray(cookies) && cookies.length > 0) {
                        cookies.forEach(cookie => {
                            cookie.name && chrome.cookies.remove({ url, name: cookie.name });
                        })
                    }
                });
            }
        },
    );
}

const handlePopupUI = action => {
    const aviCookieData = localStorage.aviCookieData
        ? JSON.parse(localStorage.aviCookieData)
        : null;
    const containerElement = document.getElementById('container');
    containerElement.setAttribute('class', '');
    if (aviCookieData) {
        containerElement.classList.add('containerCopied');
    } else {
        containerElement.classList.add('containerPasted');
    }

    const successPasteLabel = document.getElementById('successPasteLabel');
    const welcomeLabel = document.getElementById('welcomeLabel');
    if (action === 'paste') {
        successPasteLabel.setAttribute('style', 'display: block');
    } else {
        successPasteLabel.setAttribute('style', 'display: none');
    }
    if (action === 'copy' || aviCookieData) {
        welcomeLabel.setAttribute('style', 'display: none');
    } else if (action === 'reset') {
        welcomeLabel.setAttribute('style', 'display: block');
    }
};

// When the popup HTML has loaded
window.addEventListener('load', event => {
    handlePopupUI();

    document
        .getElementById('copyButton')
        .addEventListener('click', onCopyButtonClick);
    document
        .getElementById('pasteButton')
        .addEventListener('click', onPasteButtonClick);
    document
        .getElementById('resetButton')
        .addEventListener('click', () => onResetButtonClick('reset'));
    const btns = document.querySelectorAll('.clearButton');
    [...btns].forEach(btn => {
        btn.addEventListener('click', onClearButtonClick);
    })
});
