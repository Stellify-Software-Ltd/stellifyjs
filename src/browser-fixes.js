export function fixIOSCopyPaste() {
    document.addEventListener("selectionchange", () => {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === "TEXTAREA") {
            activeElement.blur(); // Deselects text to force the clipboard to update
            setTimeout(() => activeElement.focus(), 10); // Restores focus after a small delay
        }
    });
}
  
  // Auto-apply fixes when loaded
export function applyBrowserFixes() {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        fixIOSCopyPaste();
    }
}