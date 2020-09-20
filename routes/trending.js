require("dotenv").config();
var express = require("express");
var route = express.Router();
const puppeteer = require("puppeteer");
var mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_REMOTE, {
  // connect MongoDB
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});
var topChannels = require("../models/channel");

route.get("/", function (req, res) {
  (async () => {
    const browser = await puppeteer.launch({ headless: false });
    console.log("Browser opened");
    const page = await browser.newPage();
    const url =
      "https://vn.noxinfluencer.com/youtube-channel-rank/top-100-vn-all-youtuber-sorted-by-subs-weekly";
    await page.goto(url, { waitUntil: "domcontentloaded" });
    console.log("Page loaded");
    await page.setViewport({ width: 1920, height: 1080 });

    await page.evaluate(async () => {
      // wait scroll to bottom of the page to get full data
      await new Promise((resolve, reject) => {
        var totalHeight = 0;
        var distance = 100;
        var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // start scraping data
    const channel = await page.evaluate(() => {
      let ranks = [];
      for (let i = 0; i < 100; i++) {
        ranks[i] = i + 1;
      }

      let avatars = document.querySelectorAll(
        "#rank-table-body > tr > td.profile > a > img"
      );
      avatars = [...avatars].slice(0, 100);

      let channelTitles = document.querySelectorAll(
        "#rank-table-body > tr > td.profile > a > span"
      );
      channelTitles = [...channelTitles].slice(0, 100);

      let links = document.querySelectorAll(
        "#rank-table-body > tr > td.profile > a"
      );
      links = [...links].slice(0, 100);

      let categories = document.querySelectorAll(
        "#rank-table-body > tr > td.text.category"
      );
      categories = [...categories].slice(0, 100);

      let subscribes = document.querySelectorAll(
        "#rank-table-body > tr > td.text.followerNum.with-num > span.num"
      );
      subscribes = [...subscribes].slice(0, 100);

      let avgViews = document.querySelectorAll(
        "#rank-table-body > tr > td.text.avgView.with-num > span.num"
      );
      avgViews = [...avgViews].slice(0, 100);

      let channel = avatars.map((avatar) => ({
        src: avatar.getAttribute("src"),
      }));

      for (var i = 0; i < channel.length; i++) {
        channel[i].rank = ranks[i];
        channel[i].link = `https://www.youtube.com/${links[i]
          .getAttribute("href")
          .replace("/youtube/", "")}`;
        channel[i].title = channelTitles[i].title;
        channel[i].category = categories[i].title;
        channel[i].subscribe = subscribes[i].textContent;
        channel[i].avgView = avgViews[i].textContent;
      }

      return channel;
    });

    res.render("trend", { videos: channel });

    await browser.close();

    console.log(channel.length);
    channel.forEach((item) => {
      // write to MongoDB (only when don't have that channel yet (compare channel title))
      topChannels.findOne({ title: item.title }).then((channel) => {
        if (!channel) {
          topChannels.create(item);
        }
      });
    });
  })();
});

module.exports = route;
