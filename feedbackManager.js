const AWS = require('aws-sdk');
const SQS = new AWS.SQS({
    region: process.env.region
})

const feedbackQueue = process.env.feedbackQueue;

module.exports.sendFeedbackMessage = async (order) => {
    const params = {
        MessageBody: JSON.stringify(order),
        QueueUrl: feedbackQueue
    }

    await SQS.sendMessage(params).promise();
}