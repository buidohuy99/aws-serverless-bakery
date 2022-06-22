const orderManager = require('./orderManager');
const AWS = require('aws-sdk');
const SQS = new AWS.SQS({
    region: process.env.region
});

const deliveryQueue = process.env.deliveryQueue;

module.exports.handleDeliveryOrders = (ordersFulfilled) => {
    let promises = [];

    for(let order of ordersFulfilled) {
        const promise = (async() => {
            const updatedOrder = await orderManager.updateOrderStatusToDelivery(order, 'order-sent-to-delivery');
            await sendOrderToDeliveryService(updatedOrder);
        })();
        promises.push(promise);
    }

    return Promise.all(promises);
}

const sendOrderToDeliveryService = (order) => {
    const params = {
        MessageBody: JSON.stringify(order),
        QueueUrl: deliveryQueue
    }

    return SQS.sendMessage(params).promise();
}