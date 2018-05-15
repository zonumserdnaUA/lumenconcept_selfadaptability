var kafkaClient = require("../kafka/kafkaClient");
var fraudDB = require("../db/fraudDB");
var fraudBankSuspicion =  require("../mocks/fraudBankSuspicion");
var fraudUtil = require("../util/fraudUtil");
var fraudSelfAdaptabilityQueue = require("../queue/fraudSelfAdaptabilityQueue");
var billingSelfAdaptabilityQueue = require("../queue/billingSelfAdaptabilityQueue");
var paymentRuleUtil = require("../util/paymentRuleUtil");
var paymentRulesDB = require("../db/paymentRulesDB");
var banksSimilarTransactionsUtil = require("../util/banksSimilarTransactionsUtil");

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
        fraudDetectedManager(bill);
    } else if (fraud.probability >= fraudUtil.LOWER_LIMIT_SUSPISSION_PROBABILITY) {
        suspissionDetectedManager(bill);
    } else {
        paymentDetectedManager(bill);
    }
}

function fraudDetectedManager(bill) {
    fraudSelfAdaptabilityQueue.notify(bill);
    var fraudFieldsToTopic = bill.ID + "," + bill.createdDate + "," + true;
    kafkaClient.notify(fraudFieldsToTopic);
    paymentRuleUtil.createPaymentRule(bill, fraudSelfAdaptabilityQueue.FRAUD_ACTION);
}

function paymentDetectedManager(bill) {
    billingSelfAdaptabilityQueue.notify(parseInt(bill.ID));
    var fraudFieldsToTopic = bill.ID + "," + bill.createdDate + "," + false;
    kafkaClient.notify(fraudFieldsToTopic);
    paymentRuleUtil.createPaymentRule(bill, billingSelfAdaptabilityQueue.PAYMENT_ACTION);
}

function suspissionDetectedManager(bill) {
    banksSimilarTransactionsUtil.isThereSimilarTransactions(bill, function (bIsThereSimilarTransactions) {
        if (bIsThereSimilarTransactions) {
            paymentDetectedManager(bill);
        } else {
            fraudDetectedManager(bill);
        }
    });
}
