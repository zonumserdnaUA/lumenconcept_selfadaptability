var kafkaClient = require("../kafka/kafkaClient");
var fraudDB = require("../db/fraudDB");
var fraudBankSuspicion =  require("../mocks/fraudBankSuspicion");
var fraudUtil = require("../util/fraudUtil");
var fraudSelfAdaptabilityQueue = require("../queue/fraudSelfAdaptabilityQueue");
var billingSelfAdaptabilityQueue = require("../queue/billingSelfAdaptabilityQueue");
var paymentRuleUtil = require("../util/paymentRuleUtil");
var paymentRulesDB = require("../db/paymentRulesDB");
var banksSimilarTransactionsUtil = require("../util/banksSimilarTransactionsUtil");
var billingQueue = require("../queue/billingQueue");
var request = require("request");

billingSelfAdaptabilityQueue.suscribe(function (sBill) {
    var bill = JSON.parse(sBill);

    paymentRulesDB.getPaymentRule(bill.order.userId, bill.userLocation, function (paymentRule) {
        if (!!(paymentRule)) {
            executeRule(paymentRule, bill);
        } else {
            fraudSuspicionManager(bill)
        }
    });
});

function executeRule(paymentRule, bill) {
    switch(paymentRule.action) {
        case billingSelfAdaptabilityQueue.PAYMENT_ACTION:
            billingSelfAdaptabilityQueue.notify(parseInt(bill.ID));
            break;
        case fraudSelfAdaptabilityQueue.FRAUD_ACTION:
            fraudSelfAdaptabilityQueue.notify(bill);
            fraudDetectedManager(bill, paymentRule);
            break;
    }
}

function fraudSuspicionManager (bill) {
    fraudDB.getFraud(bill.order.userId, function (fraud) {
        if (fraud) determineFraudSuspicionProbability(fraud, bill);
        else getFraudSuspicionProbabilityFromBank(bill);
    });
}

function getFraudSuspicionProbabilityFromBank(bill) {
    var probability = fraudBankSuspicion.getFraudSuspicionProbability();
    fraudUtil.createFraud(bill.order.userId, probability, function(fraud) {
        console.log("__FRAUD SUCCEEDED getting fraud from BANK", fraud, "\n");
        determineFraudSuspicionProbability(fraud, bill);
    });
}

function determineFraudSuspicionProbability(fraud, bill) {
    if (fraud.probability >= fraudUtil.UPPER_LIMIT_SUSPISSION_PROBABILITY) {
        fraudDetectedManager(bill, fraud);
    } else if (fraud.probability >= fraudUtil.LOWER_LIMIT_SUSPISSION_PROBABILITY) {
        suspissionDetectedManager(bill, fraud);
    } else {
        paymentDetectedManager(bill);
    }
}

function fraudDetectedManager(bill, fraud) {
    fraudSelfAdaptabilityQueue.notify(bill);
    var fraudFieldsToTopic = bill.ID + "," + bill.createdDate + "," + true;
    kafkaClient.notify(fraudFieldsToTopic);
    paymentRuleUtil.createPaymentRule(bill, fraudSelfAdaptabilityQueue.FRAUD_ACTION);
    sendFraud(bill, fraud);
}

function paymentDetectedManager(bill) {
    billingSelfAdaptabilityQueue.notify(parseInt(bill.ID));
    var fraudFieldsToTopic = bill.ID + "," + bill.createdDate + "," + false;
    kafkaClient.notify(fraudFieldsToTopic);
    paymentRuleUtil.createPaymentRule(bill, billingSelfAdaptabilityQueue.PAYMENT_ACTION);
}

function suspissionDetectedManager(bill, fraud) {
    banksSimilarTransactionsUtil.isThereSimilarTransactions(bill, function (bIsThereSimilarTransactions) {
        if (bIsThereSimilarTransactions) {
            paymentDetectedManager(bill);
        } else {
            fraudDetectedManager(bill, fraud);
        }
    });
}

function sendFraud(bill, fraud) {
    var options = {
        uri: 'https://g0auvp9nmh.execute-api.us-east-2.amazonaws.com/Production/frauds',
        method: 'POST',
        json: {
            "bill": bill,
            "fraud": fraud
        }
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            notifyBillingFailed(bill.order.id_order);
        } else {
            console.log(error);
        }
    });
}

function notifyBillingFailed(orderId) {
    var data = {
        state: false,
        reason: "Payment in fraud",
        id_order: orderId
    };
    billingQueue.notify(data);
}
