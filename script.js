class RiskModel {
  constructor(simulations, lower, upper, confidenceLevel, events, reserve) {
    this.simulations = simulations;
    this.lower = lower;
    this.upper = upper;
    this.confidenceLevel = confidenceLevel;
    this.events = events;
    this.reserve = reserve;

    this.calculateParameters();
    this.generateDistributions();
    this.combineDistributions();
    this.calculateMetrics();
  }

  calculateParameters() {
    const error = (1 - this.confidenceLevel) / 2;
    const trueMeanLog = (Math.log(this.lower) + Math.log(this.upper)) / 2;
    const trueSdLog = (Math.log(this.upper) - Math.log(this.lower)) / (2 * this.inverseCumulativeNormalDistribution(0.9));
    this.trueMeanLog = trueMeanLog;
    this.trueSdLog = trueSdLog;
  }

  generateDistributions() {
    const loss = [];
    const prob = [];
    for (let i = 0; i < this.simulations; i++) {
      const logNormal = this.logNormalDistribution(this.trueSdLog, Math.exp(this.trueMeanLog));
      loss.push(logNormal);
      const poisson = this.poissonDistribution(this.events);
      prob.push(poisson);
    }
    this.loss = loss;
    this.prob = prob;
  }

  combineDistributions() {
    const totalLoss = [];
    for (let i = 0; i < this.simulations; i++) {
      totalLoss.push(this.prob[i] * this.loss[i]);
    }
    this.totalLoss = totalLoss;
  }

  calculateMetrics() {
    const meanLoss = this.mean(this.totalLoss);
    const medianLoss = this.median(this.totalLoss);
    const stdLoss = this.standardDeviation(this.totalLoss);
    const valueAtRisk = this.percentile(this.totalLoss, 95);
    const cvar = this.mean(this.totalLoss.filter(loss => loss > valueAtRisk));
    const lossAtReserve = this.percentile(this.totalLoss, this.reserve * 100);
    const percentiles = {};
    [10, 20, 30, 40, 50, 60, 70, 80, 90, 99].forEach(p => {
      percentiles[p] = this.percentile(this.totalLoss, p);
    });
    this.meanLoss = meanLoss;
    this.medianLoss = medianLoss;
    this.stdLoss = stdLoss;
    this.valueAtRisk = valueAtRisk;
    this.cvar = cvar;
    this.lossAtReserve = lossAtReserve;
    this.percentiles = percentiles;
  }

  logNormalDistribution(sd, mean) {
    return Math.exp(Math.random() * sd + mean);
  }

  poissonDistribution(lambda) {
    let sum = 0;
    for (let i = 0; i < lambda; i++) {
      sum += Math.random();
    }
    return Math.floor(sum);
  }

  inverseCumulativeNormalDistribution(p) {
    const a1 = 0.319381530;
    const a2 = -0.356563782;
    const a3 = 1.781477937;
    const a4 = -1.821255978;
    const a5 = 1.330274429;
    const t = 1 / (1 + 0.2316419 * Math.abs(1 - p));
    return 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-t * t / 2) / Math.sqrt(2 * Math.PI));
  }

  mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  median(arr) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  }

  standardDeviation(arr) {
    const mean = this.mean(arr);
    return Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length);
  }

  percentile(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.floor(p / 100 * sorted.length);
    return sorted[index];
  }
}

// Form submission event listener
document.getElementById('riskForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const simulations = parseInt(document.getElementById('simulations').value);
  const lower = parseInt(document.getElementById('lower').value);
  const upper = parseInt(document.getElementById('upper').value);
  const confidence_level = parseFloat(document.getElementById('confidence_level').value);
  const events = parseInt(document.getElementById('events').value);
  const reserve = parseFloat(document.getElementById('reserve').value);

  const model = new RiskModel(simulations, lower, upper, confidence_level, events, reserve);
  model.calculateMetrics();

  document.getElementById('results').innerHTML = `
    <p>Mean Loss: ${model.meanLoss.toFixed(2)}</p>
    <p>Median Loss: ${model.medianLoss.toFixed(2)}</p>
    <p>Standard Deviation of Loss: ${model.stdLoss.toFixed(2)}</p>
    <p>Value at Risk (95%): ${model.valueAtRisk.toFixed(2)}</p>
    <p>Conditional Value at Risk (95%): ${model.cvar.toFixed(2)}</p>
    <p>${(reserve * 100).toFixed(1)}th Percentile Loss: ${model.lossAtReserve.toFixed(2)}</p>
    <h3>Percentiles:</h3>
    <ul>
      ${Object.keys(model.percentiles).map(p => `<li>P(${p}): ${model.percentiles[p].toFixed(2)}</li>`).join('')}
    </ul>
  `;

  // Create a plot for the loss distribution using Plotly
  const trace1 = {
    x: model.totalLoss,
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

