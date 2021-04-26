import React, { useMemo, useEffect } from 'react'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text
} from '@chakra-ui/react';

// Hooks
import { useAggregatePoolInfos } from 'hooks/usePoolInfo';
import { useFusePools } from 'hooks/fuse/useFusePools';
import { useFusePoolsData } from 'hooks/useFusePoolData';
import { usePool2APR } from 'hooks/pool2/usePool2APR';
import { usePool2UnclaimedRGT } from 'hooks/pool2/usePool2UnclaimedRGT';
import { usePool2Balance } from 'hooks/pool2/usePool2Balance';

// Components
import EarnRow from './EarnRow';
import FuseRow from './FuseRow'
import Pool2Row from './Pool2Row'
import { smallUsdFormatter } from 'utils/bigUtils';

const StatsTotalSection = ({ setNetDeposits, setNetDebt }) => {
  // Earn
  const { totals, aggregatePoolsInfo } = useAggregatePoolInfos()
  const hasDepositsInEarn = aggregatePoolsInfo?.some((p) => !p?.poolBalance?.isZero())

  // Fuse
  const { filteredPools: filteredFusePools } = useFusePools('my-pools')
  const poolIds: number[] = filteredFusePools?.map(({ id }) => id) ?? []
  const fusePoolsData: any[] | null = useFusePoolsData(poolIds)

  // Pool2
  const apr = usePool2APR()
  const earned = usePool2UnclaimedRGT()
  const balance = usePool2Balance()
  const hasDepositsInPool2 = !!balance?.SLP


  // Total Deposits
  const totalDepositsUSD = useMemo(() => {

    const { totalSupplyBalanceUSD: fuseTotal } = fusePoolsData?.reduce((a, b) => {
      return { totalSupplyBalanceUSD: a.totalSupplyBalanceUSD + b.totalSupplyBalanceUSD }
    }) ?? { totalSupplyBalanceUSD: 0 }

    const vaultTotal = totals?.balance ?? 0

    const pool2Total = balance?.balanceUSD

    return fuseTotal + vaultTotal + pool2Total

  }, [totals, fusePoolsData, balance])

  // Total debt - todo: refactor into the `useFusePoolsData` hook
  const totalDebtUSD = useMemo(() => {
    const { totalBorrowBalanceUSD } = fusePoolsData?.reduce((a, b) => {
      return { totalBorrowBalanceUSD: a.totalBorrowBalanceUSD + b.totalBorrowBalanceUSD }
    }) ?? { totalBorrowBalanceUSD: 0 }
    return totalBorrowBalanceUSD
  }, [fusePoolsData])

  useEffect(() => {
    setNetDeposits(totalDepositsUSD)
    setNetDebt(totalDebtUSD)
  }, [totalDepositsUSD, totalDebtUSD, setNetDeposits, setNetDebt])


  return (
    <>
      <Table variant="simple">
        <Thead color="white">
          <Tr>
            <Th color="white">Product</Th>
            <Th color="white">Pool</Th>
            <Th color="white">Deposits</Th>
            <Th color="white">RGT Earned</Th>
            <Th color="white">Interest Earned</Th>
          </Tr>
        </Thead>

        <Tbody>
          {/* Fuse section */}
          {fusePoolsData && <FuseRow fusePoolsData={fusePoolsData} filteredPoolsData={filteredFusePools} />}
          {/* earn section */}
          {hasDepositsInEarn && <EarnRow poolsInfo={aggregatePoolsInfo} />}
          {/* Pool2 Section */}
          {hasDepositsInPool2 && <Pool2Row apr={apr} earned={earned} balance={balance} />}
          {/* Todo (sharad) - implement totals for apy and growth */}
          <Tr>
            <Td>Total</Td>
            <Td></Td>
            <Td><Text fontWeight="bold">{smallUsdFormatter(totalDepositsUSD)}</Text></Td>
            <Td><Text fontWeight="bold">{earned} RGT</Text></Td>
            <Td><Text fontWeight="bold">{totals?.interestEarned}</Text></Td>
          </Tr>
        </Tbody>
      </Table>
    </>
  )
}

export default StatsTotalSection