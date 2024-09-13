document.getElementById("riskForm").addEventListener("submit", function (event) {
  event.preventDefault();

 const simulations = parseInt(document.getElementById("simulations").value);
 const lower = parseFloat(document.getElementById("lower").value);
 const upper = parseFloat(document.getElementById("upper").value);
 const confidence_level = parseFloat(document.getElementById("confidence_level").value);
 const events = parseInt(document.getElementById("events").value);
 const reserve = parseFloat(document.getElementById("reserve").value);

 const results = riskModel(simulations, lower, upper, confidence_level, events, reserve);

 const resultsElement = document.getElementById("results");
  resultsElement.innerHTML = `
    <ul>
      <li>Mean Loss: ${results.mean_loss}</li>
      <li>Median Loss: ${results.median_loss}</li>
      <li>Standard Deviation: ${results.std_loss}</li>
      <li>Value at Risk: ${results.var}</li>
      <li>Conditional Value at Risk: ${results.cvar}</li>
      <li>Loss at Reserve: ${results.loss_at_reserve}</li>
    </ul>
  `;

 const percentiles = results.percentiles;
 const percentileKeys = Object.keys(percentiles);

 const plotData = [{
    x: percentileKeys,
    y: percentileKeys.map(key => percentiles[key]),
    type: 'bar'
  }];

  Plotly.newPlot('plots', plotData, {
    title: 'Percentiles',
    xaxis: {
      title: 'Percentile'
    },
    yaxis: {
      title: 'Loss'
    }
  });
});

function riskModel(simulations, lower, upper, confidence_level, events, reserve) {
  // The riskModel function remains the same
  // ...
}
