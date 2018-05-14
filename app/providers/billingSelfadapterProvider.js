var kafkaClient = require("../kafka/kafkaClient");
var fraudDB = require("../db/fraudDB");
var fraudBankSuspicion =  require("../mocks/fraudBankSuspicion");
var fraudUtil = require("../util/fraudUtil");
var fraudSelfAdaptabilityQueue = require("../queue/fraudSelfAdaptabilityQueue");
var billingSelfAdaptabilityQueue = require("../queue/billingSelfAdaptabilityQueue");
var paymentRuleUtil = require("../util/paymentRuleUtil");

kafkaClient.suscribe(function (bill) {
    fraudDB.getFraud(bill.order.userId, function (fraud) {
        if (fraud) determineFraudSuspicionProbability(fraud, bill);
        else getFraudSuspicionProbabilityFromBank(bill);
    });
});

function getFraudSuspicionProbabilityFromBank(bill) {
    var probability = fraudBankSuspicion.getFraudSuspicionProbability();
    fraudUtil.createFraud(bill.order.userId, probability, function(fraud) {
        determineFraudSuspicionProbability(fraud, bill);
    });
}

function determineFraudSuspicionProbability(fraud, bill) {
    // aquí se debe determinar si la sospecha es > 90% o > 50 y realizar las acciones respectivas
    if (fraud.probability >= fraudUtil.UPPER_LIMIT_SUSPISSION_PROBABILITY) {
        fraudDetectedManager(bill);
    } else if (fraud.probability >= fraudUtil.LOWER_LIMIT_SUSPISSION_PROBABILITY) {
        suspissionDetectedManager();
    } else {
        paymentDetectedManager(bill);
    }
}

function fraudDetectedManager(bill) {
    // 1 escribir en la cola de fraudes para que el servicio de fraudes le dé manejo
    fraudSelfAdaptabilityQueue.notify(bill);
    // 2 escribir datos de la transacción en la tabla de reglas y la acción
    paymentRuleUtil.createPaymentRule(bill, fraudSelfAdaptabilityQueue.EXECUTE_FRAUD_ACTION);
}

function paymentDetectedManager(bill) {
    // 1 escribir en la cola de selfadaptability.execute.payment para el manejo del pago
    billingSelfAdaptabilityQueue.notify(bill.order);
    // 2 escribir datos de la transacción en la tabla de reglas y la acción
    paymentRuleUtil.createPaymentRule(bill, billingSelfAdaptabilityQueue.EXECUTE_PAYMENT_ACTION);
}

function suspissionDetectedManager() {
    // AUTOADAPTABILIDAD
    // determinar si este usuario ha hecho transacciones exitosas similares => se lo puede consultar a los bancos
    // SI => NO es fraude, el usuario puede tener alguna condición especial => establecer regla de pago
    // NO => SI es fraude, el usuario es sospechoso de fraude => establecer regla de fraude
}
