export const Str = {
  /**
   * Convert a word to its plural form.
   * @param {string} str
   * @param {number} count - If count is 1, return singular
   * @returns {string}
   */
  plural(str, count = 2) {
    if (count === 1) return str; // Keep singular if count is 1

    const irregulars = {
      person: "people",
      man: "men",
      woman: "women",
      child: "children",
      mouse: "mice",
      tooth: "teeth",
      foot: "feet"
    };

    if (irregulars[str.toLowerCase()]) {
      return irregulars[str.toLowerCase()];
    }

    if (str.match(/(s|sh|ch|x|z)$/i)) {
      return str + "es";
    }

    if (str.match(/[^aeiou]y$/i)) {
      return str.replace(/y$/, "ies");
    }

    return str + "s";
  },

  /**
   * Convert a word to its singular form.
   * @param {string} str
   * @returns {string}
   */
  singular(str) {
    const irregulars = {
      people: "person",
      men: "man",
      women: "woman",
      children: "child",
      mice: "mouse",
      teeth: "tooth",
      feet: "foot"
    };

    if (irregulars[str.toLowerCase()]) {
      return irregulars[str.toLowerCase()];
    }

    if (str.match(/(s|sh|ch|x|z)es$/i)) {
      return str.replace(/es$/, "");
    }

    if (str.match(/ies$/i)) {
      return str.replace(/ies$/, "y");
    }

    if (str.match(/s$/i) && !str.match(/ss$/i)) {
      return str.replace(/s$/, "");
    }

    return str;
  },

  /**
   * Convert a string to camelCase.
   * @param {string} str 
   * @returns {string}
   */
  camelCase(str) {
    return str
      .replace(/[-_]+/g, " ")
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, "");
  },

  /**
   * Convert a string to snake_case.
   * @param {string} str
   * @returns {string}
   */
  snakeCase(str) {
    return str
      .replace(/\s+/g, "_")
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toLowerCase();
  },

  /**
   * Convert a string to kebab-case.
   * @param {string} str
   * @returns {string}
   */
  kebabCase(str) {
    return str
      .replace(/\s+/g, "-")
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase();
  },

  /**
   * Convert a string to StudlyCase (PascalCase).
   * @param {string} str
   * @returns {string}
   */
  studlyCase(str) {
    return str
      .replace(/[-_]+/g, " ")
      .replace(/\s(.)/g, (match) => match.toUpperCase())
      .replace(/\s/g, "")
      .replace(/^(.)/, (match) => match.toUpperCase());
  },

  /**
   * Generate a URL-friendly slug from a string.
   * @param {string} str
   * @returns {string}
   */
  slug(str) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "") // Remove non-alphanumeric chars
      .trim()
      .replace(/\s+/g, "-"); // Replace spaces with dashes
  },

  /**
   * Generate a random string.
   * @param {number} length
   * @returns {string}
   */
  random(length = 16) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
  },

  /**
   * Check if a string starts with a given substring.
   * @param {string} str
   * @param {string} prefix
   * @returns {boolean}
   */
  startsWith(str, prefix) {
    return str.startsWith(prefix);
  },

  /**
   * Check if a string ends with a given substring.
   * @param {string} str
   * @param {string} suffix
   * @returns {boolean}
   */
  endsWith(str, suffix) {
    return str.endsWith(suffix);
  },

  /**
   * Truncate a string and add "..." if it exceeds a certain length.
   * @param {string} str
   * @param {number} length
   * @returns {string}
   */
  truncate(str, length = 100) {
    return str.length > length ? str.substring(0, length) + "..." : str;
  }
};
  