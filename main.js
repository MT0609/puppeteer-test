var express = require("express");
var app = express();
var port = 3000;
var trendingVideos = require("./routes/trending");

app.set("view engine", "pug");
app.set("views", "./views");

app.get("/", trendingVideos);

app.listen(port, () => {
  console.log("listening on port", port);
});
