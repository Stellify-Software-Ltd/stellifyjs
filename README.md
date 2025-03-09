# StellifyJS

StellifyJS is a Laravel-inspired **front-end only framework** complete with dependency injection and various helper utilities such as form validation, a HTTP request wrapper and browser compatibility patches. 

## Use with Stellify

StellifyJS can be used to extend Stellify by scaffold functionality that doesn't exist in the core framework. It is automatically exposed via the Window object in the Stellify editor (visit [stellisoft.com](https://stellisoft.com)) and therefore, it can be accessed and used with your own imported JS files; Or alternatively, you can pull down the package and bundle it up with various library extensions of your choosing, then request it from a server.

## Installation
```sh
npm install stellifyjs
```

## Usage
```js
import { Container, Http, Validator } from "stellifyjs";
```

## License
MIT