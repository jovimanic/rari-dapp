
import React from 'react'
import {
    Box,
    Tr,
    Td,
    Text
} from '@chakra-ui/react';
import { Column } from 'buttered-chakra';
import { TranchesLogoSVG } from 'components/shared/Logos';
import { SimpleTooltip } from "components/shared/SimpleTooltip";


const TranchesRow = ({ estimatedSFI, daiSPrincipal, daiAPrincipal }) => {

    return (
        <Tr>
            <Td textAlign="center">
                <SimpleTooltip label="Tranches" placement="right">
                    <Box width="30px" >
                        <TranchesLogoSVG width="25px" height="25px" />
                    </Box>
                </SimpleTooltip>
            </Td>
            <Td>
                <Column mainAxisAlignment="center" crossAxisAlignment="flex-start">
                    <Box mb={3}>
                        <Text> DAI-S </Text>
                    </Box>
                    <Box mb={3}>
                        <Text> DAI-A </Text>
                    </Box>
                </Column>
            </Td>
            <Td >
                <Column mainAxisAlignment="center" crossAxisAlignment="flex-start">
                    <Box mb={3}>
                        <Text textAlign="left">  {daiSPrincipal} DAI </Text>
                    </Box>
                    <Box mb={3}>
                        <Text textAlign="left"> {daiAPrincipal} DAI </Text>
                    </Box>
                </Column>
            </Td>
            {/* Todo (sharad) - implement RGT earned in poolInfo */}
            <Td>
                <Column mainAxisAlignment="center" crossAxisAlignment="flex-start">
                    <Box mb={3}>
                        <Text textAlign="left">  {estimatedSFI?.formattedAPoolSFIEarned} </Text>
                    </Box>
                    <Box mb={3}>
                        <Text textAlign="left"> {estimatedSFI?.formattedSPoolSFIEarned}  </Text>
                    </Box>
                </Column>
            </Td>
            <Td>
                <Column mainAxisAlignment="center" crossAxisAlignment="flex-start">
                    <Box mb={3}>
                        <Text> N/A</Text>
                    </Box>
                </Column>
            </Td>
        </Tr>

    )
}

export default TranchesRow
