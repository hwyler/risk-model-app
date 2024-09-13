// Get the input values from the form
const form = document.getElementById('riskForm');
const simulations = parseInt(form.elements['simulations'].value);
const lower = parseInt(form.elements['lower'].value);
const upper = parseInt(form.elements['upper'].value);
const confidence_level = parseFloat(form.elements['confidence_level'].value);
const events = parseInt(form.elements['events'].value);
const reserve = parseFloat(form.elements['reserve'].value);

// Call the riskModel function with the input data
const modelResults = riskModel(
  simulations,
  lower,
  upper,
  confidence_level,
  events,
  reserve
);

// Print the results
const resultsElement = document.getElementById('results');
resultsElement.innerText = `
Mean Loss: ${modelResults.mean_loss}
Median Loss: ${modelResults.median_loss}
Standard Deviation: ${modelResults.std_loss}
Value at Risk: ${modelResults.valueAtRisk}
Conditional Value at Risk: ${modelResults.cvar}
Loss at Reserve: ${modelResults.loss_at_reserve}
Percentiles:
${Object.entries(modelResults.percentiles).map(([percentile, value]) => `  ${percentile}: ${value}`).join('\n')}`;

// Create plots
const plotsElement = document.getElementById('plots');
const plotly = Plotly.newPlot(plotsElement, [
  {
    x: Object.keys(modelResults.percentiles),
    y: Object.values(modelResults.percentiles),
    type: 'bar',
    name: 'Percentiles'
  }
], { title: 'Percentiles' });

// Update plots on form submission
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const newSimulations = parseInt(form.elements['simulations'].value);
  const newLower = parseInt(form.elements['lower'].value);
  const newUpper = parseInt(form.elements['upper'].value);
  const newConfidence_level = parseFloat(form.elements['confidence_level'].value);
  const newEvents = parseInt(form.elements['events'].value);
  const newReserve = parseFloat(form.elements['reserve'].value);

  const newModelResults = riskModel(
    newSimulations,
    newLower,
    newUpper,
    newConfidence_level,
    newEvents,
    newReserve
  );

  resultsElement.innerText = `
Mean Loss: ${newModelResults.mean_loss}
Median Loss: ${newModelResults.median_loss}
Standard Deviation: ${newModelResults.std_loss}
Value at Risk: ${newModelResults.valueAtRisk}
Conditional Value at Risk: ${newModelResults.cvar}
Loss at Reserve: ${newModelResults.loss_at_reserve}
Percentiles:
${Object.entries(newModelResults.percentiles).map(([percentile, value]) => `  ${percentile}: ${value}`).join('\n')}`;

  plotly.update({
    x: Object.keys(newModelResults.percentiles),
    y: Object.values(newModelResults.percentiles)
  });
});
