const puppeteer = require("puppeteer");
const fs = require("fs");
const SeleniumParser = require("./seleniumparser");

const cheerio = require("cheerio");
const NodeCache = require("node-cache"); // auto expiring in memory caching collection
const cache = new NodeCache({ stdTTL: 300 }); // cache source HTML for 5 minutes, after which we fetch a new version

const options = {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      '--disable-web-security',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
    ],
    headless: true,
    // executablePath: "/usr/bin/chromium-browser",
  };

const HeadlessParser = {
  _setDbPage: (link, data) => {
    cache.set(link, data);
  },
  _getDbPage: (link) => {
    return cache.get(link);
  },

  _scrapePage: async ({
    link,
    parser = 'selenium' // or 'selenium'
  }) => {
    switch(parser) {
      case 'puppeter': {
        const browser = await puppeteer.launch(options);

        // Create a new page
        const page = await browser.newPage();
        await page.setBypassCSP(true);
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
        );
        await page.goto(link);
        const data = await page.evaluate(
          () => document.querySelector("*").outerHTML
        );
        await browser.close();
        return data;
      }
      case 'selenium': {
        const data = await SeleniumParser._scrapePage(link);
        return data;
      }
    }
  },

  getPageHtml: async (link, blockJs = 'true') => {
    console.log("link :>> ", link);
    const page = HeadlessParser._getDbPage(link);
    if (!page) {
      const data = await HeadlessParser._scrapePage({
        link,
        parser: 'selenium'
      })
      let $ = cheerio.load(data);

      // if (blockJs === true) {
      //   $("script").each(function () {
      //     $(this).remove();
      //   });
      // }


      $("head").prepend('<base href="' + link + '" target="_blank">');

      let preparedData = $.html();
      
      HeadlessParser._setDbPage(link, preparedData);

      // await browser.close();
    //   console.log('preparedData :>> ', preparedData);
      //   console.log("preparedData.length :>> ", preparedData.length);
      return preparedData;
    } else {
      return page;
    }
  },

  getPageHead: async (link) => {
    // console.log("link :>> ", link);
    const page = HeadlessParser._getDbPage(link);
    if (!page) {
      const data = await HeadlessParser._scrapePage({
        link,
        parser: 'selenium'
      })
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
      HeadlessParser._setDbPage(link, preparedData);
      // const pdf = await page.pdf({ format: "A4" });
      // await browser.close();
      return { title, imageLink };
    } else {
      let $ = cheerio.load(page);

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
      HeadlessParser._setDbPage(link, preparedData);
      // const pdf = await page.pdf({ format: "A4" });
      // await browser.close();
      return { title, imageLink };
    }
  },
};

module.exports = HeadlessParser;
