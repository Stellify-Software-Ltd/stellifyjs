export class Validator {
    constructor({ rules, container = null, locale = "en", apiBaseUrl = "" } = {}) {
      this.rules = rules;
      this.errors = {};
      this.container = container; // Dependency Injection support
      this.debounceTimers = {}; // Store debounced function calls
      this.apiBaseUrl = apiBaseUrl;
    }

    /**
     * Check if any rule is async (i.e. requires an API call)
     * @param {Object} data - Form data to validate.
     * @returns {Boolean} - Returns true if validation passes, false otherwise.
     */
    async validate(data) {
      const hasAsyncRules = Object.keys(this.rules).some((field) =>
        this.rules[field].split("|").some((rule) => this.isAsyncRule(rule))
      );
    
      return hasAsyncRules ? await this.validateAsync(data) : this.validateSync(data);
    }
  
    /**
     * Validate the given data synchronously.
     * @param {Object} data - Form data to validate.
     * @returns {Boolean} - Returns true if validation passes, false otherwise.
     */
    validateSync(data) {
      this.errors = {}; // Reset errors
  
      for (const field in this.rules) {
        const rulesArray = this.rules[field].split("|");
  
        for (const rule of rulesArray) {
          let [ruleName, param, customMessage] = rule.split(":");
          [param, customMessage] = param ? param.split(",") : [null, null];
  
          const ruleFunc = this.getRuleFunction(ruleName);
          if (!ruleFunc) {
            throw new Error(`Validation rule "${ruleName}" is not defined.`);
          }
  
          const error = ruleFunc(data[field], param);
          if (error) {
            this.addError(field, customMessage || error);
          }
        }
      }
  
      return Object.keys(this.errors).length === 0;
    }
  
    /**
     * Validate the given data asynchronously with debouncing.
     * @param {Object} data - Form data to validate.
     * @returns {Promise<Boolean>} - Resolves to true if validation passes, false otherwise.
     */
    async validateAsync(data) {
      this.errors = {}; // Reset errors
      const validationPromises = [];
  
      for (const field in this.rules) {
        const rulesArray = this.rules[field].split("|");
  
        for (const rule of rulesArray) {
          let [ruleName, param, customMessage] = rule.split(":");
          [param, customMessage] = param ? param.split(",") : [null, null];
  
          const ruleFunc = this.getRuleFunction(ruleName);
          if (!ruleFunc) {
            throw new Error(`Validation rule "${ruleName}" is not defined.`);
          }
  
          if (ruleFunc instanceof Function) {
            const validatePromise = this.debounce(async () => {
              let error = ruleFunc(data[field], param);
              if (error instanceof Promise) {
                error = await error;
              }
              if (error) {
                this.addError(field, customMessage || error);
              }
            }, 300); // 300ms debounce
  
            validationPromises.push(validatePromise());
          }
        }
      }
  
      await Promise.all(validationPromises);
      return Object.keys(this.errors).length === 0;
    }
  
    /**
     * Retrieve validation rule function, either from this class or DI container.
     * @param {String} ruleName - The validation rule name.
     * @returns {Function|null} - The validation function.
     */
    getRuleFunction(ruleName) {
      return this[ruleName] || (this.container ? this.container.resolve(ruleName) : null);
    }
  
    /**
     * Debounce function execution to prevent excessive API calls.
     * @param {Function} func - The function to debounce.
     * @param {Number} wait - Delay in milliseconds.
     * @returns {Function} - Debounced function.
     */
    debounce(func, wait) {
      return (...args) => {
        clearTimeout(this.debounceTimers[func]);
        return new Promise((resolve) => {
          this.debounceTimers[func] = setTimeout(() => resolve(func(...args)), wait);
        });
      };
    }
  
    /**
     * Add an error message for a field.
     * @param {String} field - The field name.
     * @param {String} message - The error message.
     */
    addError(field, message) {
      if (!this.errors[field]) {
        this.errors[field] = [];
      }
      this.errors[field].push(message);
    }
  
    /**
     * Retrieve validation errors.
     * @returns {Object} - Object containing field errors.
     */
    getErrors() {
      return this.errors;
    }
  
    // === Validation Rules ===
  
    required(value) {
      return !value ? "This field is required." : null;
    }
  
    email(value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return value && !emailRegex.test(value) ? "Invalid email address." : null;
    }
  
    min(value, param) {
      return value.length < param ? `Must be at least ${param} characters.` : null;
    }
  
    max(value, param) {
      return value.length > param ? `Must be no more than ${param} characters.` : null;
    }
  
    numeric(value) {
      return isNaN(value) ? "This field must be a number." : null;
    }
  
    async uniqueEmail(value) {
      try {
        const response = await fetch(`https://api.example.com/check-email?email=${encodeURIComponent(value)}`);
        const result = await response.json();
        return result.exists ? "This email is already taken." : null;
      } catch (error) {
        return "Error validating email.";
      }
    }
  
    async usernameExists(value) {
      try {
        const response = await fetch(`https://api.example.com/check-username?username=${encodeURIComponent(value)}`);
        const result = await response.json();
        return result.exists ? "This username is already in use." : null;
      } catch (error) {
        return "Error checking username.";
      }
    }
  }
  