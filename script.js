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
    const zScore = this.inverseCumulativeNormalDistribution(this.confidenceLevel);
    this.meanLog = (Math.log(this.lower) + Math.log(this.upper)) / 2;
    this.sdLog = (Math.log(this.upper) - Math.log(this.lower)) / (2 * zScore);
  }

  generateDistributions() {
    this.loss = [];
    this.prob = [];

    for (let i = 0; i < this.simulations; i++) {
      const logNormal = this.logNormalDistribution(this.sdLog, Math.exp(this.meanLog));
      const poisson = this.poissonDistribution(this.events);

      this.loss.push(logNormal);
      this.prob.push(poisson);
    }
  }

  combineDistributions() {
    this.totalLoss = this.loss.map((ln, i) => ln * this.prob[i]);
  }

  calculateMetrics() {
    this.meanLoss = this.mean(this.totalLoss);
    this.medianLoss = this.median(this.totalLoss);
    this.stdLoss = this.standardDeviation(this.totalLoss);
    this.var = this.percentile(this.totalLoss, 95);
    this.cvar = this.mean(this.totalLoss.filter(loss => loss > this.var));
    this.lossAtReserve = this.percentile(this.totalLoss, this.reserve * 100);

    this.percentiles = {};
    [10, 20, 30, 40, 50, 60, 70, 80, 90, 99].forEach(p => {
      this.percentiles[p] = this.percentile(this.totalLoss, p);
    });
  }

  summary() {
    console.log(`Mean Loss: ${this.meanLoss.toFixed(2)}`);
    console.log(`Median Loss: ${this.medianLoss.toFixed(2)}`);
    console.log(`Standard Deviation of Loss: ${this.stdLoss.toFixed(2)}`);
    console.log(`Value at Risk (95%): ${this.var.toFixed(2)}`);
    console.log(`Conditional Value at Risk (95%): ${this.cvar.toFixed(2)}`);
    console.log(`${(this.reserve * 100).toFixed(1)}th Percentile Loss: ${this.lossAtReserve.toFixed(2)}`);
    console.log("\nPercentiles:");
    Object.keys(this.percentiles).forEach(p => {
      console.log(`P(${p}): ${this.percentiles[p].toFixed(2)}`);
    });
  }

  logNormalDistribution(sd, mean) {
    const normalSample = Math.random() * sd + mean;
    return Math.exp(normalSample);
  }

  poissonDistribution(lambda) {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }

  inverseCumulativeNormalDistribution(p) {
    // Approximation for inverse normal distribution (can be replaced with a library call)
    const a1 = 0.319381530;
    const a2 = -0.356563782;
    const a3 = 1.781477937;
    const a4 = -1.821255978;
    const a5 = 1.330274429;
    const t = 1 / (1 + 0.2316419 * (1 - p));
    const tSquared = t * t;
    return 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-tSquared / 2) / Math.sqrt(2 * Math.PI));
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
    const index = Math.floor((p / 100) * sorted.length);
    return sorted[index];
  }
}

// Test
const model = new RiskModel(1000, 50000, 200000, 0.95, 3, 0.95);
model.summary();
