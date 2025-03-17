class ValidatorContract {
    constructor() {
      if (new.target === ValidatorContract) {
        throw new Error("Cannot instantiate an abstract class.");
      }
    }
  
    validate(data, rules) {
      throw new Error("Method 'validate' must be implemented.");
    }
  
    async validateAsync(data, rules) {
      throw new Error("Method 'validateAsync' must be implemented.");
    }
  }
  
  export default ValidatorContract;