'use strict';

const orderManager = require('./orderManager');
const { createResponse } = require('./utils/createResponse');



module.exports.createOrder = async (event, context, callback) => {
  try
  {
    const body = JSON.parse(event.body);
    const order = orderManager.createOrder(body);

    await orderManager.placeNewOrder(order);

    return createResponse(order, 200);
  } catch (ex) {
    console.log(ex);
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
    console.log(ex);
    return createResponse(ex, 500);
  }
};
