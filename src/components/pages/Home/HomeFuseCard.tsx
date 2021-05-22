import React, { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import {
  AvatarGroup,
  Avatar,
  Box,
  Heading,
  Link,
  Text,
} from "@chakra-ui/react";
import {
  FusePoolData,
  USDPricedFuseAssetWithTokenData,
} from "utils/fetchFusePoolData";

import { motion } from "framer-motion";
import { HomepageFusePool, HOMEPAGE_FUSE_POOLS } from "constants/homepage";
import DashboardBox from "components/shared/DashboardBox";

const HomeFuseCard = ({ pool }: { pool: FusePoolData }) => {
  const { title, subtitle }: HomepageFusePool = useMemo(
    () => HOMEPAGE_FUSE_POOLS.find((p) => p.id === pool.id)!,
    [pool]
  );

  const assetsSubtitle = useMemo(() => {
    const NUM = 3;

    const symbols: string[] = [];

    pool.assets.forEach((a, i) => {
      const asset = a as USDPricedFuseAssetWithTokenData;
      const { symbol } = asset?.tokenData ?? {};
      if (i < NUM && symbol) symbols.push(symbol!);
    });

    let caption;
    if (pool.assets.length <= 3) {caption = symbols.join(", ")}
    else {
      caption = `${symbols.join(", ")}, and ${pool.assets.length - NUM} others`;
    }

    return caption;
  }, [pool]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
    >
      <Link
        to={`/fuse/pool/${pool.id}`}
        as={RouterLink}
        style={{ textDecoration: "none" }}
      >

        <DashboardBox
          height="125px"
          width="300px"
          ml={10}
          p={5}
          transition="transform 0.2s ease 0s"
          opacity={0.9}
          _hover={{
            // background: "grey",
            opacity: 1,
            transform: "translateY(-7px)",
            boxShadow: "0px .2px 4px grey;",
          }}
        >
          <AvatarGroup my={1} size="xs" max={3}>
            {pool.assets.slice(0, 3).map((asset) => {
              const _asset = asset as USDPricedFuseAssetWithTokenData;
              return (
                <Avatar
                  bg="#FFF"
                  borderWidth="1px"
                  name={"Loading..."}
                  src={_asset?.tokenData?.logoURL ?? undefined}
                  key={_asset.underlyingToken}
                />
              );
            })}
          </AvatarGroup>
          <Heading size="sm">{title ?? pool.name}</Heading>
          <Text size="xs" color="gray.500" fontWeight="bold">
            {subtitle ?? assetsSubtitle}
          </Text>
        </DashboardBox>
      </Link>
    </motion.div>
  );
};

export default HomeFuseCard;
