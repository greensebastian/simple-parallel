# simple-parallel
This is a very basic parallelization helper for running async functions in parallel or concurrently based on a maximum number of concurrent functions.

## Usage
The batch function runs the provided functions in order in batches of the provided size. After each batch is completed, the callbacks are called in order for the completed functions, before the next batch is called.

The pool function starts calls the first x provided functions, where x is the parallelization limit. After any function completes, the callback is called with the resulting value, and that thread calls the next uncalled function.

The first argument is a list of functions to process.
The second argument is a number representing the size of the batches/number of functions to run in parallel.
The third argument is a callback function which is called with the result and index from the initial function array after each function is completed.

## Examples
Basic examples of runBatched and runPooled, for more look at examples folder or tests

```javascript
const { runPooled, runBatched } = require("simple-parallel");

// Resolves the given input after a delay
let myFunction = async (input, ms) => {
  return await new Promise(resolve => setTimeout(() => {
    resolve(input);
  }, ms));
}

// Make two calls, in a single batch of unlimited size
// Outputs in order of first completion, because the result is added to the output as soon as the timeout ends
let batchExample = async () => {
  let output = [];
  await runBatched([
    async () => output.push(await myFunction("test1", 100)), 
    async () => output.push(await myFunction("test2", 50))
  ]);
  console.log(output); // ["test2", "test1"]
}

// Make three calls to the delayed function, in a pool of two chains, and push output to an array
let callbackExample = async () => {
  let output = [];
  await runPooled([
      () => myFunction("test1", 200), 
      () => myFunction("test2", 50),
      () => myFunction("test3", 75)
    ],
    2,
    (result) => output.push(result)
  );
  console.log(output); // ["test2", "test3", "test1"]
}
```