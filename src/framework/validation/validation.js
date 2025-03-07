const rules = {
    required: (value) => value !== "" && value !== null && value !== undefined || "This field is required",
    email: (value) => /\S+@\S+\.\S+/.test(value) || "Invalid email format",
    min: (value, param) => value.length >= param || `Minimum length is ${param}`,
    max: (value, param) => value.length <= param || `Maximum length is ${param}`,
    numeric: (value) => !isNaN(value) || "Must be a number",
    regex: (value, param) => new RegExp(param).test(value) || "Invalid format",
};
  
export function addValidationRule(name, callback) {
    rules[name] = callback;
}
  
export function validate(data, ruleSet) {
    let errors = {};
  
    for (let field in ruleSet) {
        let fieldRules = ruleSet[field].split("|");

        for (let rule of fieldRules) {
            let [ruleName, param] = rule.includes(":") ? rule.split(":") : [rule];

            if (rules[ruleName]) {
                let result = rules[ruleName](data[field], param);
                if (result !== true) {
                    if (!errors[field]) errors[field] = [];
                    errors[field].push(result);
                }
            }
        }
    }
    return errors;
}

export async function validateAsync(data, ruleSet, asyncRules = {}) {
    let errors = validate(data, ruleSet);
  
    for (let field in asyncRules) {
        let asyncCheck = asyncRules[field];
        if (typeof asyncCheck === "function") {
            let result = await asyncCheck(data[field]);
            if (result !== true) {
                if (!errors[field]) errors[field] = [];
                errors[field].push(result);
            }
        }
    }
  
    return errors;
}
  
  