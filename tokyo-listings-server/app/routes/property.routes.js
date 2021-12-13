module.exports = app => {
  const property = require("../controllers/property.controller.js");

  var router = require("express").Router();

  router.post("/", property.create);
  router.get("/", property.findAll);
  router.put("/:id", property.update);
  router.delete("/:id", property.delete);
  router.get("/withChildren/", property.findAllWithChildren);

  app.use('/api/property', router);
};
