var AWS = require('aws-sdk');
var tableName = "BanksSimilarTransactions";
var DBKeys = require("./DBKeys");

AWS.config.update({
    accessKeyId: DBKeys.getAccessKeyId(),
    secretAccessKey: DBKeys.getSecretAccessKey(),
    region: 'us-east-2'
});

var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

// public methods

exports.getUserSimilarTransactions = getUserSimilarTransactions;
exports.createSimilarTransaction = createSimilarTransaction;

// private methods

function getUserSimilarTransactions(userID, callback) {
    var params = {
        TableName: tableName,
        FilterExpression: "#k_bill.#k_order.#k_user_id = :v_user_id",
        ExpressionAttributeNames: {
            "#k_bill": "bill",
            "#k_order": "order",
            "#k_user_id": "userId"
        },
        ExpressionAttributeValues: {
            ":v_user_id": userID
        }
    };

    docClient.scan(params, function(err, data) {
        if (err) {
            console.log("__SIMILAR TRANSACTIONS ERROR getting similar transaction", err, "\n");
        } else {
            console.log("__SIMILAR TRANSACTIONS from BANKS getting similar transaction", data.Items, "\n");
            if(callback) callback(data.Items);
        }
    });
}

function createSimilarTransaction(bill, callback) {
    var params = {
        TableName: tableName,
        Item: bill
    };
    docClient.put(params, function(err, data) {
        if (err) console.log(err);
        else {
            console.log("__SIMILAR TRANSACTIONS similar transaction created in BANKS successfully", bill, "\n");
            if(callback) callback(bill);
        }
    });
}
