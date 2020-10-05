import { NowRequest, NowResponse } from "@vercel/node";

import Twitter from "twitter-lite";

export default async (request: NowRequest, response: NowResponse) => {
  const user = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  const timeline = await user.get("statuses/user_timeline", {
    screen_name: "RariCapitalNews",
    count: 3,
  });

  let tweets = [];

  timeline.forEach((tweet) => {
    tweets.push(tweet.text);
  });

  response.json(tweets);
};
