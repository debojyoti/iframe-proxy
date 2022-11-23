// import captureWebsite from "capture-website";
// const puppeteer = require("puppeteer");
const express = require("express");
// const fs = require("fs");
var cors = require("cors");

const iframeReplacement = require("./index.js");


// const cheerio = require("cheerio");
// const NodeCache = require("node-cache"); // auto expiring in memory caching collection
// const cache = new NodeCache({ stdTTL: 300 }); // cache source HTML for 5 minutes, after which we fetch a new version

const app = express();
app.use(cors());

const port = 3002;

app.get("/", async (req, res) => {
  const { url } = req.query;
//   const pageHtml = await _getPageHtml(url);
  res.send(pageHtml);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
