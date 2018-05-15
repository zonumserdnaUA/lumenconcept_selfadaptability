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
exports.getPaymentRule = getPaymentRule;
exports.existPaymentRule = existPaymentRule;

// private methods
function createPaymentRule(paymentRule, callback) {
    var params = {
        TableName: tableName,
        Item: paymentRule
    };

    docClient.put(params, function(err, data) {
        if (err) console.log(err);
        else {
            console.log("__PAYMENT_RULE rule created successfully", paymentRule, "\n");
            if(callback) callback(paymentRule);
        }
    });
}

function getPaymentRule(userId, userLocation, callback) {
    var params = {
        TableName: tableName,
        FilterExpression: "#k_user_id = :v_user_id AND #k_user_location = :v_user_location",
        ExpressionAttributeNames: {
            "#k_user_id": "userId",
            "#k_user_location": "userLocation"
        },
        ExpressionAttributeValues: {
            ":v_user_id": userId,
            ":v_user_location": userLocation
        }
    };

    docClient.scan(params, function(err, data) {
        if (err) {
            console.log("__PAYMENT_RULE ERROR getting payment rule", err, "\n");
        } else {
            console.log("__PAYMENT_RULE getting payment rule", data.Items, "\n");
            if(callback) callback(data.Items[0]);
        }
    });
}

function existPaymentRule(paymentRule, callback) {
    getPaymentRule(paymentRule.userId, paymentRule.userLocation, function (pRule) {
        if(callback) callback(!!(pRule));
    });
}
