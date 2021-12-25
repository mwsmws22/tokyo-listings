module.exports = app => {
  const listing = require("../controllers/listing.controller.js");

  var router = require("express").Router();

  router.post("/", listing.create);
  router.get("/", listing.findAll);
  router.get("/interest/:interest", listing.findAllByInterest);
  router.post("/partialUrl/", listing.findAllByPartialUrl);
  router.post("/suumoBukken/", listing.getUpdatedSuumoBukkenUrls);
  router.post("/similarListings/", listing.findAllByAddressAndSqM);
  router.put("/:id", listing.update);
  router.delete("/:id", listing.delete);

  app.use('/api/listing', router);
};
