const puppeteer = require("puppeteer-extra");
require('chromedriver');

const fs = require("fs");
const SeleniumParser = require("./seleniumparser");
const { PuppeteerBlocker } = require("@cliqz/adblocker-puppeteer");
const fetch = require("cross-fetch");

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const { clickCmp } = require("puppeteer-cmp-clicker");

const sleepTime = (n) => new Promise((r) => setTimeout(() => r(), n));

const cheerio = require("cheerio");
const NodeCache = require("node-cache"); // auto expiring in memory caching collection
const cache = new NodeCache({ stdTTL: 300 }); // cache source HTML for 5 minutes, after which we fetch a new version

const options = {
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--single-process", // <- this one doesn't works in Windows
  ],
  headless: true,
  executablePath: "/usr/bin/chromium-browser",
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
    parser = "puppeter", // or 'selenium'
  }) => {
    switch (parser) {
      case "puppeter": {
        const blocker = await PuppeteerBlocker.fromLists(fetch, [
          "https://secure.fanboy.co.nz/fanboy-cookiemonster.txt",
        ]);
        const browser = await puppeteer.launch(options);
        // Create a new page
        const page = await browser.newPage();
        await blocker.enableBlockingInPage(page);

        // await page.setBypassCSP(true);
        // await page.setUserAgent(
        //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
        // );
        await page.goto(link);
        // await page.waitForSelector('.js-accept-cookies', { visible: true });
        // await page.click('.js-accept-cookies');
        // await sleepTime(500);
        // const res = await clickCmp({ page })
        // console.log('res', res)
        const data = await page.evaluate((_) => {
          return document.querySelector("*").outerHTML;
        });
        console.log("data.length", data.length);
        // console.log('elements', elements)

        await browser.close();
        return data;
      }
      case "selenium": {
        const data = await SeleniumParser._scrapePage(link);
        return data;
      }
    }
  },

  getPageHtml: async (link, blockJs = "true") => {
    console.log("link :>> ", link);
    const page = HeadlessParser._getDbPage(link);
    if (!page) {
      const data = await HeadlessParser._scrapePage({
        link,
        parser: "puppeter",
      });
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
        parser: "puppeter",
      });
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
