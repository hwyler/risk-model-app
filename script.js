document.getElementById('riskForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const simulations = parseInt(document.getElementById('simulations').value);
  const lower = parseInt(document.getElementById('lower').value);
  const upper = parseInt(document.getElementById('upper').value);
  const confidenceLevel = parseFloat(document.getElementById('confidence_level').value);
  const events = parseInt(document.getElementById('events').value);
  const reserve = parseFloat(document.getElementById('reserve').value);

  // Simulación de pérdidas
  const loss = [];
  for (let i = 0; i < simulations; i++) {
    const logNormal = logNormalDistribution(Math.log(upper / lower), (Math.log(lower) + Math.log(upper)) / 2);
    loss.push(logNormal);
  }

  // Simulación de eventos
  const prob = [];
  for (let i = 0; i < simulations; i++) {
    const poisson = poissonDistribution(events);
    prob.push(poisson);
  }

  // Combinación de distribuciones
  const totalLoss = [];
  for (let i = 0; i < simulations; i++) {
    totalLoss.push(prob[i] * loss[i]);
  }

  // Cálculo de métricas
  const meanLoss = mean(totalLoss);
  const medianLoss = median(totalLoss);
  const stdLoss = standardDeviation(totalLoss);
  const var95 = percentile(totalLoss, 95);
  const cvar = mean(totalLoss.filter(loss => loss > var95));
  const lossAtReserve = percentile(totalLoss, reserve * 100);
  const percentiles = {};
  [10, 20, 30, 40, 50, 60, 70, 80, 90, 99].forEach(p => {
    percentiles[p] = percentile(totalLoss, p);
  });

  // Mostrar resultados
  document.getElementById('results').innerHTML = `
    <p>Mean Loss: ${meanLoss.toFixed(2)}</p>
    <p>Median Loss: ${medianLoss.toFixed(2)}</p>
    <p>Standard Deviation of Loss: ${stdLoss.toFixed(2)}</p>
    <p>Value at Risk (95%): ${var95.toFixed(2)}</p>
    <p>Conditional Value at Risk (95%): ${cvar.toFixed(2)}</p>
    <p>${(reserve * 100).toFixed(1)}th Percentile Loss: ${lossAtReserve.toFixed(2)}</p>
    <p>Percentiles:</p>
    <ul>
      ${Object.keys(percentiles).map(p => `<li>P(${p}): ${percentiles[p].toFixed(2)}</li>`).join('')}
    </ul>
  `;
});

// Funciones auxiliares
function logNormalDistribution(sd, mean) {
  return Math.exp(Math.random() * sd + mean);
}

function poissonDistribution(lambda) {
  let sum = 0;
  for (let i = 0; i < lambda; i++) {
    sum += Math.random();
  }
  return Math.floor(sum);
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function standardDeviation(arr) {
  const mean = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length);
}

function percentile(arr, p) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.floor(p / 100 * sorted.length);
  return sorted[index];
}
