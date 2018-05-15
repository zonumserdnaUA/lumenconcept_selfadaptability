var amqp = require('amqplib/callback_api');
var executePaymentQueue = "selfAdaptability.execute.payment";
var monitorPaymentQueue = "selfAdaptability.monitor.payment";
var queueURL = "amqp://vgleryqm:kwDm7WnQvfqeA4RX1DZXfmT-DWTxC3bu@skunk.rmq.cloudamqp.com/vgleryqm";

// public methods

exports.notify = notify;
exports.suscribe = suscribe;
exports.PAYMENT_ACTION = "executePayment";

// private methods

function suscribe(callback) {
    amqp.connect(queueURL, function(err, conn) {
        conn.createChannel(function(err, ch) {
            var q = monitorPaymentQueue;
            ch.assertQueue(q, {durable: false});
            ch.consume(q, function(msg) {
                console.log("__SelfAdaptability success bill request received", msg.content.toString(), "\n");
                callback(msg.content.toString());
            }, {noAck: true});

            console.log("__SelfAdaptability queue connection successful\n");
        });
    });
}

function notify(data, callback) {
    amqp.connect(queueURL, function(err, conn) {
        conn.createChannel(function(err, ch) {
            var q = executePaymentQueue;
            ch.assertQueue(q, {durable: false});
            var sData = JSON.stringify(data);
            console.log("__SelfAdaptability billing sending to...", executePaymentQueue, "\n");
            ch.sendToQueue(q, new Buffer(sData));
            console.log("__SelfAdaptability PAYMENT sent", data, "\n");
            if (callback) callback(data);
        });
    });
}