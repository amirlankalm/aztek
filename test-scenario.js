const fs = require('fs');

async function run() {
  console.log('1. INIT...');
  const res1 = await fetch('http://localhost:3000/api/simulate/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: "Global population unaware of Ukraine/Russian war. Suddenly war breaks out today.", language: "en" })
  });
  const data1 = await res1.json();
  const simId = data1.simulationId;
  console.log('SimID:', simId);

  console.log('2. SPAWN...');
  await fetch('http://localhost:3000/api/simulate/spawn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simulationId: simId })
  });

  console.log('3. CYCLES...');
  for(let i=1; i<=3; i++) {
     console.log('Cycle', i);
     await fetch('http://localhost:3000/api/simulate/run-cycle', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ simulationId: simId, roundNumber: i })
     });
  }

  console.log('4. REPORT...');
  const repReq = await fetch('http://localhost:3000/api/simulate/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simulationId: simId })
  });
  const repData = await repReq.json();
  
  const stateReq = await fetch(`http://localhost:3000/api/state?simId=${simId}`);
  const stateData = await stateReq.json();
  
  console.log('\n--- SIMULATION RESULTS ---');
  console.log('Stock Market History:', stateData.simulation.stock_market.history);
  console.log('Interactions Logged:', stateData.interactions.length);
  console.log('Synthesized Report:', repData.report);
}

run().catch(console.error);
