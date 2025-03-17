class Router {
    constructor(routes) {
        this.routes = routes;
        window.addEventListener('popstate', () => this.render());
    }

    navigate(path) {
        history.pushState({}, '', path);
        this.render();
    }

    render() {
        const path = window.location.pathname;
        const route = this.routes[path] || this.routes['/404'];
        document.getElementById('app').innerHTML = route.render();
    }
}

export default Router;
