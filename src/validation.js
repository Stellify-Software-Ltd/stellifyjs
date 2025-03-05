export function validate(data, rules) {
    const errors = {};
    for (const field in rules) {
        const ruleSet = rules[field].split("|");
        for (const rule of ruleSet) {
            if (rule === "required" && !data[field]) {
                errors[field] = "This field is required";
            }
            if (rule === "email" && !/^[^@]+@[^@]+\.[^@]+$/.test(data[field])) {
                errors[field] = "Invalid email";
            }
        }
    }
    return errors;
}
