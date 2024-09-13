class RiskModel {
  constructor(simulations, lower, upper, confidenceLevel, events, reserve) {
    this.simulations = simulations;
    this.lower = lower;
    this.upper = upper;
    this.confidenceLevel = confidenceLevel;
    this.events = events;
    this.reserve = reserve;

    // Initialize random seed (not directly available in JS like numpy)
    this.seed = 123;
    this.randomSeed();

    this.calculateParameters();
    this.generateDistributions();
    this.combineDistributions();
    this.calculateMetrics();
  }

  randomSeed() {
    Math.random = (function(seed) {
      return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    })(this.seed);
  }

  calculateParameters() {
    const error = (1 - this.confidenceLevel) / 2;
    const logUpperLowerRatio = Math.log(this.upper / this.lower);
    this.lowerq = this.logNormalPpf(error, logUpperLowerRatio);
    this.upperq = this.logNormalPpf(1 - error, logUpperLowerRatio);
    this.trueMeanLog = (Math.log(this.lower) + Math.log(this.upper)) / 2;
    this.trueSdLog = (Math.log(this.upper) - Math.log(this.lower)) / (2 * this.inverseCumulativeNormalDistribution(0.9));
  }

  generateDistributions() {
    this.loss = Array.from({ length: this.simulations }, () => this.logNormalDistribution(this.trueSdLog, Math.exp(this.trueMeanLog)));
    this.prob = Array.from({ length: this.simulations }, () => this.poissonDistribution(this.events));
  }

  combineDistributions() {
    this.totalLoss = this.prob.map((prob, i) => prob * this.loss[i]);
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
    return Math.exp(this.randomNormal() * sd + mean);
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

  logNormalPpf(p, logUpperLowerRatio) {
    return Math.exp(this.inverseCumulativeNormalDistribution(p) * logUpperLowerRatio);
  }

  inverseCumulativeNormalDistribution(p) {
    const a1 = -39.69683028665376,
      a2 = 220.9460984245205,
      a3 = -275.9285104469687,
      a4 = 138.357751867269,
      a5 = -30.66479806614716,
      a6 = 2.506628277459239,
      b1 = -54.47609879822406,
      b2 = 161.5858368580409,
      b3 = -155.6989798598866,
      b4 = 66.80131188771972,
      b5 = -13.28068155288572,
      c1 = -7.784894002430293e-03,
      c2 = -3.223964580411365e-01,
      c3 = -2.400758277161838,
      c4 = -2.549732539343734,
      c5 = 4.374664141464968,
      c6 = 2.938163982698783,
      d1 = 7.784695709041462e-03,
      d2 = 3.224671290700398e-01,
      d3 = 2.445134137142996,
      d4 = 3.754408661907416;

    let q, r;

    if (p < 0.02425) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (p > 0.97575) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else {
      q = p - 0.5;
      r = q * q;
      return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
        (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    }
  }

  randomNormal() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
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

// Usage
const model = new RiskModel(100000, 1000, 2000, 0.8, 4, 0.75);
model.summary();

// Test
const model = new RiskModel(1000, 50000, 200000, 0.95, 3, 0.95);
model.summary();
