var kafkaClient = require("../kafka/kafkaClient");
var fraudDB = require("../db/fraudDB");
var batchDB = require("../db/batchDB");
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
            paymentDetectedManager(bill);
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
    batchAndSpeedManager(bill.ID, bill.createdDate, true);
    paymentRuleUtil.createPaymentRule(bill, fraudSelfAdaptabilityQueue.FRAUD_ACTION);
    billingQueue.notifyPaymentState({success: false, message: "ALERT! You are in fraud"});

    sendFraudToLambda(bill, fraud);
}

function paymentDetectedManager(bill) {
    billingSelfAdaptabilityQueue.notify(parseInt(bill.ID));
    batchAndSpeedManager(bill.ID, bill.createdDate, false);
    paymentRuleUtil.createPaymentRule(bill, billingSelfAdaptabilityQueue.PAYMENT_ACTION);

    billingQueue.notifyPaymentState({success: true, message: "Your bill " + bill.ID + " was created on " + bill.createdDate});
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

function batchAndSpeedManager(billId, billCreatedDate, isFraud) {
    var fraudFieldsToSpeed = billId + "," + billCreatedDate + "," + isFraud;
    kafkaClient.notify(fraudFieldsToSpeed);

    var fraudToBatch = {billId: billId, billCreatedDate: billCreatedDate, isFraud: isFraud};
    batchDB.createFraud(fraudToBatch);
}

function sendFraudToLambda(bill, fraud) {
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
