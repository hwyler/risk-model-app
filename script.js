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
    let loss_at_reserve = sorted_loss[Math.floor(reserve * simulations / 100)];
    let percentiles = {};
    for (let p = 10; p <= 99; p += 10) {
        percentiles[p] = sorted_loss[Math.floor(p * simulations / 100)];
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

// Function to run the risk model and display results
function runModel() {
    let simulations = parseInt(document.getElementById('simulations').value);
    let lower = parseFloat(document.getElementById('lower').value);
    let upper = parseFloat(document.getElementById('upper').value);
    let confidence_level = parseFloat(document.getElementById('confidence_level').value);
    let events = parseInt(document.getElementById('events').value);
    let reserve = parseFloat(document.getElementById('reserve').value);

    let results = riskModel(simulations, lower, upper, confidence_level, events, reserve);

    // Display the results
    document.getElementById('results').innerHTML = `
        <p><strong>Mean Loss:</strong> ${results.mean_loss}</p>
        <p><strong>Median Loss:</strong> ${results.median_loss}</p>
        <p><strong>Standard Deviation:</strong> ${results.std_loss}</p>
        <p><strong>Value at Risk (VaR):</strong> ${results.valueAtRisk}</p>
        <p><strong>Conditional VaR (CVaR):</strong> ${results.cvar}</p>
        <p><strong>Loss at Reserve:</strong> ${results.loss_at_reserve}</p>
        <p><strong>Percentiles:</strong> ${JSON.stringify(results.percentiles)}</p>
    `;
}
