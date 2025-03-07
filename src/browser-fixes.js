export function fixIOSCopyPaste() {
    document.addEventListener("selectionchange", () => {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === "TEXTAREA") {
            activeElement.blur(); // Deselects text to force the clipboard to update
            setTimeout(() => activeElement.focus(), 10); // Restores focus after a small delay
        }
    });
}

export function disableDoubleTapZoom() {
    let lastTouchTime = 0;
    document.addEventListener("touchend", (event) => {
        const now = new Date().getTime();
        if (now - lastTouchTime <= 300) {
            event.preventDefault();
        }
        lastTouchTime = now;
    }, { passive: false });
}

export function fixIOSFixedPosition() {
    window.addEventListener("focusin", () => {
        document.body.classList.add("ios-keyboard-open");
    });
  
    window.addEventListener("focusout", () => {
        document.body.classList.remove("ios-keyboard-open");
    });
}

export function forceIOSInputFocus() {
    document.addEventListener("touchend", (event) => {
        const target = event.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            setTimeout(() => target.focus(), 50);
        }
    });
}

export function fixAndroidKeyboardResize() {
    window.addEventListener("resize", () => {
        document.body.style.height = `${window.innerHeight}px`;
    });
}

// Auto-apply fixes when loaded
export function applyBrowserFixes() {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        fixIOSCopyPaste();
        disableDoubleTapZoom();
        fixIOSFixedPosition();
        forceIOSInputFocus();
    }
}
