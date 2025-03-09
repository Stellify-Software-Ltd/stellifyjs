import { applyBrowserFixes } from "./browser-fixes.js";
import { reactive } from "./reactive.js";
import { Validator } from "./framework/validation/validation.js";
import { Container } from "./framework/container/container.js";
import { http } from "./framework/http/http.js";

applyBrowserFixes();

export {
    http,
    reactive,
    Validator,
    Container
};