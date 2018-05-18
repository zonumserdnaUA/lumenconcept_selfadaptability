var amqp = require('amqplib/callback_api');
var requestQueue = "billing1.request";
var responseQueue = "billing1.response";
var selfAdaptabilityResponse = "selfAdaptability.payment.response";
var queueURL = "amqp://vgleryqm:kwDm7WnQvfqeA4RX1DZXfmT-DWTxC3bu@skunk.rmq.cloudamqp.com/vgleryqm";

// public methods

exports.suscribe = suscribe;
exports.notify = notify;
exports.notifyPaymentState = notifyPaymentState;

// private methods

function suscribe(callback) {
    amqp.connect(queueURL, function(err, conn) {
        conn.createChannel(function(err, ch) {
            var q = requestQueue;
            ch.assertQueue(q, {durable: false});
            ch.consume(q, function(msg) {
                console.log("__Billing request received", msg.content.toString(), "\n");
                callback(msg.content.toString());
            }, {noAck: true});

            console.log("__Billing queue connection successful\n");
        });
    });
}

function notify(data, callback) {
    amqp.connect(queueURL, function(err, conn) {
        conn.createChannel(function(err, ch) {
            var q = responseQueue;
            ch.assertQueue(q, {durable: false});
            var sData = JSON.stringify(data);
            console.log("__Billing COMPENSATION sending to...", responseQueue, "\n");
            ch.sendToQueue(q, new Buffer(sData));
            console.log("__Billing status sent", data, "\n");
            if (callback) callback(data);
        });
    });
}

function notifyPaymentState(data, callback) {
    amqp.connect(queueURL, function(err, conn) {
        conn.createChannel(function(err, ch) {
            var q = selfAdaptabilityResponse;
            ch.assertQueue(q, {durable: false});
            var sData = JSON.stringify(data);
            console.log("__Billing COMPENSATION sending to...", responseQueue, "\n");
            ch.sendToQueue(q, new Buffer(sData));
            console.log("__Billing status sent", data, "\n");
            if (callback) callback(data);
        });
    });
}