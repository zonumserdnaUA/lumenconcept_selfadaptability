var kafka = require('kafka-node');

var kafkaConsumer;
var kafkaProducer;

const PAYMETN_TOPIC = "lumenconcept.payment";
const KAFKA_HOST = "157.253.238.226:8089";

// public methods

exports.suscribe = suscribe;
exports.notify = notify;

// private methods

function suscribe(callback) {
    var consumer = getConsumer();

    consumer.on('message', function (message) {
        if(callback) callback(message);
    });

    consumer.on('error', function (err) {
        console.log('Error:',err);
    });

    consumer.on('offsetOutOfRange', function (err) {
        console.log('OffsetOutOfRange:',err);
    });
}

function notify(params, callback) {
    var producer = getProducer(),
        payloads = [
            { topic: PAYMETN_TOPIC, messages: params, partition: 0 }
        ];

    producer.on('ready', function () {
        console.log('Producer is ready');
    });

    producer.on('error', function (err) {
        console.log('Producer is in error state');
        console.log(err);
    });

    producer.send(payloads, function (err, data) {
        if(callback) callback(data);
    });
}

function getConsumer() {
    if (!kafkaConsumer) {
        var Consumer = kafka.Consumer,
            client = new kafka.KafkaClient({kafkaHost: KAFKA_HOST}),
            payloads = [{ topic: PAYMETN_TOPIC, offset: 0}],
            options = {autoCommit: false};
        kafkaConsumer = new Consumer(client, payloads, options);
    }

    return kafkaConsumer;
}

function getProducer() {
    if (!kafkaProducer) {
        var Producer = kafka.Producer,
            client = new kafka.KafkaClient({kafkaHost: KAFKA_HOST});
        kafkaProducer = new Producer(client);
    }

    return kafkaProducer;
}
