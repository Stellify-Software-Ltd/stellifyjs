# StellifyJS

StellifyJS is a Laravel-inspired **front-end only framework** complete with a service container and various other helper utilities such as collections, form validation, a HTTP request wrapper and so on.

## Using StellifyJS to build front-end functionality with Stellify

StellifyJS was created to provide the users of [Stellify](https://github.com/Stellify-Software-Ltd/stellify) the convenience they experience working with Laravel on the server, client-side. The various classes and helper functions provided are automatically exposed via the Window object in the Stellify editor (found at [stellisoft.com](https://stellisoft.com)). This means they can be accessed directly without installation. Alternatively, you can pull down the package and bundle it up with various library extensions of your choosing before requesting it from a server/ CDN.

## Installation
```sh
npm install stellifyjs
```

## Getting Started
```js
import { Container, Http, Validator } from "stellifyjs";
```

## Service Container

The service container is a powerful tool for managing class dependencies and performing dependency injection. You bind classes to the container as shown below:

```js
const container = new Container();
container.bind("str", Str);
```

Now, from anywhere in the framework, you can access string helpers dynamically:

```js
const strHelper = container.resolve("str");
console.log(strHelper.slug("Hello World!")); // "hello-world"
```

## String Helper Methods
Converts a word to its plural form.

```javascript
Str.plural('child'); // Returns: 'children'
Str.plural('book'); // Returns: 'books'
Str.plural('box'); // Returns: 'boxes'
Str.plural('baby'); // Returns: 'babies'
Str.plural('person', 1); // Returns: 'person'
```

### singular
Converts a word to its singular form.

```javascript
Str.singular('children'); // Returns: 'child'
Str.singular('books'); // Returns: 'book'
Str.singular('boxes'); // Returns: 'box'
Str.singular('babies'); // Returns: 'baby'
```

### camelCase
Converts a string to camelCase.

```javascript
Str.camelCase('foo_bar'); // Returns: 'fooBar'
Str.camelCase('foo-bar'); // Returns: 'fooBar'
Str.camelCase('Foo Bar'); // Returns: 'fooBar'
```

### snakeCase
Converts a string to snake_case.

```javascript
Str.snakeCase('fooBar'); // Returns: 'foo_bar'
Str.snakeCase('foo bar'); // Returns: 'foo_bar'
Str.snakeCase('Foo-Bar'); // Returns: 'foo_bar'
```

### kebabCase
Converts a string to kebab-case.

```javascript
Str.kebabCase('fooBar'); // Returns: 'foo-bar'
Str.kebabCase('foo_bar'); // Returns: 'foo-bar'
Str.kebabCase('Foo Bar'); // Returns: 'foo-bar'
```

### studlyCase
Converts a string to StudlyCase (PascalCase).

```javascript
Str.studlyCase('foo_bar'); // Returns: 'FooBar'
Str.studlyCase('foo-bar'); // Returns: 'FooBar'
Str.studlyCase('foo bar'); // Returns: 'FooBar'
```

### slug
Generates a URL-friendly slug from a string.

```javascript
Str.slug('Hello World!'); // Returns: 'hello-world'
Str.slug('Héllö Wörld'); // Returns: 'hello-world'
Str.slug('This & That'); // Returns: 'this-and-that'
```

### random
Generates a random string of specified length.

```javascript
Str.random(); // Returns: random 16 character string
Str.random(8); // Returns: random 8 character string
```

### startsWith
Checks if a string starts with a given substring.

```javascript
Str.startsWith('Hello World', 'Hello'); // Returns: true
Str.startsWith('Hello World', 'World'); // Returns: false
```

### endsWith
Checks if a string ends with a given substring.

```javascript
Str.endsWith('Hello World', 'World'); // Returns: true
Str.endsWith('Hello World', 'Hello'); // Returns: false
```

### truncate
Truncates a string and adds "..." if it exceeds a certain length.

```javascript
Str.truncate('This is a long text', 7); // Returns: 'This is...'
Str.truncate('Short text', 20); // Returns: 'Short text'
```

## Array Helper Methods

### get
Gets a value from a nested object using dot notation.

```javascript
const obj = { user: { profile: { name: 'John' } } };
Arr.get(obj, 'user.profile.name'); // Returns: 'John'
Arr.get(obj, 'user.profile.age', 25); // Returns: 25 (default value)
```

### set
Sets a value in a nested object using dot notation.

```javascript
const obj = {};
Arr.set(obj, 'user.profile.name', 'John');
// Result: { user: { profile: { name: 'John' } } }
```

### has
Checks if a key exists in a nested object.

```javascript
const obj = { user: { profile: { name: 'John' } } };
Arr.has(obj, 'user.profile.name'); // Returns: true
Arr.has(obj, 'user.profile.age'); // Returns: false
```

### flatten
Flattens a multi-dimensional array into a single-level array.

```javascript
const arr = [1, [2, 3], [4, [5, 6]]];
Arr.flatten(arr); // Returns: [1, 2, 3, 4, 5, 6]
```

### pluck
Extracts a specific key from an array of objects.

```javascript
const users = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
];
Arr.pluck(users, 'name'); // Returns: ['John', 'Jane']
```

### unique
Removes duplicate values from an array.

```javascript
const arr = [1, 2, 2, 3, 3, 4];
Arr.unique(arr); // Returns: [1, 2, 3, 4]
```

### shuffle
Randomly shuffles the elements of an array.

```javascript
const arr = [1, 2, 3, 4, 5];
Arr.shuffle(arr); // Returns: [3, 1, 5, 2, 4] (random order)
```

### first
Gets the first element of an array.

```javascript
const arr = [1, 2, 3];
Arr.first(arr); // Returns: 1
```

### last
Gets the last element of an array.

```javascript
const arr = [1, 2, 3];
Arr.last(arr); // Returns: 3
```

## License
StellifyJS is open-sourced software licensed under the MIT license.