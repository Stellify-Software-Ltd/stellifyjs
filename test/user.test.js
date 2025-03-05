import { User } from "../src/models/User";

test("User model should store and update data", () => {
  const user = new User("John Doe", "john@example.com");
  expect(user.getUser()).toEqual({ name: "John Doe", email: "john@example.com" });

  user.update({ name: "Jane Doe" });
  expect(user.getUser().name).toBe("Jane Doe");
});