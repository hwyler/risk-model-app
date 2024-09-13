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
  let resultsContainer = document.createElement('div');
  resultsContainer.id = 'results-container';

  let header = document.createElement('h2');
  header.textContent = 'Risk Model Results';
  resultsContainer.appendChild(header);

  let metricsSection = document.createElement('section');
  metricsSection.id = 'metrics';
  resultsContainer.appendChild(metricsSection);

  let meanLoss = document.createElement('p');
  meanLoss.textContent = `Mean Loss: ${result.mean_loss}`;
  metricsSection.appendChild(meanLoss);

  let medianLoss = document.createElement('p');
  medianLoss.textContent = `Median Loss: ${result.median_loss}`;
  metricsSection.appendChild(medianLoss);

  let stdLoss = document.createElement('p');
  stdLoss.textContent = `Standard Deviation of Loss: ${result.std_loss}`;
  metricsSection.appendChild(stdLoss);

  let varRisk = document.createElement('p');
  varRisk.textContent = `Value at Risk (95%): ${result.valueAtRisk}`;
  metricsSection.appendChild(varRisk);

  let cvarRisk = document.createElement('p');
  cvarRisk.textContent = `Conditional Value at Risk (95%): ${result.cvar}`;
  metricsSection.appendChild(cvarRisk);

  let lossAtReserve = document.createElement('p');
  lossAtReserve.textContent = `${reserve * 100}th Percentile Loss: ${result.loss_at_reserve}`;
  metricsSection.appendChild(lossAtReserve);

  let percentilesSection = document.createElement('section');
  percentilesSection.id = 'percentiles';
  resultsContainer.appendChild(percentilesSection);

  Object.keys(result.percentiles).forEach(p => {
    let percentile = document.createElement('p');
    percentile.textContent = `P(${p}): ${result.percentiles[p]}`;
    percentilesSection.appendChild(percentile);
  });

  document.getElementById('results').replaceWith(resultsContainer);
});
