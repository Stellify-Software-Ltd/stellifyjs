class Facade {
    static getFacadeAccessor() {
        throw new Error('Facade does not implement getFacadeAccessor method.');
    }

    static getFacadeRoot() {
        return container.resolve(this.getFacadeAccessor());
    }

    static __callStatic(method, args) {
        const instance = this.getFacadeRoot();
        return instance[method](...args);
    }
}