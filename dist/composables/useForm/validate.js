import { get, expandWildcards } from './paths';
/**
 * Run validation rules against data
 * Returns empty object if all pass, otherwise returns errors by path
 */
export function runValidation(data, rules) {
    const errors = {};
    for (const [pattern, ruleList] of Object.entries(rules)) {
        // Expand wildcards to concrete paths
        const paths = expandWildcards(data, pattern);
        for (const path of paths) {
            const value = get(data, path);
            // Run each rule in order, first failure wins
            for (const rule of ruleList) {
                const result = rule(value, data, path);
                if (result !== true) {
                    if (!errors[path]) {
                        errors[path] = [];
                    }
                    errors[path].push(result);
                    break; // First failure wins - one error per path at a time
                }
            }
        }
    }
    return errors;
}
