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
    order.Item.fulfillmentId = fulfillmentId;
    order.Item.fulfillmentDate = fulfillmentDate;

    await dynamo.update({
        TableName: process.env.ordersTableName,
        Key: {id: body.orderId},    
        UpdateExpression: "SET fulfillmentId = :fulfillmentId, fulfillmentDate = :fulfillmentDate",
        ExpressionAttributeValues: {
            ":fulfillmentId": fulfillmentId,
            ":fulfillmentDate": fulfillmentDate
        }
    }).promise();

    console.log(order);

    await kinesis.putRecord({
        Data: JSON.stringify(order),
        PartitionKey: order.Item.id,
        StreamName: process.env.orderFulfillmentsStreamName
    }).promise();

    return order;
}