import React, { useMemo } from 'react';
import {
    Avatar,
    Box,
    Text,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    LinkBox,
    Spinner
} from '@chakra-ui/react';
import { Link as RouterLink } from "react-router-dom";
import { Row, Column } from 'buttered-chakra';
import { motion } from 'framer-motion'


// Hooks
import { useFusePools } from 'hooks/fuse/useFusePools';
import { useFusePoolsData } from 'hooks/useFusePoolData';
import { useBorrowLimits } from 'hooks/useBorrowLimit';
import { useAssetsMapWithTokenData } from 'hooks/useAssetsMap';


import { USDPricedFuseAsset } from "utils/fetchFusePoolData";
import { TokenData, useTokensData } from 'hooks/useTokenData';
import { TokensDataHash } from 'utils/tokenUtils';
import { convertMantissaToAPR, convertMantissaToAPY } from 'utils/apyUtils';
import { shortUsdFormatter, smallUsdFormatter } from 'utils/bigUtils';
import { SimpleTooltip } from 'components/shared/SimpleTooltip';

export enum AssetContainerType {
    SUPPLY,
    BORROW,
    RATES
}

const Fuse = () => {

    // Todo - write useFusePoolsData
    const { filteredPools } = useFusePools('my-pools')

    const poolIds: number[] = filteredPools?.map(({ id }) => id) ?? []

    const fusePoolsData: any[] | null = useFusePoolsData(poolIds)

    const assetsArray: USDPricedFuseAsset[][] | null = fusePoolsData?.map((pool) => pool?.assets) ?? null
    const maxBorrows = useBorrowLimits(assetsArray)
    const { tokensDataMap }: { tokensDataMap: TokensDataHash } = useAssetsMapWithTokenData(assetsArray)


    const { totalBorrowBalanceUSD } = useMemo(() => {
        return fusePoolsData?.reduce((a, b) => {
            return { totalBorrowBalanceUSD: a.totalBorrowBalanceUSD + b.totalBorrowBalanceUSD }
        }) ?? { totalBorrowBalanceUSD: null }
    }, [fusePoolsData])

    const { totalSupplyBalanceUSD } = useMemo(() => {
        return fusePoolsData?.reduce((a, b) => {
            return { totalSupplyBalanceUSD: a.totalSupplyBalanceUSD + b.totalSupplyBalanceUSD }
        }) ?? { totalSupplyBalanceUSD: null }
    }, [fusePoolsData])

    const hasDeposits = useMemo(() => totalSupplyBalanceUSD > 0, [totalSupplyBalanceUSD])

    return (
        <motion.div
            key="fuse"
            style={{ width: '100%' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Table variant="simple">
                <Thead color="white">
                    <Tr>
                        <Th textAlign="center" color="white" fontSize="sm">Pool</Th>
                        <Th textAlign="right" color="white" fontSize="sm">Borrow Limit</Th>
                        <Th textAlign="right" color="white" fontSize="sm">Deposits</Th>
                        <Th textAlign="right" color="white" fontSize="sm">Borrows</Th>
                        <Th textAlign="right" textAlign="right" color="white" fontSize="sm">Lend APY / Borrow APR</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {filteredPools?.map((filteredPool, index) => {
                        const fusePoolData = fusePoolsData?.[index]
                        const maxBorrow = maxBorrows?.[index]

                        const ratio = fusePoolData?.totalBorrowBalanceUSD && maxBorrow
                            ? (fusePoolData.totalBorrowBalanceUSD / maxBorrow) * 100
                            : 0

                        const isAtRiskOfLiquidation = ratio && ratio > 95

                        return (
                                <Tr>
                                    <Td textAlign="center" fontSize="large">{filteredPool.id}</Td>
                                    {/* Borrow limit */}
                                    <Td textAlign="right" textStyle="bold" color={isAtRiskOfLiquidation && 'red'} fontSize="large" fontWeight="bold">
                                        {!!ratio
                                            ? `${ratio.toFixed(1)}%`
                                            : '0%'
                                        }
                                    </Td>
                                    {/* Deposits By Asset */}
                                    {/* Lend Balance */}
                                    <Td>
                                        {
                                            fusePoolData?.assets.map((asset: USDPricedFuseAsset) =>
                                                (asset.supplyBalanceUSD > 0) &&
                                                <Box mt={2} >
                                                    <AssetContainer
                                                        asset={asset}
                                                        tokenData={tokensDataMap[asset.underlyingToken]}
                                                    />
                                                </Box>
                                            )}
                                    </Td>
                                    {/* Borrow Balance */}
                                    <Td>
                                        {
                                            fusePoolData?.assets.map((asset: USDPricedFuseAsset) =>
                                                (asset.borrowBalanceUSD > 0) &&
                                                <Box mt={2} >
                                                    <AssetContainer
                                                        asset={asset}
                                                        type={AssetContainerType.BORROW}
                                                        tokenData={tokensDataMap[asset.underlyingToken]}
                                                    />
                                                </Box>

                                            )}
                                    </Td>
                                    {/* Lend Borrow rates */}
                                    <Td>
                                        {
                                            fusePoolData?.assets.map((asset: USDPricedFuseAsset) =>
                                                (asset.supplyBalanceUSD > 0 || asset.borrowBalanceUSD > 0) &&
                                                <Box mt={4}>
                                                    <AssetContainer
                                                        asset={asset}
                                                        type={AssetContainerType.RATES}
                                                        tokenData={tokensDataMap[asset.underlyingToken]}
                                                    />
                                                </Box>
                                            )}
                                    </Td>
                                </Tr>
                        )
                    }
                    )}
                    {/* Totals */}
                    <Tr>
                        <Td><Text fontWeight={hasDeposits && "bold"}>Total</Text></Td>
                        <Td></Td>
                        <Td textAlign="right"><Text fontWeight={hasDeposits && "bold"}>{smallUsdFormatter(totalSupplyBalanceUSD)}</Text></Td>
                        <Td textAlign="right"><Text fontWeight={hasDeposits && "bold"}>-{smallUsdFormatter(totalBorrowBalanceUSD)}</Text></Td>
                        <Td></Td>
                    </Tr>
                </Tbody>
            </Table>
        </motion.div>
    );
};



const AssetContainer = ({ asset, type = AssetContainerType.SUPPLY, tokenData }: { asset: USDPricedFuseAsset, type: string, tokenData: TokenData }) => {

    const supplyAmount = asset.supplyBalance / (10 ** asset.underlyingDecimals)
    const borrowAmount = asset.borrowBalance / (10 ** asset.underlyingDecimals)
    const formattedSupplyAmount = supplyAmount.toFixed(2) + ` ${asset.underlyingSymbol}`
    const formattedBorrowAmount = borrowAmount.toFixed(2) + ` ${asset.underlyingSymbol}`
    const supplyBalanceUSD = shortUsdFormatter(asset.supplyBalanceUSD)
    const borrowBalanceUSD = shortUsdFormatter(asset.borrowBalanceUSD)

    const borrowRate = convertMantissaToAPR(asset.borrowRatePerBlock).toFixed(2)
    const supplyRate = convertMantissaToAPY(asset.supplyRatePerBlock, 365).toFixed(2)

    // console.log(asset.underlyingSymbol, { supplyAmount, borrowAmount })

    return (

        <>
            <Column
                mainAxisAlignment={type === AssetContainerType.RATES ? "space-around" : "center"}
                crossAxisAlignment="flex-end"
            // background="lime"
            >
                {/* Icon and Units */}
                <Row
                    mainAxisAlignment="flex-end"
                    crossAxisAlignment="center"
                    width="90%"
                // pl={6}
                >
                    <Avatar
                        bg="#FFF"
                        boxSize="30px"
                        name={tokenData?.symbol ?? "Loading..."}
                        my="auto"
                        mr="auto"
                        src={
                            tokenData?.logoURL ??
                            "https://raw.githubusercontent.com/feathericons/feather/master/icons/help-circle.svg"
                        }
                    />
                    {/* Lend/borrow Supply */}
                    {type !== AssetContainerType.RATES && (
                        <>
                            <SimpleTooltip label={`${type === AssetContainerType.BORROW ? borrowAmount : supplyAmount} ${asset.underlyingSymbol}`}>
                                <Text p={1} fontSize="lg" textAlign="right">
                                    {type === AssetContainerType.BORROW ? formattedBorrowAmount : formattedSupplyAmount}
                                </Text>
                            </SimpleTooltip>
                        </>
                    )}
                    {/* Lend/borrow rates */}
                    {
                        type === AssetContainerType.RATES && (
                            <Row>
                                <Text p={1} fontSize="lg" >
                                    {supplyRate}%
                            </Text>
                                <Text p={1} fontSize="2xl"  >
                                    /
                            </Text>
                                <Text p={1} fontSize="lg" >
                                    {borrowRate}%
                            </Text>
                            </Row>
                        )
                    }
                </Row>
                {/* USD Denomination */}
                <Row
                    mainAxisAlignment="flex-end"
                    crossAxisAlignment="center"
                    width="100%"
                >
                    {type !== AssetContainerType.RATES && (
                        <Text p={1} fontSize="sm" color="grey">
                            {type === AssetContainerType.BORROW ? borrowBalanceUSD : supplyBalanceUSD}
                        </Text>
                    )}
                    {type === AssetContainerType.RATES && (
                        <Text p={1} fontSize="sm" color="black" visibility="hidden">
                            Shhh
                        </Text>
                    )}
                </Row>
            </Column>
        </>
    )
}

export default Fuse
