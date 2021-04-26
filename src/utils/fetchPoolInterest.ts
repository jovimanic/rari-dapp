import Rari from "rari-sdk/index";
import { stringUsdFormatter } from "utils/bigUtils";

export const fetchPoolInterestEarned = async (rari: Rari, address: string) => {

  const [
    stableInterest,
    yieldInterest,
    ethInterestInETH,
    ethPriceBN,
  ] = await Promise.all([
    rari.pools.stable.balances.interestAccruedBy(address),
    rari.pools.yield.balances.interestAccruedBy(address),
    rari.pools.ethereum.balances.interestAccruedBy(address),
    rari.getEthUsdPriceBN(),
  ]);

  console.log(
    'interest',
    rari.web3.utils.fromWei(stableInterest),
    rari.web3.utils.fromWei(yieldInterest),
    rari.web3.utils.fromWei(ethInterestInETH),
    rari.web3.utils.fromWei(ethPriceBN),
  )

  const ethInterest = ethInterestInETH.mul(
    ethPriceBN.div(rari.web3.utils.toBN(1e18))
  );

  return {
    totalFormattedEarnings: stringUsdFormatter(
      rari.web3.utils.fromWei(
        stableInterest.add(yieldInterest).add(ethInterest)
      )
    ),
    totalEarnings: stableInterest.add(yieldInterest).add(ethInterest),
    yieldPoolInterestEarned: yieldInterest,
    stablePoolInterestEarned: stableInterest,
    ethPoolInterestEarned: ethInterest,
  };
}
