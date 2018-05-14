// public methods

exports.getAccessKeyId = getAccessKeyId;
exports.getSecretAccessKey = getSecretAccessKey;

// private methods

function getAccessKeyId() {
    var accessKey = process.env.DB_ACCESS_KEY_ID;
    return accessKey;
}

function getSecretAccessKey() {
    var secretAccessKey = process.env.DB_SECRET_ACCESS_KEY;
    return secretAccessKey;
}