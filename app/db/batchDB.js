const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://34.202.239.178:8087';
const dbName = 'lumenconcept_payments';
const fraudsCollection = 'Frauds';

// Public methods

exports.createFraud = createFraud;

// Private methods

function createFraud(Fraud, callback) {
    connect(function(db, client) {
        const collection = db.collection(fraudsCollection);
        collection.insertMany([Fraud], function(err, result) {
            console.log("Inserted 3 documents into the collection");
            client.close();
            if (callback) callback(result);
        });
    })
}

function connect(callback) {
    MongoClient.connect(url, function(err, client) {
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        callback(db, client);
    });
}
