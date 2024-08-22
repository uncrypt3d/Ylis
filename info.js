document.addEventListener('DOMContentLoaded', function() {
    const manifest = chrome.runtime.getManifest();
    const version = manifest.version;
    const versionElement = document.getElementById('version');
    versionElement.textContent = version;
});
