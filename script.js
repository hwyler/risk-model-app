function riskModel(simulations, lower, upper, confidence_level, events, reserve) {
  // Calculate parameters
  let log_ratio = Math.log(upper / lower);
  let true_mean_log = (Math.log(lower) + Math.log(upper)) / 2;
  let true_sd_log = log_ratio / (2 * 1.2815515655446004); // Approximated norm.ppf(0.9)

  // Generate lognormal distribution for losses
  let loss = [];
  for (let i = 0; i < simulations; i++) {
    loss.push(Math.exp(true_mean_log + true_sd_log * Math.randomNormal()));
  }

  // Generate Poisson-like distribution for probabilities/events
  let prob = [];
  for (let i = 0; i < simulations; i++) {
    prob.push(Math.floor(Math.randomPoisson(events)));
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
  let var95 = total_loss.sort((a, b) => a - b)[Math.floor(0.95 * simulations)];
  let cvar95 = total_loss.filter(x => x > var95).reduce((a, b) => a + b, 0) / total_loss.filter(x => x > var95).length;
  let loss_at_reserve = total_loss.sort((a, b) => a - b)[Math.floor(reserve * 100 * simulations / 100)];
  let percentiles = {};
  for (let p = 10; p <= 90; p += 10) {
    percentiles[p] = total_loss.sort((a, b) => a - b)[Math.floor(p * simulations / 100)];
  }

  // Return the calculated metrics
  return {
    mean_loss: mean_loss.toFixed(2),
    median_loss: median_loss.toFixed(2),
    std_loss: std_loss.toFixed(2),
    var95: var95.toFixed(2),
    cvar95: cvar95.toFixed(2),
    loss_at_reserve: loss_at_reserve.toFixed(2),
    percentiles: percentiles
  };
}

// Helper function for normally distributed random numbers
Math.randomNormal = function() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v); // Box-Muller transform
};

// Helper function for Poisson-like distribution
Math.randomPoisson = function(lambda) {
  let L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// Get the form data
document.getElementById('riskForm').addEventListener('submit', function(event) {
  event.preventDefault();

  let simulations = parseInt(document.getElementById('simulations').value);
  let lower = parseFloat(document.getElementById('lower').value);
  let upper = parseFloat(document.getElementById('upper').value);
  let confidence_level = parseFloat(document.getElementById('confidence_level').value);
  let events = parseFloat(document.getElementById('events').value);
  let reserve = parseFloat(document.getElementById('reserve').value);

  // Validate input
  if (isNaN(simulations) || simulations <= 0 || isNaN(lower) || lower <= 0 || isNaN(upper) || upper <= 0 || isNaN(confidence_level) || confidence_level <= 0 || confidence_level > 1 || isNaN(events) || events <= 0 || isNaN(reserve) || reserve <= 0 || reserve > 1) {
    document.getElementById('results').innerHTML = "<p>Invalid input. Please enter valid numbers.</p>";
    return;
  }

  // Run the risk model
  let result = riskModel(simulations, lower, upper, confidence_level, events, reserve);

  // Display the results
  document.getElementById('results').innerHTML = `
    <p>Mean Loss: ${result.mean_loss}</p>
    <p>Median Loss: ${result.median_loss}</p>
    <p>Standard Deviation of Loss: ${result.std_loss}</p>
    <p>Value at Risk (95%): ${result.var95}</p>
    <p>Conditional Value at Risk (95%): ${result.cvar95}</p>
    <p>${reserve * 100}th Percentile Loss: ${result.loss_at_reserve}</p>
    <p>Percentiles:</p>
    ${Object.keys(result.percentiles).map(p => `<p>P(${p}): ${result.percentiles[p]}</p>`).join('')}
  `;
});
