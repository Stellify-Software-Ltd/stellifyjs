import { validate } from "../src/validation";

test("Validation should return errors for missing required fields", () => {
    const rules = {
        name: "required",
        email: "required|email"
    };
    
    const data = { name: "", email: "invalid-email" };
    const errors = validate(data, rules);
    
    expect(errors).toEqual({
        name: "This field is required",
        email: "Invalid email"
    });
});

test("Validation should pass with correct data", () => {
    const rules = {
        name: "required",
        email: "required|email"
    };
    
    const data = { name: "John Doe", email: "john@example.com" };
    const errors = validate(data, rules);
    
    expect(errors).toEqual({});
});