document.getElementById('riskForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const simulations = document.getElementById('simulations').value;
    const lower = document.getElementById('lower').value;
    const upper = document.getElementById('upper').value;
    const confidence_level = document.getElementById('confidence_level').value;
    const events = document.getElementById('events').value;
    const reserve = document.getElementById('reserve').value;

    const response = await fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            simulations: parseInt(simulations),
            lower: parseInt(lower),
            upper: parseInt(upper),
            confidence_level: parseFloat(confidence_level),
            events: parseInt(events),
            reserve: parseFloat(reserve)
        })
    });

    const data = await response.json();
    document.getElementById('results').innerHTML = `
        <p>Mean Loss: ${data.mean_loss.toFixed(2)}</p>
        <p>Median Loss: ${data.median_loss.toFixed(2)}</p>
        <p>Standard Deviation of Loss: ${data.std_loss.toFixed(2)}</p>
        <p>Value at Risk (95%): ${data.var_95.toFixed(2)}</p>
        <p>Conditional Value at Risk (95%): ${data.cvar.toFixed(2)}</p>
        <p>${(reserve * 100).toFixed(1)}th Percentile Loss: ${data.loss_at_reserve.toFixed(2)}</p>
    `;

    // Create a plot for the loss distribution
    const trace1 = {
        x: data.total_loss,
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