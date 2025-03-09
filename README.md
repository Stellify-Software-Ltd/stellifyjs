# StellifyJS

StellifyJS is a Laravel-inspired **front-end only framework** complete with state management, dependency injection and testing. In addition to these things, it provides built-in features that allow you to perform common tasks such as validating form input, handling user sign in and communicating with your server-side application to maintain state.

## Use with Stellify

StellifyJS can be used to extend Stellify by scaffold functionality that doesn't exist in the core framework. It is automatically exposed via the Window object in the Stellify editor (see [Stellisoft](https://stellisoft.com)) and therefore, it can be accessed and used with your own imported JS files or you can download the package and bundle it up with various library extensions of your choosing.

## Installation
```sh
npm install stellifyjs
```

## Usage
```js
import { reactive, validate, di } from "stellifyjs";
```

## License
MIT