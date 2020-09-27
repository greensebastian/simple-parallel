const assert = require("assert");
const { runBatched, runPooled } = require("../");

let sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

describe("Batch", async () => {
  it("should handle empty arrays", async () => {
    await runBatched([], 1, () => {
      assert.fail("Callback issued for empty list of functions");
    })
  });

  it("should handle one function", async () => {
    await runBatched([() => "test"], 1, (result) => {
      assert.equal(result, "test");
    })
  });

  it("should handle no callback", async () => {
    let ran = false;
    await runBatched([() => ran = true], 1)
    assert.equal(ran, true);
  });

  it("should handle no limit", async () => {
    let values = ["test1", "test2"];
    let seen = [];
    let result = await runBatched(values.map(value => () => value), 0, (result, index) => {
      assert.equal(result, values[index]);
      seen.push(result);
    });

    values.forEach(value => {
      assert.equal(seen.indexOf(value) >= 0, true, "Expected result " + result + " not found among returned values");
    });
  });

  it("should handle no callback no limit", async () => {
    let ran1 = false;
    let ran2 = false;
    await runBatched([() => ran1 = true, () => ran2 = true])
    assert.equal(ran1, true);
    assert.equal(ran2, true);
  });

  it("should handle two functions", async () => {
    let values = ["test1", "test2"];
    let seen = [];
    let result = await runBatched(values.map(value => () => value), 1, (result, index) => {
      assert.equal(result, values[index]);
      seen.push(result);
    });

    values.forEach(value => {
      assert.equal(seen.indexOf(value) >= 0, true, "Expected result " + result + " not found among returned values");
    });
  });

  it("should handle one slow function", async () => {
    let longRan = false;
    let shortRan = false;
    let shortTimer = setTimeout(() => shortRan = true, 30);
    let longTimer = setTimeout(() => longRan = true, 70);
    let func = async () => {
      await sleep(50);
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
      return "test";
    }
    await runBatched([func], 1, (result) => {
      assert.equal(result, "test");
    })

    assert.equal(shortRan, true, "The short timeout did not run");
    assert.equal(longRan, false, "The long timeout ran");
  });

  it("should handle two slow functions in sequence", async () => {
    let ms = 100;
    let results = ["ok1", "ok2"];

    let longRan = false;
    let shortRan = false;
    let shortTimer = setTimeout(() => shortRan = true, ms - 50);
    let longTimer = setTimeout(() => longRan = true, ms + 50);
    let func1 = async () => {
      await sleep(ms);
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
      return results[0];
    }

    let long2Ran = false;
    let short2Ran = false;
    let short2Timer = setTimeout(() => short2Ran = true, 2*ms - 50);
    let long2Timer = setTimeout(() => long2Ran = true, 2*ms + 50);
    let func2 = async () => {
      await sleep(ms);
      clearTimeout(short2Timer);
      clearTimeout(long2Timer);
      return results[1];
    }

    await runBatched([func1, func2], 1, (result, index) => {
      assert.equal(result, results[index]);
    })

    assert.equal(shortRan, true, "The short timeout did not run");
    assert.equal(longRan, false, "The long timeout ran");

    assert.equal(short2Ran, true, "The second short timeout did not run");
    assert.equal(long2Ran, false, "The second long timeout ran");
  });

  it("should handle two slow functions in parallel", async () => {
    let ms = 100;
    let offset = ms/2;
    let results = ["ok1", "ok2"];

    let longRan = false;
    let shortRan = false;
    let shortTimer = setTimeout(() => shortRan = true, ms - offset);
    let longTimer = setTimeout(() => longRan = true, ms + offset);
    let func1 = async () => {
      await sleep(ms);
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
      return results[0];
    }

    let long2Ran = false;
    let short2Ran = false;
    let short2Timer = setTimeout(() => short2Ran = true, ms - offset);
    let long2Timer = setTimeout(() => long2Ran = true, ms + offset);
    let func2 = async () => {
      await sleep(ms);
      clearTimeout(short2Timer);
      clearTimeout(long2Timer);
      return results[1];
    }

    await runBatched([func1, func2], 2, (result, index) => {
      assert.equal(result, results[index]);
    })

    assert.equal(shortRan, true, "The short timeout did not run");
    assert.equal(longRan, false, "The long timeout ran");

    assert.equal(short2Ran, true, "The second short timeout did not run");
    assert.equal(long2Ran, false, "The second long timeout ran");
  });

  it("should handle one slow one fast in parallel", async () => {
    let ms = 100;
    let offset = ms/2;
    let results = ["ok1", "ok2"];

    let longRan = false;
    let shortRan = false;
    let shortTimer = setTimeout(() => shortRan = true, ms - offset);
    let longTimer = setTimeout(() => longRan = true, ms + offset);
    let func1 = async () => {
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
      return results[0];
    }

    let long2Ran = false;
    let short2Ran = false;
    let short2Timer = setTimeout(() => short2Ran = true, ms - offset);
    let long2Timer = setTimeout(() => long2Ran = true, ms + offset);
    let func2 = async () => {
      await sleep(ms);
      clearTimeout(short2Timer);
      clearTimeout(long2Timer);
      return results[1];
    }

    await runBatched([func1, func2], 2, (result, index) => {
      assert.equal(result, results[index]);
    })

    assert.equal(shortRan, false, "The short timeout ran");
    assert.equal(longRan, false, "The long timeout ran");

    assert.equal(short2Ran, true, "The second short timeout did not run");
    assert.equal(long2Ran, false, "The second long timeout ran");
  });

  it("should handle three with two parallel", async () => {
    let ms = 100;
    let offset = ms/2;
    let results = ["ok1", "ok2", "ok3"];

    let longRan = false;
    let shortRan = false;
    let shortTimer = setTimeout(() => shortRan = true, ms - offset);
    let longTimer = setTimeout(() => longRan = true, ms + offset);
    let func1 = async () => {
      await sleep(ms);
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
      return results[0];
    }

    let long2Ran = false;
    let short2Ran = false;
    let short2Timer = setTimeout(() => short2Ran = true, ms - offset);
    let long2Timer = setTimeout(() => long2Ran = true, ms + offset);
    let func2 = async () => {
      await sleep(ms);
      clearTimeout(short2Timer);
      clearTimeout(long2Timer);
      return results[1];
    }

    let long3Ran = false;
    let short3Ran = false;
    let short3Timer = setTimeout(() => short3Ran = true, 2 * ms - offset);
    let long3Timer = setTimeout(() => long3Ran = true, 2 * ms + offset);
    let func3 = async () => {
      await sleep(ms);
      clearTimeout(short3Timer);
      clearTimeout(long3Timer);
      return results[2];
    }

    await runBatched([func1, func2, func3], 2, (result, index) => {
      assert.equal(result, results[index]);
    })

    assert.equal(shortRan, true, "The short timeout ran");
    assert.equal(longRan, false, "The long timeout ran");

    assert.equal(short2Ran, true, "The second short timeout did not run");
    assert.equal(long2Ran, false, "The second long timeout ran");

    assert.equal(short3Ran, true, "The third short timeout did not run");
    assert.equal(long3Ran, false, "The third long timeout ran");
  });

  it("should error one function", async () => {
    try{
      await runBatched([() => { throw "error" }], 1, () => {
      assert.fail("Should error out");
    })
    } catch {}
  });

  it("should error second function in sequence", async () => {
    let sawTest = false;
    let resultCount = 0;
    try{
      await runBatched([() => "test", () => { throw "error" }], 1, (result, index) => {
      sawTest = result === "test";
      resultCount++;
      if (index > 0){
        assert.fail("Should error out");
      }
    })
    } catch {}

    assert.equal(sawTest, true, "Expected to retrieve one result");
    assert.equal(resultCount, 1, "Expected one result in total");
  });

  it("should error one of two functions in batch", async () => {
    let resultCount = 0;
    let errorCount = 0;
    try{
      await runBatched([() => "test", () => { throw "error" }], 2, () => {
      assert.fail("Should error out");
    })
    } catch {
      errorCount++;
    }
    assert.equal(resultCount, 0, "Expected no results");
    assert.equal(errorCount, 1, "Expected compound error");
  });
});

