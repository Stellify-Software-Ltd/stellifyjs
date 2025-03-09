# StellifyJS

StellifyJS is a Laravel-inspired **front-end only framework** complete with dependency injection and various helper utilities such as form validation, a HTTP request wrapper and browser compatibility patches. 

## Purpose

As with Laravel, StellifyJS uses dependency injection to inject classes via the constructor (or in some casses the setter method) so as to better integrate and maintain compatibility of class dependencies. This will hopefully lead to the creation of an ecosystem where we (JS developers) are striving towards common goals rather than developing disparate packages that need to be shoehorned into projects with no guarantees of ongoing compatibility as code is changed (or deprectaed).

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