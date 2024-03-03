require('dotenv').config();
const express = require("express");
const cors = require("cors");
// const dns = require("dns");
const urlparser = require("url");
const app = express();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// create a url schema

const urlSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  shorturl: {
    type: String
  }
});

const url = mongoose.model("url", urlSchema);

// Your first API endpoint
app.post('/api/shorturl', (req, res) => {
  // save the url to a variable urlString
  const urlString = req.body.url
  // function to test if the url is valid
  const isValidUrl = (urlString) => {
    try {
      new URL(urlString);
      return true;
    } catch (error) {
      return false;
    }
  }
  // if statement to verify if url is valid
  if (!isValidUrl(urlString)) {
    res.json({ error: 'invalid url' });
  } else {
    // save to db
    (async () => {
      try {
        const urlCount = await url.countDocuments({})
        const newUrl = new url({
          url: urlString,
          shorturl: urlCount
        });
        const result = await newUrl.save();
        console.log(result);
        const latestShortUrl = await url.findOne({}).sort({ _id: -1 }).select('shorturl');

        // Send the response with the original and short URL
        res.json({
          original_url: urlString,
          short_url: +latestShortUrl.shorturl
        });
      } catch (error) {
        console.log(error);
      }
    })();
  }
});
// get function to redirect to url
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = req.params.short_url
  const urlPath = await url.findOne({}).sort({ _id: -1 }).select('url');
  res.redirect(urlPath.url)
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
// export the module
module.exports = mongoose.model('url', urlSchema);