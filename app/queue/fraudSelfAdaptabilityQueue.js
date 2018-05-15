var amqp = require('amqplib/callback_api');
var requestQueue = "selfAdaptability.execute.fraud";
var queueURL = "amqp://vgleryqm:kwDm7WnQvfqeA4RX1DZXfmT-DWTxC3bu@skunk.rmq.cloudamqp.com/vgleryqm";

// public methods

exports.notify = notify;
exports.FRAUD_ACTION = "executeFraud";

// private methods

function notify(data, callback) {
    amqp.connect(queueURL, function(err, conn) {
        conn.createChannel(function(err, ch) {
            var q = requestQueue;
            ch.assertQueue(q, {durable: false});
            var sData = JSON.stringify(data);
            console.log("__SelfAdaptability billing sending to...", requestQueue, "\n");
            ch.sendToQueue(q, new Buffer(sData));
            console.log("__SelfAdaptability FRAUD sent", data, "\n");
            if (callback) callback(data);
        });
    });
}