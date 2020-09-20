var mongoose = require("mongoose");

var youtubeChannel = new mongoose.Schema({
  // define collection attribute in MongoDB
  rank: Number,
  link: String,
  title: String,
  category: String,
  subscribe: String,
  avgView: String,
});

module.exports = mongoose.model("Channel", youtubeChannel, "top-channels");
