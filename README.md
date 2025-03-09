# StellifyJS

StellifyJS is a Laravel-inspired **front-end only framework** complete with dependency injection and various helper utilities such as form validation, a HTTP request wrapper and browser compatibility patches. 

## Purpose

I need/ want a Laravel like framework for my front-end development work that focuses on dependency injection/ contracts to help work with SOLID principles, especially Dependency Inversion (D in SOLID).

I also want to provide helper methods that result in the same type of elegant & expressive syntax you get in Laravel as well as built-in code that simplifies common tasks such as front-end authentication and form validation. I'm even contemplating CLI stuff similar to Laravel Artisan to automatically scaffold classes such as models that could mirror the models that exist on you Laravel web app and also provide an elegant (or should I say Eloquent?), ORM for manipulating data.


## Use with Stellify

StellifyJS can be used to extend [Stellify](https://github.com/Stellify-Software-Ltd/stellify) by adding functionality that doesn't exist in the core framework. It is automatically exposed via the Window object in the Stellify editor (visit [stellisoft.com](https://stellisoft.com)) and therefore, it can be accessed and put to use with your own imported JS files directly; Or alternatively, you can pull down the package and bundle it up with various library extensions of your choosing, then request it from a server/ CDN.

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