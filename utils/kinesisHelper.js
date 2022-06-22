const parsePayload = (kinesis_record) => {
    const json = new Buffer(kinesis_record.kinesis.data, 'base64').toString('utf-8');
    return JSON.parse(json);
}

module.exports.getRecordsInsideQueue = (event) => {
    return event.Records.map(parsePayload);
}