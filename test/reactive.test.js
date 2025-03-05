import { jest } from "@jest/globals";
import { reactive } from "../src/reactive";

test("Reactive state should update and trigger logs", () => {
  console.log = jest.fn(); // Mock console.log

  const state = reactive({ count: 0 });
  expect(state.count).toBe(0);
  
  state.count = 1;
  expect(state.count).toBe(1);
  expect(console.log).toHaveBeenCalledWith("State changed: count = 1");
});