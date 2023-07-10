const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: dishes });
}

validateDishExists = (req, res, next) => {
  const { dishId } = req.params;
  const index = dishes.findIndex((dish) => dish.id === dishId);
  if (index === -1) {
    return next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
  } else {
    res.locals.index = index;
    res.locals.dish = dishes[index];
    next();
  }
};

function validator(field) {
  return function (req, res, next) {
    if (req.body.data[field]) {
      if (field == "price") {
        if (
          !Number.isInteger(req.body.data[field]) ||
          req.body.data[field] < 0
        ) {
          next({
            status: 400,
            message: `Dish must have a ${field} that is an integer greater than 0`,
          });
        }
      }
      next();
    } else {
      next({ status: 400, message: `Dish must include a ${field}` });
    }
  };
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const { dishId } = req.params;
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  const updatedDish = {
    ...dishes[res.locals.index],
    name,
    description,
    price,
    image_url,
  };
  dishes[res.locals.index] = updatedDish;
  res.send({ data: updatedDish });
}

module.exports = {
  list,
  create: [
    validator("name"),
    validator("description"),
    validator("price"),
    validator("image_url"),
    create,
  ],
  read: [validateDishExists, read],
  update: [
    validateDishExists,
    validator("name"),
    validator("description"),
    validator("price"),
    validator("image_url"),
    update,
  ],
};
