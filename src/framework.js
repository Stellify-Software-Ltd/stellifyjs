import { applyBrowserFixes } from "./browser-fixes.js";
import { reactive } from "./reactive.js";
import { validate } from "./validation.js";
import { di } from "./container.js";

applyBrowserFixes();

export {
    reactive,
    validate,
    di
};