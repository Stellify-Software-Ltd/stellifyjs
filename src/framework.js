import { applyBrowserFixes } from "./browser-fixes.js";
import { reactive } from "./reactive.js";
import { validate } from "./validate.js";
import { di } from "./di.js";

applyBrowserFixes();

export {
    reactive,
    validate,
    di
};