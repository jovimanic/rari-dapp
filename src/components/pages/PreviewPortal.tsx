import React, { useState } from "react";
import {
  Image,
  Flex,
  Box,
  Stack,
  Text,
  Heading,
  Spinner,
} from "@chakra-ui/core";
import { useWeb3 } from "../../context/Web3Context";
import ReactFrappeChart from "react-frappe-charts";
import WideLogo from "../../assets/wide-logo.png";

const PreviewPortal = () => {
  const [loading, setLoading] = useState(false);

  const { login } = useWeb3();

  const onRequestConnect = () => {
    setLoading(true);
    login()
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  };

  return (
    <Flex
      width="100%"
      flexDirection="column"
      alignItems="flex-start"
      p={6}
      color="#FFFFFF"
    >
      <Box w="200px" h="53px" mb={4}>
        <Image src={WideLogo} />
      </Box>

      <Flex
        width="100%"
        height={{ md: "500px", xs: "auto" }}
        flexDirection={{ md: "row", xs: "column" }}
      >
        <Box
          width={{ md: "20%", xs: "100%" }}
          height="100%"
          backgroundColor="#121212"
          borderRadius="10px"
          border="1px"
          borderColor="#272727"
        >
          <Stack
            width="100%"
            height="100%"
            justifyContent="space-around"
            alignItems="center"
            p={4}
          >
            <Stack spacing={1} justifyContent="center" alignItems="center">
              <Heading textAlign="center">14.2%</Heading>
              <Text
                textTransform="uppercase"
                textAlign="center"
                letterSpacing="wide"
                fontSize="xs"
              >
                Today's APR
              </Text>
            </Stack>
            <Stack spacing={1} justifyContent="center" alignItems="center">
              <Heading textAlign="center">13.3%</Heading>
              <Text
                textTransform="uppercase"
                textAlign="center"
                letterSpacing="wide"
                fontSize="xs"
              >
                Yearly APR
              </Text>
            </Stack>
            <Stack spacing={1} justifyContent="center" alignItems="center">
              <Heading textAlign="center">$10.2m</Heading>
              <Text
                textTransform="uppercase"
                textAlign="center"
                letterSpacing="wide"
                fontSize="xs"
              >
                Assets under management
              </Text>
            </Stack>
          </Stack>
        </Box>
        <Flex
          ml={{ md: 4, xs: 0 }}
          mt={{ md: 0, xs: 4 }}
          mb={{ md: 0, xs: 4 }}
          flexDirection="column"
          width={{ md: "80%", xs: "100%" }}
        >
          <Box
            height={{ md: "90%", xs: "420px" }}
            backgroundColor="#121212"
            borderRadius="10px"
            border="1px"
            borderColor="#272727"
          >
            <ReactFrappeChart
              type="line"
              colors={["red", "green", "#FFFFFF"]}
              axisOptions={{
                xAxisMode: "tick",
                yAxisMode: "tick",
                xIsSeries: 1,
              }}
              height={420}
              lineOptions={{
                dotSize: 0,
                hideLine: 0,
                hideDots: 1,
                heatline: 0,
                regionFill: 0,
                areaFill: 0,
              }}
              data={{
                labels: [
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                  "Sun",
                  "Mon",
                  "Tue",
                ],

                datasets: [
                  {
                    name: "dYdX",
                    values: [18, 40, 30, 35, 8, 52, 17, 4, 9, 9],
                  },
                  {
                    name: "Compound",
                    values: [18, 9, 1, 2, 33, 44, 47, 14, 92, 91],
                  },

                  {
                    name: "Rari",
                    values: [90, 100, 120, 125, 126, 127, 128, 190, 200, 210],
                  },
                ],
              }}
            />
          </Box>

          <Flex mt={4} height="10%">
            <Box
              as="button"
              onClick={onRequestConnect}
              width="50%"
              height={{ md: "100%", xs: "40px" }}
              backgroundColor="#121212"
              borderRadius="10px"
              border="1px"
              borderColor="#272727"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
            >
              {loading ? (
                <Spinner />
              ) : (
                <Text textAlign="center" fontWeight="bold" fontSize="lg">
                  Connect Wallet
                </Text>
              )}
            </Box>

            <Box
              as="button"
              onClick={() =>
                window.open(
                  "https://metamask.zendesk.com/hc/en-us/articles/360015489531-Getting-Started-With-MetaMask-Part-1"
                )
              }
              width="50%"
              height={{ md: "100%", xs: "40px" }}
              ml={4}
              backgroundColor="#121212"
              borderRadius="10px"
              border="1px"
              borderColor="#272727"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
            >
              <Text fontWeight="bold" fontSize="lg" textAlign="center">
                Get Wallet
              </Text>
            </Box>
          </Flex>
        </Flex>
      </Flex>
      <Text textAlign="center" width="100%" my={8}>
        © {new Date().getFullYear()} Rari Capital. All rights reserved.
      </Text>
    </Flex>
  );
};

export default PreviewPortal;
