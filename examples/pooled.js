const { runPooled } = require("..");

// Resolves the given input after a delay
let myFunction = async (input, ms) => {
  return await new Promise(resolve => setTimeout(() => {
    resolve(input);
  }, ms));
}

let noLimitExample = async () => {
  let output = [];
  await runPooled([
    async () => output.push(await myFunction("test1", 100)), 
    async () => output.push(await myFunction("test2", 50))
  ]);
  console.log(output); // ["test2", "test1"]
}

let limitExample = async () => {
  let output = [];
  await runPooled([
    async () => output.push(await myFunction("test1", 100)), 
    async () => output.push(await myFunction("test2", 50))
  ], 1);
  console.log(output); // ["test1", "test2"]
}

// Make three calls to the delayed function, in a pool of two chains
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

noLimitExample();

limitExample();

callbackExample();