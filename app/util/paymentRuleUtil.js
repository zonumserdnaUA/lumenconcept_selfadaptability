var paymentRulesDB = require("../db/paymentRulesDB");

// public methods

exports.createPaymentRule = createPaymentRule;

// private methods

function createPaymentRule(bill, action, callback) {
    var paymentRule = {
        ID: generatePaymentRuleId(),
        userId: bill.order.userId,
        userLocation: bill.userLocation,
        action: action
    };

    paymentRulesDB.existPaymentRule(paymentRule, function (bExistPaymentRule) {
        if (!bExistPaymentRule) {
            paymentRulesDB.createPaymentRule(paymentRule, function() {
                if (callback) callback(paymentRule);
            });
        }
    });

}

function generatePaymentRuleId() {
    return "" + Math.floor((Math.random() * 10000) + 1);
}
