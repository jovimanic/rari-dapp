
import React from 'react'
import {
    Box,
    Tr,
    Td,
    Text
} from '@chakra-ui/react';
import { motion } from 'framer-motion'
import { smallStringUsdFormatter } from 'utils/bigUtils';
import { FuseLogoSVG } from 'components/shared/Logos'
import { SimpleTooltip } from "components/shared/SimpleTooltip";



const FuseRow = ({ filteredPoolsData, fusePoolsData }) => {

    return (
            <Tr>
                <Td textAlign="center">
                    <SimpleTooltip label="Fuse" placement="right">
                        <Box width="30px" >
                            <FuseLogoSVG width="26px" height="26px" />
                        </Box>
                    </SimpleTooltip>
                </Td>
                <Td>
                    {filteredPoolsData?.map(({ id }) => (
                        <Text mb={3} key={id}>{id}</Text>
                    ))}
                </Td>
                <Td >
                    {fusePoolsData?.map(({ comptroller, totalSupplyBalanceUSD }) => (
                        <Text mb={3} key={comptroller}>{smallStringUsdFormatter(totalSupplyBalanceUSD)}</Text>
                    ))}
                </Td>
                {/* Todo (sharad) - implement RGT earned in poolInfo */}
                <Td>
                    {filteredPoolsData?.map(({ id }) => (
                        <Text mb={3} key={id}>N/A</Text>
                    ))}
                </Td>
                <Td>
                    {filteredPoolsData?.map(({ id }) => (
                        <Text mb={3} key={id}>N/A</Text>
                    ))}
                </Td>
            </Tr>
    )
}

export default FuseRow
