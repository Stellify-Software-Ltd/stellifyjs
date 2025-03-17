class EventDispatcher {
    constructor() {
        this.listeners = {}; // Store events and their listeners
    }

    // Register an event listener
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    // Dispatch an event
    dispatch(event, data) {
        const eventListeners = this.listeners[event] || [];
        eventListeners.forEach((listener) => listener(data));
    }
}