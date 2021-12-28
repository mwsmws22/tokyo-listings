const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

const db = require("./app/models");
db.sequelize.sync();

require('dotenv').config()
const PORT = process.env.PORT;

var corsOptions = {
  origin: ["http://localhost:8081", "https://realestate.yahoo.co.jp", "https://suumo.jp", "https://sumaity.com"]
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require("./app/routes/listing.routes")(app);
require("./app/routes/property.routes")(app);
require("./app/routes/scraping.routes")(app);
require("./app/routes/ranking.routes")(app);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
