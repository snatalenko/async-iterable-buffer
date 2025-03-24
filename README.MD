Async Iterable Buffer
=====================

[![NPM Version](https://img.shields.io/npm/v/async-iterable-buffer.svg)](https://www.npmjs.com/package/async-iterable-buffer)
[![Audit](https://github.com/snatalenko/async-iterable-buffer/actions/workflows/audit.yml/badge.svg)](https://github.com/snatalenko/async-iterable-buffer/actions/workflows/audit.yml)
[![Tests](https://github.com/snatalenko/async-iterable-buffer/actions/workflows/tests.yml/badge.svg)](https://github.com/snatalenko/async-iterable-buffer/actions/workflows/tests.yml)
[![Coverage Status](https://coveralls.io/repos/github/snatalenko/async-iterable-buffer/badge.svg?branch=main)](https://coveralls.io/github/snatalenko/async-iterable-buffer?branch=main)
[![NPM Downloads](https://img.shields.io/npm/dm/async-iterable-buffer.svg)](https://www.npmjs.com/package/async-iterable-buffer)


AsyncIterableBuffer is a lightweight, stateful asynchronous buffer that allows you to push values and consume them using async iteration (e.g. `for await...of`). It’s ideal for bridging event-driven or callback-based code with modern async/await patterns.

## Features

- **Asynchronous Iteration:** Implements the `AsyncIterableIterator` interface.
- **Push and Consume:** Dynamically push values into the buffer and consume them asynchronously.
- **Graceful Termination:** Signal completion with an `end()` method and handle early termination via `return()`.
- **TypeScript Support:** Fully typed for TypeScript projects.
- **Lightweight:** No dependencies.

## Installation

```bash
npm install async-iterable-buffer
```

## Usage

### Basic Example

```ts
import { AsyncIterableBuffer } from 'async-iterable-buffer';

const buffer = new AsyncIterableBuffer<number>();

// Push some values into the buffer.
buffer.push(1);
buffer.push(2);
buffer.push(3);

// Signal that no more values will be pushed.
buffer.end();

// Consume the buffer with async iteration.
(async () => {
  for await (const num of buffer) {
    console.log(num); // Outputs: 1, 2, 3
  }
})();
```


### Advanced Usage with Early Termination

```ts
import { AsyncIterableBuffer } from 'async-iterable-buffer';

const buffer = new AsyncIterableBuffer<string>();

// Start an async iterator.
(async () => {
  for await (const value of buffer) {
    console.log(value);
    if (value === 'stop') {
      // Terminate iteration early.
      await buffer.return();
    }
  }
})();

// Push values asynchronously.
buffer.push('first');
buffer.push('stop');
buffer.push('ignored'); // This value won't be processed since the buffer is closed after "stop".
```
