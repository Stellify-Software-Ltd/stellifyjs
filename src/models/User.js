import { reactive } from "../reactive.js";

export class User {
    constructor(name, email) {
        this.state = reactive({ name, email });
    }

    update(data) {
        Object.assign(this.state, data);
    }

    getUser() {
        return this.state;
    }
}