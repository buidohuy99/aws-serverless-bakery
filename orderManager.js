'use strict'

const {v1: uuidv1} = require('uuid');
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const kinesis = new AWS.Kinesis();

module.exports.createOrder = (body) => {
    const order = {
        id: uuidv1(),
        name: body.name,
        address: body.address,
        productId: body.productId,
        quantity: body.quantity,
        orderDate: Date.now(),
        orderStatus: 'order-placed'
    }

    return order;
}

module.exports.placeNewOrder = async (order) => {
    await saveNewOrder(order);

    await placeOrderStream(order);
}

const saveNewOrder = async (order) => {
    const params = {
        TableName: process.env.ordersTableName,
        Item: order
    }

    await dynamo.put(params).promise();
}

const placeOrderStream = async (order) => {
    const params = {
        Data: JSON.stringify(order),
        PartitionKey: order.id,
        StreamName: process.env.orderEventsStreamName
    }

    await kinesis.putRecord(params).promise();
}

module.exports.getOrder = async (orderId) => {
    const order = await dynamo.get({
        TableName: process.env.ordersTableName,
        Key: {id: orderId}
    }).promise();

    return order;
}

module.exports.fulfillOrder = async (body) => {
    const order = await dynamo.get({
        TableName: process.env.ordersTableName,
        Key: {id: body.orderId}
    }).promise();

    const fulfillmentId = body.fulfillmentId;
    const fulfillmentDate = Date.now();
    const orderStatus = 'order-fulfilled';
    order.Item.fulfillmentId = fulfillmentId;
    order.Item.fulfillmentDate = fulfillmentDate;
    order.Item.orderStatus = orderStatus;

    await dynamo.update({
        TableName: process.env.ordersTableName,
        Key: {id: body.orderId},    
        UpdateExpression: "SET fulfillmentId = :fulfillmentId, fulfillmentDate = :fulfillmentDate, orderStatus = :orderStatus",
        ExpressionAttributeValues: {
            ":fulfillmentId": fulfillmentId,
            ":fulfillmentDate": fulfillmentDate,
            ":orderStatus": orderStatus
        }
    }).promise();

    await kinesis.putRecord({
        Data: JSON.stringify(order.Item),
        PartitionKey: order.Item.id,
        StreamName: process.env.orderFulfillmentsStreamName
    }).promise();

    return order.Item;
}

module.exports.updateOrderStatusToDelivery = async (order) => {
    const orderStatus = 'order-sent-to-delivery';
    order.orderStatus = orderStatus;
    order.sentToDeliveryDate = Date.now();

    await dynamo.update({
        TableName: process.env.ordersTableName,
        Key: {id: order.id},    
        UpdateExpression: "SET orderStatus = :orderStatus, sentToDeliveryDate = :sentToDeliveryDate",
        ExpressionAttributeValues: {
            ":orderStatus": orderStatus,
            ":sentToDeliveryDate": order.sentToDeliveryDate,
        }
    }).promise();

    return order;
}

module.exports.updateOrderStatusDelivered = async (order, deliveryCompanyId) => {
    const orderStatus = 'order-delivered';
    order.orderStatus = orderStatus;
    order.deliveredDate = Date.now();
    order.deliveryCompanyId = deliveryCompanyId;

    await dynamo.update({
        TableName: process.env.ordersTableName,
        Key: {id: order.id},    
        UpdateExpression: "SET orderStatus = :orderStatus, deliveredDate = :deliveredDate, deliveryCompanyId = :deliveryCompanyId",
        ExpressionAttributeValues: {
            ":orderStatus": orderStatus,
            ":deliveredDate": order.deliveredDate,
            ":deliveryCompanyId": deliveryCompanyId
        }
    }).promise();

    return order;
}