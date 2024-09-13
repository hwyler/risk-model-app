function riskModel(simulations, lower, upper, confidence_level, events, reserve) {
  console.log("Running risk model..."); // Debugging step

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
  let loss_at_reserve = total_loss.sort((a, b) => a - b)[Math.floor(reserve * simulations)];
  let percentiles = {};
  for (let p = 10; p <= 99; p += 10) {
    percentiles[p] = total_loss.sort((a, b) => a - b)[Math.floor(p * simulations / 100)];
  }

  console.log("Risk model completed."); // Debugging step

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

// Handle form submission and display the results
document.getElementById('riskForm').addEventListener('submit', function(event) {
  event.preventDefault();  // Prevent the default form submission behavior (page reload)

  console.log("Form submitted."); // Debugging step

  let simulations = parseInt(document.getElementById('simulations').value);
  let lower = parseFloat(document.getElementById('lower').value);
  let upper = parseFloat(document.getElementById('upper').value);
  let confidence_level = parseFloat(document.getElementById('confidence_level').value);
  let events = parseInt(document.getElementById('events').value);
  let reserve = parseFloat(document.getElementById('reserve').value);document.getElementById("riskForm").addEventListener("submit", function (event) {
    event.preventDefault();

    // Get form values
    const simulations = parseInt(document.getElementById("simulations").value);
    const lower = parseFloat(document.getElementById("lower").value);
    const upper = parseFloat(document.getElementById("upper").value);
    const confidence_level = parseFloat(document.getElementById("confidence_level").value);
    const events = parseInt(document.getElementById("events").value);
    const reserve = parseFloat(document.getElementById("reserve").value);

    // Run the risk model
    const results = riskModel(simulations, lower, upper, confidence_level, events, reserve);

    // Display results
    document.getElementById("results").innerHTML = `
        <p>Mean Loss: ${results.mean_loss}</p>
        <p>Median Loss: ${results.median_loss}</p>
        <p>Standard Deviation of Loss: ${results.std_loss}</p>
        <p>Value at Risk (VaR): ${results.var}</p>
        <p>Conditional Value at Risk (CVaR): ${results.cvar}</p>
        <p>Loss at Reserve: ${results.loss_at_reserve}</p>
        <p>Percentiles: ${JSON.stringify(results.percentiles)}</p>
    `;

    // Plot distribution
    plotDistribution(results.total_loss);
});

function riskModel(simulations, lower, upper, confidence_level, events, reserve) {
    // Calculate parameters
    const log_ratio = Math.log(upper / lower);
    const true_mean_log = (Math.log(lower) + Math.log(upper)) / 2;
    const true_sd_log = log_ratio / (2 * 1.2815515655446004); // Approximated norm.ppf(0.9)

    // Generate distributions
    const loss = [];
    for (let i = 0; i < simulations; i++) {
        loss.push(Math.exp(Math.random() * true_sd_log + true_mean_log));
    }

    const prob = [];
    for (let i = 0; i < simulations; i++) {
        prob.push(Math.floor(Math.random() * events + 1));
    }

    // Combine distributions
    const total_loss = [];
    for (let i = 0; i < simulations; i++) {
        total_loss.push(prob[i] * loss[i]);
    }

    // Calculate metrics
    const mean_loss = total_loss.reduce((a, b) => a + b, 0) / simulations;
    const sorted_loss = total_loss.slice().sort((a, b) => a - b);
    const median_loss = sorted_loss[Math.floor(simulations / 2)];
    const std_loss = Math.sqrt(total_loss.reduce((a, b) => a + Math.pow(b - mean_loss, 2), 0) / simulations);
    const var = sorted_loss[Math.floor((1 - confidence_level) * simulations)];
    const cvar = sorted_loss.filter(x => x > var).reduce((a, b) => a + b, 0) / sorted_loss.filter(x => x > var).length;
    const loss_at_reserve = sorted_loss[Math.floor(reserve * simulations)];

    const percentiles = {};
    for (let p = 10; p <= 99; p += 10) {
        percentiles[p] = sorted_loss[Math.floor(p * simulations / 100)];
    }

    // Return the calculated metrics
    return {
        mean_loss: mean_loss.toFixed(2),
        median_loss: median_loss.toFixed(2),
        std_loss: std_loss.toFixed(2),
        var: var.toFixed(2),
        cvar: cvar.toFixed(2),
        loss_at_reserve: loss_at_reserve.toFixed(2),
        percentiles: percentiles,
        total_loss: total_loss
    };
}

function plotDistribution(data) {
    const trace = {
        x: data,
        type: 'histogram',
    };

    const layout = {
        title: 'Loss Distribution',
        xaxis: { title: 'Loss' },
        yaxis: { title: 'Frequency' },
    };

    Plotly.newPlot('plots', [trace], layout);
}
