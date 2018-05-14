var AWS = require('aws-sdk');
var tableName = "PaymentRules";
var DBKeys = require("./DBKeys");

AWS.config.update({
    accessKeyId: DBKeys.getAccessKeyId(),
    secretAccessKey: DBKeys.getSecretAccessKey(),
    region: 'us-east-2'
});

var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

// public methods
exports.createPaymentRule = createPaymentRule;

// private methods
function createPaymentRule(paymentRule, callback) {
    var params = {
        TableName: tableName,
        Item: paymentRule
    };
    docClient.put(params, function(err, data) {
        if (err) console.log(err);
        else {
            console.log("__PAYMENT_RULE rule created successfully", paymentRule);
            if(callback) callback(paymentRule);
        }
    });
}
