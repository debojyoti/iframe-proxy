// import captureWebsite from "capture-website";
const puppeteer = require("puppeteer");
const express = require("express");
const fs = require("fs");
var cors = require("cors");

const cheerio = require("cheerio");
const NodeCache = require("node-cache"); // auto expiring in memory caching collection
const cache = new NodeCache({ stdTTL: 300 }); // cache source HTML for 5 minutes, after which we fetch a new version

const app = express();
app.use(cors());

const port = 3002;

const options = {
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--single-process", // <- this one doesn't works in Windows
    "--disable-gpu",
  ],
  headless: true,
  executablePath: "/usr/bin/chromium-browser",
};
const _setDbPage = (link, data) => {
  cache.set(link, data);
  //   let content = fs.readFileSync(process.cwd() + "/" + "db.json").toString();
  //   const parsedData = JSON.parse(content);
  //   parsedData[link] = JSON.stringify(data);
  //   fs.writeFileSync("db.json", JSON.stringify(parsedData));
};

const _getDbPage = (link) => {
  return cache.get(link);
  //     let content = fs.readFileSync(process.cwd() + "/" + "db.json").toString();
  //   const parsedData = JSON.parse(content);
  //   return parsedData[link] ? JSON.parse(parsedData[link]) : null;
};

const _getPageHtml = async (link) => {
  console.log("link :>> ", link);
  const page = _getDbPage(link);
  if (!page) {
    const browser = await puppeteer.launch(options);

    // Create a new page
    const page = await browser.newPage();
    await page.goto(link);
    const data = await page.evaluate(
      () => document.querySelector("*").outerHTML
    );
    let $ = cheerio.load(data);

    $("script").each(function () {
      $(this).remove();
    });

    $("head").prepend('<base href="' + link + '" target="_blank">');

    let preparedData = $.html();
    _setDbPage(link, preparedData);
    // const pdf = await page.pdf({ format: "A4" });
    await browser.close();
    return preparedData;
  } else {
    return page;
  }
};

const _getPageHead = async (link) => {
  console.log("link :>> ", link);
  const page = _getDbPage(link);
  if (!page) {
    const browser = await puppeteer.launch(options);

    // Create a new page
    const page = await browser.newPage();
    await page.goto(link);
    const data = await page.evaluate(
      () => document.querySelector("*").outerHTML
    );
    let $ = cheerio.load(data);

    $("script").each(function () {
      $(this).remove();
    });

    $("head").prepend('<base href="' + link + '" target="_blank">');

    const title = $("title").text();
    let imageLink = "";
    const canonicalTag = $('meta[name="twitter:image"]');
    if (canonicalTag) {
      imageLink = canonicalTag.attr("content");
    }

    let preparedData = $.html();
    _setDbPage(link, preparedData);
    // const pdf = await page.pdf({ format: "A4" });
    await browser.close();
    return { title, imageLink };
  } else {
    return page;
  }
};

app.get("/head", async (req, res) => {
  const { url } = req.query;
  const data = await _getPageHead(url);
  res.send(data);
});

app.get("/", async (req, res) => {
  const { url } = req.query;
  const pageHtml = await _getPageHtml(url);
  res.send(pageHtml);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
