// Function to run the risk model simulation
function riskModel(simulations, lower, upper, confidence_level, events, reserve) {
  // Calculate lognormal parameters
  let log_ratio = Math.log(upper / lower);
  let true_mean_log = (Math.log(lower) + Math.log(upper)) / 2;
  let true_sd_log = log_ratio / (2 * 1.2815515655446004); // Approximated norm.ppf(0.9)

  // Generate lognormal losses
  let loss = [];
  for (let i = 0; i < simulations; i++) {
    let u1 = Math.random();
    let u2 = Math.random();
    let standard_normal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    let lognormal_value = Math.exp(true_mean_log + true_sd_log * standard_normal);
    loss.push(lognormal_value);
  }

  // Generate Poisson probabilities
  let prob = [];
  for (let i = 0; i < simulations; i++) {
    let lambda = events;
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    prob.push(k - 1);
  }

  // Combine distributions
  let total_loss = [];
  for (let i = 0; i < simulations; i++) {
    total_loss.push(prob[i] * loss[i]);
  }

  // Sort total_loss for percentile calculations
  total_loss.sort((a, b) => a - b);

  // Calculate metrics
  let mean_loss = total_loss.reduce((a, b) => a + b, 0) / simulations;
  let median_loss = total_loss[Math.floor(simulations / 2)];
  let std_loss = Math.sqrt(total_loss.reduce((a, b) => a + Math.pow(b - mean_loss, 2), 0) / simulations);
  let varValue = total_loss[Math.floor(0.95 * simulations)];
  let cvar = total_loss.filter(x => x > varValue).reduce((a, b) => a + b, 0) / total_loss.filter(x => x > varValue).length;
  let loss_at_reserve = total_loss[Math.floor(reserve * simulations)];
  let percentiles = {};
  for (let p = 10; p <= 99; p += 10) {
    percentiles[p] = total_loss[Math.floor(p * simulations / 100)];
  }

  // Return the calculated results
  return {
    mean_loss: mean_loss.toFixed(2),
    median_loss: median_loss.toFixed(2),
    std_loss: std_loss.toFixed(2),
    var: varValue.toFixed(2),
    cvar: cvar.toFixed(2),
    loss_at_reserve: loss_at_reserve.toFixed(2),
    percentiles: percentiles
  };
}

// Handle form submission and display the results
document.getElementById('riskForm').addEventListener('submit', function (event) {
  event.preventDefault();  // Prevent the form from submitting normally (page reload)

  let simulations = parseInt(document.getElementById('simulations').value);
  let lower = parseFloat(document.getElementById('lower').value);
  let upper = parseFloat(document.getElementById('upper').value);
  let confidence_level = parseFloat(document.getElementById('confidence_level').value);
  let events = parseInt(document.getElementById('events').value);
  let reserve = parseFloat(document.getElementById('reserve').value);

  // Validate input
  if (
    isNaN(simulations) || simulations <= 0 ||
    isNaN(lower) || lower <= 0 ||
    isNaN(upper) || upper <= 0 ||
    isNaN(confidence_level) || confidence_level <= 0 || confidence_level > 1 ||
    isNaN(events) || events <= 0 ||
    isNaN(reserve) || reserve <= 0 || reserve > 1
  ) {
    document.getElementById('results').innerHTML = "<p>Invalid input. Please enter valid numbers.</p>";
    return;
  }

  // Run the risk model
  let result = riskModel(simulations, lower, upper, confidence_level, events, reserve);

  // Display the results
  const resultHtml = `
    <p><strong>Mean Loss:</strong> ${result.mean_loss}</p>
    <p><strong>Median Loss:</strong> ${result.median_loss}</p>
    <p><strong>Standard Deviation of Loss:</strong> ${result.std_loss}</p>
    <p><strong>Value at Risk (95%):</strong> ${result.var}</p>
    <p><strong>Conditional Value at Risk (95%):</strong> ${result.cvar}</p>
    <p><strong>${(reserve * 100).toFixed(2)}th Percentile Loss:</strong> ${result.loss_at_reserve}</p>
    <p><strong>Percentiles:</strong></p>
    ${Object.keys(result.percentiles).map(p => `<p>P(${p}%): ${result.percentiles[p]}</p>`).join('')}
  `;

  document.getElementById('results').innerHTML = resultHtml;
});
