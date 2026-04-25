const WebIFC = require('web-ifc');

async function test() {
  try {
    const ifcApi = new WebIFC.IfcAPI();
    await ifcApi.Init();
    console.log(Object.keys(ifcApi).join(', '));
    console.log(Object.getPrototypeOf(ifcApi));
    // Let's log prototype keys
    let keys = [];
    for(let k in ifcApi) { keys.push(k); }
    console.log("All keys:", keys.join(', '));
  } catch (err) {
    console.error('Error loading web-ifc:', err);
  }
}

test();