describe("Parallel", async () => {
  it("should handle empty arrays", async () => {
    let result = await runPooled([], 1, () => {
      assert.fail("Callback issued for empty list of functions");
    })
  });

  it("should handle one function", async () => {
    let result = await runPooled([() => "test"], 1, (result) => {
      assert.equal(result, "test");
    })
  });

  it("should handle no callback", async () => {
    let ran = false;
    await runPooled([() => ran = true], 1)
    assert.equal(ran, true);
  });

  it("should handle no limit", async () => {
    let values = ["test1", "test2"];
    let seen = [];
    let result = await runPooled(values.map(value => () => value), 0, (result, index) => {
      assert.equal(result, values[index]);
      seen.push(result);
    });

    values.forEach(value => {
      assert.equal(seen.indexOf(value) >= 0, true, "Expected result " + result + " not found among returned values");
    });
  });

  it("should handle no callback no limit", async () => {
    let ran1 = false;
    let ran2 = false;
    await runPooled([() => ran1 = true, () => ran2 = true])
    assert.equal(ran1, true);
    assert.equal(ran2, true);
  });

  it("should handle one slow function", async () => {
    let longRan = false;
    let shortRan = false;
    let shortTimer = setTimeout(() => shortRan = true, 30);
    let longTimer = setTimeout(() => longRan = true, 70);
    let func = async () => {
      await sleep(50);
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
      return "test";
    }
    await runPooled([func], 1, (result) => {
      assert.equal(result, "test");
    })

    assert.equal(shortRan, true, "The short timeout did not run");
    assert.equal(longRan, false, "The long timeout ran");
  });

  it("should handle two slow functions in sequence", async () => {
    let ms = 100;
    let results = ["ok1", "ok2"];

    let longRan = false;
    let shortRan = false;
    let shortTimer = setTimeout(() => shortRan = true, ms - 50);
    let longTimer = setTimeout(() => longRan = true, ms + 50);
    let func1 = async () => {
      await sleep(ms);
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
      return results[0];
    }

    let long2Ran = false;
    let short2Ran = false;
    let short2Timer = setTimeout(() => short2Ran = true, 2*ms - 50);
    let long2Timer = setTimeout(() => long2Ran = true, 2*ms + 50);
    let func2 = async () => {
      await sleep(ms);
      clearTimeout(short2Timer);
      clearTimeout(long2Timer);
      return results[1];
    }

    await runPooled([func1, func2], 1, (result, index) => {
      assert.equal(result, results[index]);
    })

    assert.equal(shortRan, true, "The short timeout did not run");
    assert.equal(longRan, false, "The long timeout ran");

    assert.equal(short2Ran, true, "The second short timeout did not run");
    assert.equal(long2Ran, false, "The second long timeout ran");
  });

  it("should handle two slow functions in parallel", async () => {
    let ms = 100;
    let offset = ms/2;
    let results = ["ok1", "ok2"];

    let longRan = false;
    let shortRan = false;
    let shortTimer = setTimeout(() => shortRan = true, ms - offset);
    let longTimer = setTimeout(() => longRan = true, ms + offset);
    let func1 = async () => {
      await sleep(ms);
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
      return results[0];
    }

    let long2Ran = false;
    let short2Ran = false;
    let short2Timer = setTimeout(() => short2Ran = true, ms - offset);
    let long2Timer = setTimeout(() => long2Ran = true, ms + offset);
    let func2 = async () => {
      await sleep(ms);
      clearTimeout(short2Timer);
      clearTimeout(long2Timer);
      return results[1];
    }

    await runPooled([func1, func2], 2, (result, index) => {
      assert.equal(result, results[index]);
    })

    assert.equal(shortRan, true, "The short timeout did not run");
    assert.equal(longRan, false, "The long timeout ran");

    assert.equal(short2Ran, true, "The second short timeout did not run");
    assert.equal(long2Ran, false, "The second long timeout ran");
  });

  it("should handle one slow one fast in parallel", async () => {
    let ms = 100;
    let offset = ms/2;
    let results = ["ok1", "ok2"];

    let longRan = false;
    let shortRan = false;
    let shortTimer = setTimeout(() => shortRan = true, ms - offset);
    let longTimer = setTimeout(() => longRan = true, ms + offset);
    let func1 = async () => {
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
      return results[0];
    }

    let long2Ran = false;
    let short2Ran = false;
    let short2Timer = setTimeout(() => short2Ran = true, ms - offset);
    let long2Timer = setTimeout(() => long2Ran = true, ms + offset);
    let func2 = async () => {
      await sleep(ms);
      clearTimeout(short2Timer);
      clearTimeout(long2Timer);
      return results[1];
    }

    await runPooled([func1, func2], 2, (result, index) => {
      assert.equal(result, results[index]);
    })

    assert.equal(shortRan, false, "The short timeout ran");
    assert.equal(longRan, false, "The long timeout ran");

    assert.equal(short2Ran, true, "The second short timeout did not run");
    assert.equal(long2Ran, false, "The second long timeout ran");
  });

  it("should handle three with two parallel", async () => {
    let ms = 100;
    let offset = ms/2;
    let results = ["ok1", "ok2", "ok3"];

    let longRan = false;
    let shortRan = false;
    let shortTimer = setTimeout(() => shortRan = true, ms - offset);
    let longTimer = setTimeout(() => longRan = true, ms + offset);
    let func1 = async () => {
      await sleep(ms);
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
      return results[0];
    }

    let long2Ran = false;
    let short2Ran = false;
    let short2Timer = setTimeout(() => short2Ran = true, ms - offset);
    let long2Timer = setTimeout(() => long2Ran = true, ms + offset);
    let func2 = async () => {
      await sleep(ms);
      clearTimeout(short2Timer);
      clearTimeout(long2Timer);
      return results[1];
    }

    let long3Ran = false;
    let short3Ran = false;
    let short3Timer = setTimeout(() => short3Ran = true, 2 * ms - offset);
    let long3Timer = setTimeout(() => long3Ran = true, 2 * ms + offset);
    let func3 = async () => {
      await sleep(ms);
      clearTimeout(short3Timer);
      clearTimeout(long3Timer);
      return results[2];
    }

    await runPooled([func1, func2, func3], 2, (result, index) => {
      assert.equal(result, results[index]);
    })

    assert.equal(shortRan, true, "The short timeout ran");
    assert.equal(longRan, false, "The long timeout ran");

    assert.equal(short2Ran, true, "The second short timeout did not run");
    assert.equal(long2Ran, false, "The second long timeout ran");

    assert.equal(short3Ran, true, "The third short timeout did not run");
    assert.equal(long3Ran, false, "The third long timeout ran");
  });

  it("should handle two fast one slow with two parallel", async () => {
    let ms = 100;
    let offset = ms/2;
    let results = ["ok1", "ok2", "ok3"];

    let longRan = false;
    let shortRan = false;
    let shortTimer = setTimeout(() => shortRan = true, 2 * ms - offset);
    let longTimer = setTimeout(() => longRan = true, 2 * ms + offset);
    let func1 = async () => {
      await sleep(2 * ms);
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
      return results[0];
    }

    let long2Ran = false;
    let short2Ran = false;
    let short2Timer = setTimeout(() => short2Ran = true, ms - offset);
    let long2Timer = setTimeout(() => long2Ran = true, ms + offset);
    let func2 = async () => {
      await sleep(ms);
      clearTimeout(short2Timer);
      clearTimeout(long2Timer);
      return results[1];
    }

    let long3Ran = false;
    let short3Ran = false;
    let short3Timer = setTimeout(() => short3Ran = true, 2 * ms - offset);
    let long3Timer = setTimeout(() => long3Ran = true, 2 * ms + offset);
    let func3 = async () => {
      await sleep(ms);
      clearTimeout(short3Timer);
      clearTimeout(long3Timer);
      return results[2];
    }

    let totalLongRan = false;
    let totalLongTimer = setTimeout(() => totalLongRan = true, 2 * ms + offset);
    let totalShortRan = false;
    let totalShortTimer = setTimeout(() => totalShortRan = true, 2 * ms - offset);

    await runPooled([func1, func2, func3], 2, (result, index) => {
      assert.equal(result, results[index]);
    }).then(() => {
      clearTimeout(totalShortTimer);
      clearTimeout(totalLongTimer);
    });

    assert.equal(shortRan, true, "The short timeout ran");
    assert.equal(longRan, false, "The long timeout ran");

    assert.equal(short2Ran, true, "The second short timeout did not run");
    assert.equal(long2Ran, false, "The second long timeout ran");

    assert.equal(short3Ran, true, "The third short timeout did not run");
    assert.equal(long3Ran, false, "The third long timeout ran");

    assert.equal(totalShortRan, true, "The total short timeout did not run");
    assert.equal(totalLongRan, false, "The total long timeout ran");
  });

  it("should error one function", async () => {
    try{
      await runPooled([() => { throw "error" }], 1, () => {
      assert.fail("Should error out");
    })
    } catch {}
  });

  it("should error second function in sequence", async () => {
    let sawTest = false;
    let resultCount = 0;
    try{
      await runPooled([() => "test", () => { throw "error" }], 1, (result, index) => {
      sawTest = result === "test";
      resultCount++;
      if (index > 0){
        assert.fail("Should error out");
      }
    })
    } catch {}

    assert.equal(sawTest, true, "Expected to retrieve one result");
    assert.equal(resultCount, 1, "Expected one result in total");
  });

  it("should error slow one of two functions in batch", async () => {
    let sawTest = false;
    let resultCount = 0;
    let errorCount = 0;
    try{
      await runPooled([() => "test", async () => { 
        await sleep(50);
        throw "error"; 
      }], 2, (result, index) => {
        sawTest = result === "test";
        resultCount++;
        if (index > 0){
          assert.fail("Should error out");
        }
      });
    } catch {
      errorCount++;
    }

    assert.equal(sawTest, true, "Expected to retrieve one result");
    assert.equal(resultCount, 1, "Expected first result results");
    assert.equal(errorCount, 1, "Expected compound error");
  });
});