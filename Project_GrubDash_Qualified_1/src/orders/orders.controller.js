const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: orders });
}

function validateData(req, res, next) {
  if (!req.body.data) {
    return next({
      status: 400,
      message: "Order must include a data object",
    });
  }
  next();
}

function validator(field) {
  return function (req, res, next) {
    const { data: { [field]: value } = {} } = req.body;
    if (!value) {
      return next({
        status: 400,
        message: `Order must include a ${field}`,
      });
    }
    next();
  };
}

function validateOrderExists(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index === -1) {
    return next({
      status: 404,
      message: `Order does not exist: ${orderId}`,
    });
  } else {
    res.locals.index = index;
    res.locals.order = orders[index];
    next();
  }
}

function validateDishesExists(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!dishes) {
    return next({
      status: 400,
      message: "Order must include a dish",
    });
  } else if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  next();
}

function validateDishQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  const { order, index } = res.locals;
  const { data: { deliverTo, mobileNumber, dishes, status, id } = {} } =
    req.body;
  if (id && id !== order.id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${order.id}`,
    });
  } else if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  } else if (!status || status === "invalid") {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  } else {
    const updatedOrder = {
      ...order,
      deliverTo,
      mobileNumber,
      dishes,
      status,
    };
    orders[index] = updatedOrder;
    res.json({ data: updatedOrder });
  }
}

function destroy(req, res, next) {
    const {index, order} = res.locals;

    if (order.status !== "pending") {
        return next({
            status: 400,
            message: "An order cannot be deleted unless it is pending"
        })
    } else {
        orders.splice(index, 1);
        res.sendStatus(204);
    }
}

module.exports = {
  list,
  create: [
    validateData,
    validator("deliverTo"),
    validator("mobileNumber"),
    validateDishesExists,
    validateDishQuantity,
    create,
  ],
  read: [validateOrderExists, read],
  update: [
    validateOrderExists,
    validateData,
    validator("deliverTo"),
    validator("mobileNumber"),
    validateDishesExists,
    validateDishQuantity,
    update,
  ],
    delete: [validateOrderExists, destroy],
};