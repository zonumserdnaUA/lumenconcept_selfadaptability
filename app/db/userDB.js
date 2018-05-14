var AWS = require('aws-sdk');
var tableName = "User";
var DBKeys = require("./DBKeys");

AWS.config.update({
    accessKeyId: DBKeys.getAccessKeyId(),
    secretAccessKey: DBKeys.getSecretAccessKey(),
    region: 'us-east-2'
});

var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

// public methods
exports.getUser = getUser;
exports.updateUserFunds = updateUserFunds;

// private methods
function getUser(userId, callback) {
    var params = {
        TableName: tableName,
        Key: {"ID": userId}
    };

    console.log("params", params);

    docClient.get(params, function(err, data) {
        if (err) {
            console.log("__User ERROR getting user", err, "\n");
        } else {
            console.log("__USER SUCCEEDED getting user", data.Item, "\n");
            if (callback) callback(data.Item);
        }
    });
}

function updateUserFunds(userId, newFunds, callback) {
    var params = {
        TableName: tableName,
        Key: {"ID": userId},
        UpdateExpression: 'set funds = :f',
        ExpressionAttributeValues: {
            ':f': newFunds
        }
    };

    console.log("__User update params", params, "\n");

    console.log("__User typeof newFunds", typeof newFunds);

    docClient.update(params, function(err, data) {
        if (err) {
            console.log("__User ERROR updating user", err, "\n");
        } else {
            console.log("__USER SUCCEEDED updating user", data, "\n");
            if (callback) callback();
        }
    });
}