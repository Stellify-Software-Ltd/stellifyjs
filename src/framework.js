import { applyBrowserFixes } from "./browser-fixes.js";
import { reactive } from "./reactive.js";
import { useValidation } from "./framework/validation/useValidation.js";
import { di } from "./framework/container/container.js";
import { http } from "./framework/http/http.js";

applyBrowserFixes();

export {
    http,
    reactive,
    useValidation,
    di
};