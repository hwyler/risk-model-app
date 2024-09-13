document.getElementById('riskForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const simulations = parseInt(document.getElementById('simulations').value);
    const lower = parseInt(document.getElementById('lower').value);
    const upper = parseInt(document.getElementById('upper').value);
    const confidence_level = parseFloat(document.getElementById('confidence_level').value);
    const events = parseInt(document.getElementById('events').value);
    const reserve = parseFloat(document.getElementById('reserve').value);

    // Simulate losses
    const losses = [];
    for (let i = 0; i < simulations; i++) {
        const randomLoss = Math.random() * (upper - lower) + lower;
        losses.push(randomLoss);
    }

    // Sort losses numerically
    losses.sort((a, b) => a - b);

    // Calculate summary metrics
    const meanLoss = losses.reduce((a, b) => a + b) / losses.length;
    const medianLoss = losses[Math.floor(losses.length / 2)];
    const var_95 = losses[Math.floor(losses.length * 0.95)];
    const stdLoss = Math.sqrt(losses.map(x => Math.pow(x - meanLoss, 2)).reduce((a, b) => a + b) / losses.length);
    const cvar = losses.filter(loss => loss > var_95).reduce((a, b) => a + b) / losses.filter(loss => loss > var_95).length;

    // Display results
    document.getElementById('results').innerHTML = `
        <p>Mean Loss: ${meanLoss.toFixed(2)}</p>
        <p>Median Loss: ${medianLoss.toFixed(2)}</p>
        <p>Standard Deviation of Loss: ${stdLoss.toFixed(2)}</p>
        <p>Value at Risk (95%): ${var_95.toFixed(2)}</p>
        <p>Conditional Value at Risk (95%): ${cvar.toFixed(2)}</p>
        <p>${(reserve * 100).toFixed(1)}th Percentile Loss: ${losses[Math.floor(losses.length * reserve)].toFixed(2)}</p>
    `;

    // Create a plot for the loss distribution using Plotly
    const trace1 = {
        x: losses,
        type: 'histogram',
        opacity: 0.7
    };

    const layout1 = {
        title: 'Total Loss Distribution',
        xaxis: { title: 'Loss' },
        yaxis: { title: 'Frequency' }
    };

    Plotly.newPlot('plots', [trace1], layout1);
});
