document.getElementById('riskForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const simulations = parseInt(document.getElementById('simulations').value);
    const lower = parseInt(document.getElementById('lower').value);
    const upper = parseInt(document.getElementById('upper').value);
    const confidenceLevel = parseFloat(document.getElementById('confidence_level').value);
    const events = parseInt(document.getElementById('events').value);
    const reserve = parseFloat(document.getElementById('reserve').value);

    const model = new RiskModel(simulations, lower, upper, confidenceLevel, events, reserve);
    model.summary();
});

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
        this.trueMeanLog = (Math.log(this.lower) + Math.log(this.upper)) / 2;
        this.trueSdLog = (Math.log(this.upper) - Math.log(this.lower)) / (2 * this.inverseCumulativeNormalDistribution(0.9));
    }

    generateDistributions() {
        this.loss = [];
        this.prob = [];
        for (let i = 0; i < this.simulations; i++) {
            const logNormal = this.logNormalDistribution(this.trueSdLog, Math.exp(this.trueMeanLog));
            this.loss.push(logNormal);
            const poisson = this.poissonDistribution(this.events);
            this.prob.push(poisson);
        }
    }

    combineDistributions() {
        this.totalLoss = [];
        for (let i = 0; i < this.simulations; i++) {
            this.totalLoss.push(this.prob[i] * this.loss[i]);
        }
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
        const resultsElement = document.getElementById('results');
        resultsElement.innerHTML = `
            <p>Mean Loss: ${this.meanLoss.toFixed(2)}</p>
            <p>Median Loss: ${this.medianLoss.toFixed(2)}</p>
            <p>Standard Deviation of Loss: ${this.stdLoss.toFixed(2)}</p>
            <p>Value at Risk (95%): ${this.var.toFixed(2)}</p>
            <p>Conditional Value at Risk (95%): ${this.cvar.toFixed(2)}</p>
            <p>${(this.reserve * 100).toFixed(1)}th Percentile Loss: ${this.lossAtReserve.toFixed(2)}</p>
            <h3>Percentiles:</h3>
            ${Object.keys(this.percentiles).map(p => `<p>P(${p}): ${this.percentiles[p].toFixed(2)}</p>`).join('')}
        `;
    }

    logNormalDistribution(sd, mean) {
        return Math.exp(this.randomNormal(mean, sd));
    }

    poissonDistribution(lambda) {
        let L = Math.exp(-lambda);
        let k = 0;
        let p = 1.0;
        do {
            k++;
            p *= Math.random();
        } while (p > L);
        return k - 1;
    }

    inverseCumulativeNormalDistribution(p) {
        // Approximation constants
        const a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
        const a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
        const b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
        const b4 = 66.8013118877197, b5 = -13.2806815528857;
        const c1 = -0.00778489400243029, c2 = -0.322396458041136;
        const c3 = -2.40075827716184, c4 = -2.54973253934373, c5 = 4.37466414146497;
        const c6 = 2.93816398269878;
        const d1 = 0.00778469570904146, d2 = 0.32246712907004;
        const d3 = 2.44513413714299, d4 = 3.75440866190742;

        const pLow = 0.02425;
        const pHigh = 1 - pLow;

        let q, r;
        if (p < pLow) {
            q = Math.sqrt(-2 * Math.log(p));
            return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
                   ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
        } else if (p <= pHigh) {
            q = p - 0.5;
            r = q * q;
            return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
                   (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
        } else {
            q = Math.sqrt(-2 * Math.log(1 - p));
            return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
                    ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
        }
    }

    randomNormal(mean = 0, stdDev = 1) {
        let u1 = Math.random();
        let u2 = Math.random();
        let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
        return mean + stdDev * randStdNormal;
    }

    mean(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    median(arr) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        return sorted[middle];
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
