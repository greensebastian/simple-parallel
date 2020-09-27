let runBatched = async (functions, limit = 0, callback) => {
  if (!limit || limit < 1) limit = functions.length;
  for (let i = 0; i < functions.length; i += limit){
    let currentBase = i;
    let currentFunctions = functions.slice(currentBase, currentBase + limit).map(async (func) => await func());
    let responses = await Promise.all(currentFunctions);
    if (callback){
      responses.forEach((response, index) => callback(response, currentBase + index));
    }
  }
  return Promise.resolve();
}

let runPooled = async (functions, limit = 0, callback) => {
  if (!limit || limit < 1) limit = functions.length;
  let called = 0;
  let call = async () => {
    let current = called++;
    let response = await functions[current]();
    if (callback){
      callback(response, current);
    }
    if (called < functions.length){
      await call();
    }
    return Promise.resolve();
  }

  let initialCalls = [];
  for (let i = 0; i < limit && i < functions.length; i++){
    initialCalls.push(call());
  }
  return Promise.all(initialCalls);
}

module.exports = {runBatched, runPooled};