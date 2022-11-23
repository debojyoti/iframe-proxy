// const { html } = require("cheerio");
require('geckodriver');
const { Builder, By, Options } = require("selenium-webdriver");
const firefox = require('selenium-webdriver/firefox'); 

const SeleniumParser = {
  
  _scrapePage: async (link) => {
    const firefoxOptions = new firefox.Options()
    // const path = join(__dirname, './yourdriver')
    // firefoxOptions.setBinary('/snap/bin/firefox')
    firefoxOptions.addArguments("--headless");
    console.log('link 2', link)
    console.log('firefoxOptions', firefoxOptions)
    const builder  = new Builder().forBrowser("firefox");
    builder.setFirefoxOptions(firefoxOptions);
    const driver = await builder.build();
    await driver.get(link);
    const html = driver.getPageSource();
    // console.log('title', title)
    driver.close()
    return html;
  }

};

module.exports = SeleniumParser;
