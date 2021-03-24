import { NowRequest, NowResponse } from "@vercel/node";

import Rari from "../src/rari-sdk/index";

import { infuraURL, initFuseWithProviders } from "../src/utils/web3Providers";

import { fetchTVL } from "../src/utils/fetchTVL";
import {
  fetchDAIPoolAPY,
  fetchPoolAPY,
  fetchRGTAPR,
} from "../src/utils/fetchPoolAPY";
import { Pool } from "../src/utils/poolUtils";

const rari = new Rari(infuraURL);
const fuse = initFuseWithProviders();

export default async (request: NowRequest, response: NowResponse) => {
  const [
    rawTVL,
    rawStablePoolAPY,
    rawYieldPoolAPY,
    rawEthPoolAPY,
    rawDaiPoolAPY,
    rawRgtAPR,
  ] = await Promise.all([
    fetchTVL(rari, fuse),
    fetchPoolAPY(rari, Pool.STABLE),
    fetchPoolAPY(rari, Pool.YIELD),
    fetchPoolAPY(rari, Pool.ETH),
    fetchDAIPoolAPY(rari),
    fetchRGTAPR(rari),
  ]);

  const tvl = parseFloat(rari.web3.utils.fromWei(rawTVL));

  const stablePoolAPY = parseFloat(rawStablePoolAPY);
  const yieldPoolAPY = parseFloat(rawYieldPoolAPY);
  const ethPoolAPY = parseFloat(rawEthPoolAPY);
  const daiPoolAPY = parseFloat(rawDaiPoolAPY);

  const rgtAPR = parseFloat(rawRgtAPR);

  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Cache-Control", "s-maxage=600");

  response.json({
    tvl,
    rgtAPR,
    stablePoolAPY,
    ethPoolAPY,
    yieldPoolAPY,
    daiPoolAPY,
  });
};
