var banksSimilarTransactionsDB = require("../db/banksSimilarTransactionsDB");

// public methods

exports.createSimilarTransaction = createSimilarTransaction;
exports.isThereSimilarTransactions = isThereSimilarTransactions;

// private methods

function createSimilarTransaction(bill, callback) {
    var similarTransaction = {
        ID: generatePaymentRuleId(),
        bill: bill
    };

    banksSimilarTransactionsDB.createSimilarTransaction(similarTransaction, function() {
        if (callback) callback(similarTransaction);
    });
}

function isThereSimilarTransactions(bill, callback) {
    banksSimilarTransactionsDB.getUserSimilarTransactions(bill.order.userId, function (similarTransactions) {
        var bIsThereSimilarTransactions = similarTransactions.length > 0;
        console.log("__SIMILAR TRANSACTIONS from BANKS is there similar transactions", bIsThereSimilarTransactions, "\n");
        callback(bIsThereSimilarTransactions);
    });
}

function generatePaymentRuleId() {
    return "" + Math.floor((Math.random() * 10000) + 1);
}
