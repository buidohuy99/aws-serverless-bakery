const AWS = require('aws-sdk');
const SES = new AWS.SES({
    region: process.env.region
});

const CAKE_PRODUCER_MAIL = process.env.CAKE_PRODUCER_MAIL;
const ORDERING_SYSTEM_MAIL = process.env.ORDERING_SYSTEM_MAIL;

module.exports.handleCakeOrders = (ordersPlaced = {}) => {
    let promises = [];

    for(let order of ordersPlaced) {
        const promise = notifyCakeProducerOfOrder(order);
        promises.push(promise);
    }

    return Promise.all(promises);
}

const notifyCakeProducerOfOrder = (order) => {
    const params = {
        Destination: {
            ToAddresses: [CAKE_PRODUCER_MAIL],
        },
        Message: {
            Body: {
                Text: {
                    Data: JSON.stringify(order),
                }
            },
            Subject: {
                Data: "New cake order arrived!",
            }
        },
        Source: ORDERING_SYSTEM_MAIL
    }

    return SES.sendEmail(params).promise();
}


