function riskModel(simulations, lower, upper, confidence_level, events, reserve) {
  // Calculate parameters
  let log_ratio = Math.log(upper / lower);
  let true_mean_log = (Math.log(lower) + Math.log(upper)) / 2;
  let true_sd_log = log_ratio / (2 * 1.2815515655446004); // Approximated norm.ppf(0.9)

  // Set the seed
  Math.seedrandom(123);

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


  let percentiles = {};
  for (let p of [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99]) {
    percentiles[p] = parseFloat(total_loss.sort((a, b) => a - b)[Math.floor(p * simulations / 100)].toFixed(2));
  }

  // Return the calculated metrics
  return {
    mean_loss: parseFloat(mean_loss.toFixed(2)),
    median_loss: parseFloat(median_loss.toFixed(2)),
    std_loss: parseFloat(std_loss.toFixed(2)),
    valueAtRisk: parseFloat(valueAtRisk.toFixed(2)),
    loss_at_reserve: parseFloat(loss_at_reserve.toFixed(2)),
    percentiles: percentiles
  };
}

function runModel() {
  // ... (keep the existing input validation code)

  // Run the risk model
  let result = riskModel(simulations, lower, upper, confidence_level, events, reserve);

  // Display the results
  let resultsHTML = `
    <p>Mean Loss: ${result.mean_loss.toFixed(2)}</p>
    <p>Median Loss: ${result.median_loss.toFixed(2)}</p>
    <p>Standard Deviation of Loss: ${result.std_loss.toFixed(2)}</p>
    <p>Value at Risk (95%): ${result.valueAtRisk.toFixed(2)}</p>
    <p>${(reserve * 100).toFixed(0)}th Percentile Loss: ${result.loss_at_reserve.toFixed(2)}</p>
    <p>Percentiles:</p>
  `;

  for (let p in result.percentiles) {
    resultsHTML += `${p}%: ${result.percentiles[p].toFixed(2)}\n`;
  }

  document.getElementById('results').innerHTML = resultsHTML;
}
