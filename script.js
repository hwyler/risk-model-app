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
    prob.pushfunction riskModel(simulations, lower, upper, confidence_level, events, reserve) {
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
  let var = total_loss.sort((a, b) => a - b)[Math.floor(0.95 * simulations)];
  let cvar = total_loss.filter(x => x > var).reduce((a, b) => a + b, 0) / total_loss.filter(x => x > var).length;
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
    var: var.toFixed(2),
    cvar: cvar.toFixed(2),
    loss_at_reserve: loss_at_reserve.toFixed(2),
    percentiles: percentiles
  };
}

// Get the form data
document.getElementById('riskForm').addEventListener('submit', function(event) {
  event.preventDefault();

  let simulations = document.getElementById('simulations').value;
  let lower = document.getElementById('lower').value;
  let upper = document.getElementById('upper').value;
  let confidence_level = document.getElementById('confidence_level').value;
  let events = document.getElementById('events').value;
  let reserve = document.getElementById('reserve').value;

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
    <p>Value at Risk (95%): ${result.var}</p>
    <p>Conditional Value at Risk (95%): ${result.cvar}</p>
    <p>${reserve * 100}th Percentile Loss: ${result.loss_at_reserve}</p>
    <p>Percentiles:</p>
    ${Object.keys(result.percentiles).map(p => `<p>P(${p}): ${result.percentiles[p]}</p>`).join('')}
  `;
});
