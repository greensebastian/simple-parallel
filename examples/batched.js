const { runBatched } = require("..");

// Resolves the given input after a delay
let myFunction = async (input, ms) => {
  return await new Promise(resolve => setTimeout(() => {
    resolve(input);
  }, ms));
}

// Outputs in order of first completion, because the result is added to the output as soon as the timeout ends
let noLimitExample = async () => {
  let output = [];
  await runBatched([
    async () => output.push(await myFunction("test1", 100)), 
    async () => output.push(await myFunction("test2", 50))
  ]);
  console.log(output); // ["test2", "test1"]
}

// Outputs in order of entry, because the result is added to the output after all functions have completed
let limitExample = async () => {
  let output = [];
  await runBatched([
    async () => output.push(await myFunction("test1", 100)), 
    async () => output.push(await myFunction("test2", 50))
  ], 1);
  console.log(output); // ["test1", "test2"]
}

// Make three calls to the delayed function, in batches of two
let callbackExample = async () => {
  let output = [];
  await runBatched([
      () => myFunction("test1", 200), 
      () => myFunction("test2", 50),
      () => myFunction("test3", 75)
    ],
    2,
    (result) => output.push(result)
  );
  console.log(output); // ["test1", "test2", "test3"]
}

noLimitExample();

limitExample();

callbackExample();