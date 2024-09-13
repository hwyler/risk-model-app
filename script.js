// Simple random number generator with seed
(function() {
  var m_w = 123;
  var m_z = 987654321;
  var mask = 0xffffffff;

  // Takes any integer
  Math.seedrandom = function(i) {
    m_w = (123456789 + i) & mask;
    m_z = (987654321 - i) & mask;
  }

  // Returns number between 0 (inclusive) and 1.0 (exclusive),
  // just like Math.random().
  Math.random = function() {
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    var result = ((m_z << 16) + (m_w & 65535)) >>> 0;
    result /= 4294967296;
    return result;
  }
})();

// Set the seed
Math.seedrandom(123);

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
  let valueAtRisk = total_loss.sort((a, b) => a - b)[Math.floor(0.95 * simulations)];
  let loss_at_reserve = total_loss.sort((a, b) => a - b)[Math.floor(reserve * simulations)];
  let percentiles = {};
  for (let p of [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99]) {
    percentiles[p] = parseFloat(total_loss.sort((a, b) => a - b)[Math.floor(p * simulations / 100)].toFixed(2));
  }

  // Return the calculated metrics
  return {
    mean_loss: mean_loss.toFixed(2),
    median_loss: median_loss.toFixed(2),
    std_loss: std_loss.toFixed(2),
    valueAtRisk: valueAtRisk.toFixed(2),
    loss_at_reserve: loss_at_reserve.toFixed(2),
    percentiles: percentiles
  };
}

function runModel() {
  let simulations = parseInt(document.getElementById('simulations').value);
  let lower = parseFloat(document.getElementById('lower').value);
  let upper = parseFloat(document.getElementById('upper').value);
  let confidence_level = parseFloat(document.getElementById('confidence_level').value);
  let events = parseInt(document.getElementById('events').value

function runModel() {
  let simulations = parseInt(document.getElementById('simulations').value);
  let lower = parseFloat(document.getElementById('lower').value);
  let upper = parseFloat(document.getElementById('upper').value);
  let confidence_level = parseFloat(document.getElementById('confidence_level').value);
  let events = parseInt(document.getElementById('events').value);
  let reserve = parseFloat(document.getElementById('reserve').value);

  // Validate input
  if (isNaN(simulations) || simulations <= 0 || isNaN(lower) || lower <= 0 || isNaN(upper) || upper <= 0 || isNaN(confidence_level) || confidence_level <= 0 || confidence_level > 1 || isNaN(events) || events <= 0 || isNaN(reserve) || reserve <= 0 || reserve > 1) {
    document.getElementById('results').innerHTML = "<p>Invalid input. Please enter valid numbers.</p>";
    return;
  }

  // Run the risk model
  let result = riskModel(simulations, lower, upper, confidence_level, events, reserve);

  // Display the results
  let resultsHTML = `
    <p>Mean Loss: ${parseFloat(result.mean_loss).toFixed(2)}</p>
    <p>Median Loss: ${parseFloat(result.median_loss).toFixed(2)}</p>
    <p>Standard Deviation of Loss: ${parseFloat(result.std_loss).toFixed(2)}</p>
    <p>Value at Risk (95%): ${parseFloat(result.valueAtRisk).toFixed(2)}</p>
    <p>${(reserve * 100).toFixed(0)}th Percentile Loss: ${parseFloat(result.loss_at_reserve).toFixed(2)}</p>
    <p>Percentiles:</p>
  `;

  for (let p in result.percentiles) {
    resultsHTML += `${p}%: ${result.percentiles[p]}\n`;
  }

  document.getElementById('results').innerHTML = resultsHTML;
}





