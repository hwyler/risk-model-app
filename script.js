function riskModel(simulations, lower, upper, confidence_level, events, reserve) {
  // Calculate parameters
 let log_ratio = Math.log(upper / lower);
 let true_mean_log = (Math.log(lower) + Math.log(upper)) / 2;
 let true_sd_log = log_ratio / (2 * 1.2815515655446004); // Approximated norm.ppf(0.9)

  // Generate distributions
 let loss = [];
 for (let i = 0; i < simulations; i++) {
    loss.push(Math.exp(Math.random() * true_sd_log + true_mean_log));
  }
 let prob = [];
 for (let i = 0; i < simulations; i++) {
    prob.push(Math.floor(Math.random() * events + 1));
  }

  // Combine distributions
 let total_loss = [];
 for (let i = 0; i < simulations; i++) {
    total_loss.push(prob[i] * loss[i]);
  }

  // Calculate metrics
 let mean_loss = total_loss.reduce((a, b) => a + b, 0) / simulations;
 let median_loss = total_loss.sort((a, b) => a - b)[Math.floor(simulations / 2)];
 let std_loss = Math.sqrt(total_loss.reduce((a, b) => a + Math.pow(b - mean_loss, 2), 0) / simulations);

  // Rename 'var' to 'valueAtRisk'
 let sorted_loss = total_loss.sort((a, b) => a - b);
 let valueAtRisk = sorted_loss[Math.floor((1 - confidence_level) * simulations)];

 let cvar = total_loss.filter(x => x > valueAtRisk).reduce((a, b) => a + b, 0) / total_loss.filter(x => x > valueAtRisk).length;
 let loss_at_reserve = total_loss.sort((a, b) => a - b)[Math.floor(reserve * 100 * simulations / 100)];
 let percentiles = {};
 for (let p = 10; p <= 99; p += 10) {
    percentiles[p] = total_loss.sort((a, b) => a - b)[Math.floor(p * simulations / 100)];
  }

  // Return the calculated metrics
  return {
    mean_loss: mean_loss.toFixed(2),
    median_loss: median_loss.toFixed(2),
    std_loss: std_loss.toFixed(2),
    valueAtRisk: valueAtRisk.toFixed(2),
    cvar: cvar.toFixed(2),
    loss_at_reserve: loss_at_reserve.toFixed(2),
    percentiles: percentiles
  };
}

// Input the data as an object
const modelInput = {
 simulations: 100000,
 lower: 1000,
  upper: 2000,
 confidence_level: 0.8,
  events: 4,
  reserve: 0.75
};

// Call the riskModel function with the input data
const modelResults = riskModel(
 modelInput.simulations,
 modelInput.lower,
 modelInput.upper,
 modelInput.confidence_level,
 modelInput.events,
 modelInput.reserve
);

// Print the results
console.log('Risk Model Results:');
console.log(`Mean Loss: ${modelResults.mean_loss}`);
console.log(`Median Loss: ${modelResults.median_loss}`);
console.log(`Standard Deviation: ${modelResults.std_loss}`);
console.log(`Value at Risk: ${modelResults.valueAtRisk}`);
console.log(`Conditional Value at Risk: ${modelResults.cvar}`);
console.log(`Loss at Reserve: ${modelResults.loss_at_reserve}`);
console.log('Percentiles:');
for (const [percentile, value] of Object.entries(modelResults.percentiles)) {
 console.log(`  ${percentile}: ${value}`);
}
