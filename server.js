var path = require("path"),
  express = require("express"),
  exphbs = require("express-handlebars"),
  iframeReplacement = require("./index.js");

const HeadlessParser = require("./headless-parser");

const cors = require("cors");

function Server() {
  var app = express();

  app.use(cors());

  // add iframe replacement to express as middleware (adds res.merge method)
  app.use(iframeReplacement);

  // add handlebars view engine (you can use any)
  app.engine("hbs", exphbs());

  // let express know how to locate the views/templates
  app.set("views", path.resolve(__dirname, "views"));
  app.set("view engine", "hbs");

  // Below endpoint will be removed soon. Keeping this for now to support existing frontend
  app.get("/", function (req, res) {
    res.merge("containers", {
      sourceUrl: req.query.path, // external url to fetch
      sourcePlaceholder: 'div[data-entityid="container-top-stories#1"]', // css selector to inject our content into
    });
  });

  app.get("/basic-parse", function (req, res) {
    // respond to this request with our container content embedded within the BBC News home page
    res.merge("containers", {
      sourceUrl: req.query.path, // external url to fetch
      sourcePlaceholder: 'div[data-entityid="container-top-stories#1"]', // css selector to inject our content into
    });
  });

  app.get("/headless-parse", async (req, res) => {
    const { path, blockJs = 'true' } = req.query;
    const pageHtml = await HeadlessParser.getPageHtml(path, blockJs);
    res.send(pageHtml);
  });

  
  app.get("/meta-parse", async (req, res) => {
    const { path } = req.query;
    const data = await HeadlessParser.getPageHead(path);
    res.send(data);
  });


  // start the server
  app.listen(8080, function () {
    console.log(
      "Server running... Visit http://localhost:8080 in your browser"
    );
  });
}

module.exports = new Server();
