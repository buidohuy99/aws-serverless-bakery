'use strict';

const orderManager = require('./orderManager');
const cakeOrderManager = require('./cakeProducerManager');
const orderDeliveryManager = require('./orderDeliveryManager');
const feedbackManager = require('./feedbackManager');
const { createResponse } = require('./utils/createResponse');
const { getRecordsInsideQueue } = require('./utils/kinesisHelper');

module.exports.createOrder = async (event, context, callback) => {
  try
  {
    const body = JSON.parse(event.body);
    const order = orderManager.createOrder(body);

    await orderManager.placeNewOrder(order);

    return createResponse(order, 200);
  } catch (ex) {
    console.error(ex);
    return createResponse(ex, 500);
  }
};

module.exports.fulfillOrder = async (event, context, callback) => {
  try
  {
    const body = JSON.parse(event.body);
    let order = await orderManager.getOrder(body.orderId);

    if(order == null) {
      return createResponse({message: "Order cannot be found from Id"}, 400);
    }

    order = await orderManager.fulfillOrder(body);

    return createResponse(order, 200);
  } catch (ex) {
    console.error(ex);
    return createResponse(ex, 500);
  }
};

module.exports.notifyCakeProducer = async (event, context, callback) => {
  try
  {
    const ordersPlaced = getRecordsInsideQueue(event);

    if(ordersPlaced <= 0){
      return 'There is no orders';
    }

    await cakeOrderManager.handleCakeOrders(ordersPlaced);

    return 'Everything is good';
  } catch (ex) {
    console.error(ex);
  }
}

module.exports.sendDeliveryRequest = async (event, context, callback) => {
  try
  {
    const ordersFulfilled = getRecordsInsideQueue(event);

    if(ordersFulfilled <= 0){
      return 'There is no fulfilled orders';
    }

    console.log('Order is being sent to the shipping company..');
    await orderDeliveryManager.handleDeliveryOrders(ordersFulfilled);

    return 'Everything is good';
  } catch (ex) {
    console.error(ex);
  }
}

module.exports.notifyDeliveryCompany = (event, context, callback) => {
  try
  {
    console.log('Calling 3rd party service of delivery company');
  } catch (ex) {
    console.error(ex);
  }
}

module.exports.giveFeedbackOnOrder = async (event, context, callback) => {
  try
  {
    const body = JSON.parse(event.body);
    let order = await orderManager.getOrder(body.orderId);

    if(order == null) {
      return createResponse({message: "Order cannot be found from Id"}, 400);
    }

    order = order.Item;

    if(body.orderReview < 1 || body.orderReview > 5) {
      return createResponse({message: "Invalid feedback"}, 400);
    }

    order = await orderManager.updateOrderStatusDelivered(order, body.deliveryCompanyId);
    order.orderReview = body.orderReview;
    await feedbackManager.sendFeedbackMessage(order);

    return createResponse(order, 200);
  } catch (ex) {
    console.error(ex);
    return createResponse(ex, 500);
  }
}

module.exports.notifyCustomerService = (event, context, callback) => {
  try
  {
    event.Records.forEach(record => {
      console.log(JSON.parse(record.body))
    })
  } catch (ex) {
    console.error(ex);
  }
}
