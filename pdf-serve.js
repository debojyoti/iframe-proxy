// import captureWebsite from "capture-website";
const puppeteer = require("puppeteer");
const express = require("express");
const fs = require("fs");
const cheerio = require("cheerio");

const app = express();
const port = 3002;

const _setDbPage = (link, data) => {
  let content = fs.readFileSync(process.cwd() + "/" + "db.json").toString();
  const parsedData = JSON.parse(content);
  parsedData[link] = JSON.stringify(data);
  fs.writeFileSync("db.json", JSON.stringify(parsedData));
};

const _getDbPage = (link) => {
  let content = fs.readFileSync(process.cwd() + "/" + "db.json").toString();
  const parsedData = JSON.parse(content);
  return parsedData[link] ? JSON.parse(parsedData[link]) : null;
};

const _getPageHtml = async (link) => {
  console.log("link :>> ", link);
  const page = _getDbPage(link);
  if (!page) {
    const browser = await puppeteer.launch({
      headless: true,
    });

    // Create a new page
    const page = await browser.newPage();

    // page.setViewport({
    //   width: 1920,
    //   height: 1080,
    // });

    // Configure the navigation timeout
    await page.setDefaultNavigationTimeout(0);

    // Navigate to some website e.g Our Code World
    // await page.waitForNavigation({ waitUntil: "networkidle2" });

    await page.goto(link);
    // await page.waitFor(5000);
    const data = await page.evaluate(
      () => document.querySelector("*").outerHTML
    );
    let $ = cheerio.load(data);

    $("script").each(function () {
      $(this).remove();
    });

    let preparedData = $.html();
    const pdf = await page.pdf({ format: "A4", path: `${__dirname}/pdf.pdf` });
    _setDbPage(link, pdf);
    await browser.close();
    return pdf;
  } else {
    return page;
  }
};

app.get("/", async (req, res) => {
  const { url } = req.query;
  const pageHtml = await _getPageHtml(url);
  var stream = pageHtml;
  var filename = "WhateverFilenameYouWant.pdf";
  // Be careful of special characters

  filename = encodeURIComponent(filename);
  // Ideally this should strip them

  res.setHeader("Content-disposition", 'inline; filename="' + filename + '"');
  res.setHeader("Content-type", "application/pdf");

  fs.createReadStream(`${__dirname}/pdf.pdf`).pipe(res);
  //   res.send(pageHtml);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
