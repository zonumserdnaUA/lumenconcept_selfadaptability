var fraudDB = require("../db/fraudDB");

// public methods

exports.createFraud = createFraud;
exports.UPPER_LIMIT_SUSPISSION_PROBABILITY = 90;
exports.LOWER_LIMIT_SUSPISSION_PROBABILITY = 50;

// private methods

function createFraud(userId, probability, callback) {
    var fraud = {
        ID: userId,
        userId: userId,
        probability: probability
    };

    fraudDB.createFraud(fraud, function() {
        if (callback) callback(fraud);
    });
}
