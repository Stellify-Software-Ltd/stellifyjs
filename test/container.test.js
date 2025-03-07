import { container } from "../src/framework/container/container";

test("Container should bind and resolve dependencies", () => {
    class AuthService {
        login() {
        return "User logged in";
        }
    }

    di.bind("AuthService", () => new AuthService());
    const authService = container.make("AuthService");

    expect(authService.login()).toBe("User logged in");
});