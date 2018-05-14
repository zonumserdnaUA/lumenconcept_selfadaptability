var AWS = require('aws-sdk');
var tableName = "Fraud";
var DBKeys = require("./DBKeys");

AWS.config.update({
    accessKeyId: DBKeys.getAccessKeyId(),
    secretAccessKey: DBKeys.getSecretAccessKey(),
    region: 'us-east-2'
});

var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

// public methods
exports.createFraud = createFraud;
exports.getFraud = getFraud;

// private methods
function createFraud(fraud, callback) {
    var params = {
        TableName: tableName,
        Item: fraud
    };
    docClient.put(params, function(err, data) {
        if (err) console.log(err);
        else {
            console.log("__FRAUD fraud created successfully", fraud);
            if(callback) callback(fraud);
        }
    });
}

function getFraud(userID, callback) {
    var params = {
        TableName: tableName,
        Key: {"ID": userID}
    };

    console.log("params", params);

    docClient.get(params, function(err, data) {
        if (err) {
            console.log("__FRAUD ERROR getting fraud", err, "\n");
        } else {
            console.log("__FRAUD SUCCEEDED getting fraud", data.Item, "\n");
            if(callback) callback(data.Item);
        }
    });
}