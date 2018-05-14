// public methods
exports.getFraudSuspicionProbability = getFraudSuspicionProbability;

// private methods

function getFraudSuspicionProbability() {
    return parseInt((Math.random() * 100).toFixed());
}