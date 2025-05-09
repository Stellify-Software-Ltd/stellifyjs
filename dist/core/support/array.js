const Arr = {
  /**
   * Get a value from a nested object using dot notation.
   * @param {Object} obj
   * @param {string} path
   * @param {*} defaultValue
   * @returns {*}
   */
  get(obj, path, defaultValue = void 0) {
    return path.split(".").reduce((acc, key) => acc && acc[key] !== void 0 ? acc[key] : defaultValue, obj);
  },
  /**
   * Set a value in a nested object using dot notation.
   * @param {Object} obj
   * @param {string} path
   * @param {*} value
   */
  set(obj, path, value) {
    const keys = path.split(".");
    let current = obj;
    while (keys.length > 1) {
      let key = keys.shift();
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    current[keys[0]] = value;
  },
  /**
   * Check if a key exists in a nested object.
   * @param {Object} obj
   * @param {string} path
   * @returns {boolean}
   */
  has(obj, path) {
    return this.get(obj, path, "__missing__") !== "__missing__";
  },
  /**
   * Flatten a multi-dimensional array.
   * @param {Array} arr
   * @returns {Array}
   */
  flatten(arr) {
    return arr.reduce((flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? this.flatten(toFlatten) : toFlatten), []);
  },
  /**
   * Extract a specific key from an array of objects.
   * @param {Array} arr
   * @param {string} key
   * @returns {Array}
   */
  pluck(arr, key) {
    return arr.map((item) => item[key]);
  },
  /**
   * Remove duplicate values from an array.
   * @param {Array} arr
   * @returns {Array}
   */
  unique(arr) {
    return [...new Set(arr)];
  },
  /**
   * Shuffle the array randomly.
   * @param {Array} arr
   * @returns {Array}
   */
  shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  },
  /**
   * Get the first item of an array.
   * @param {Array} arr
   * @returns {*}
   */
  first(arr) {
    return arr.length ? arr[0] : void 0;
  },
  /**
   * Get the last item of an array.
   * @param {Array} arr
   * @returns {*}
   */
  last(arr) {
    return arr.length ? arr[arr.length - 1] : void 0;
  }
};
if (typeof window !== "undefined") {
  window.Stellify = window.Stellify || {};
  window.Stellify.Arr = Arr;
}

export { Arr };
