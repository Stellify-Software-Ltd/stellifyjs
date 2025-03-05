import { di } from "../src/container";

test("Container should bind and resolve dependencies", () => {
    class AuthService {
        login() {
        return "User logged in";
        }
    }

    di.bind("AuthService", () => new AuthService());
    const authService = di.make("AuthService");

    expect(authService.login()).toBe("User logged in");
});