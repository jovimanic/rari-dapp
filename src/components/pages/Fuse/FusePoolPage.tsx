import {
  Avatar,
  Heading,
  Progress,
  Spinner,
  Switch,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Column, Center, Row, RowOrColumn } from "buttered-chakra";
import LogRocket from "logrocket";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryCache } from "react-query";
import { useParams } from "react-router-dom";
import { useRari } from "../../../context/RariContext";
import { useBorrowLimit } from "../../../hooks/useBorrowLimit";
import { useFusePoolData } from "../../../hooks/useFusePoolData";
import { useIsSemiSmallScreen } from "../../../hooks/useIsSemiSmallScreen";
import { useTokenData } from "../../../hooks/useTokenData";
import { shortUsdFormatter, smallUsdFormatter } from "../../../utils/bigUtils";
import { createComptroller } from "../../../utils/createComptroller";
import { USDPricedFuseAsset } from "../../../utils/fetchFusePoolData";
import CopyrightSpacer from "../../shared/CopyrightSpacer";
import DashboardBox from "../../shared/DashboardBox";
import ForceAuthModal from "../../shared/ForceAuthModal";
import { Header } from "../../shared/Header";
import { ModalDivider } from "../../shared/Modal";
import { SimpleTooltip } from "../../shared/SimpleTooltip";

import FuseStatsBar from "./FuseStatsBar";
import FuseTabBar from "./FuseTabBar";
import PoolModal, { Mode } from "./Modals/PoolModal";

const FusePoolPage = React.memo(() => {
  const { isAuthed } = useRari();

  const isMobile = useIsSemiSmallScreen();

  let { poolId } = useParams();

  const data = useFusePoolData(poolId);

  return (
    <>
      <ForceAuthModal />

      <Column
        mainAxisAlignment="flex-start"
        crossAxisAlignment="center"
        color="#FFFFFF"
        mx="auto"
        width={isMobile ? "100%" : "1150px"}
        px={isMobile ? 4 : 0}
      >
        <Header isAuthed={isAuthed} isFuse />

        <FuseStatsBar />

        <FuseTabBar />

        {data?.totalBorrowBalanceUSD ? (
          <CollateralRatioBar
            assets={data.assets}
            borrowUSD={data.totalBorrowBalanceUSD}
          />
        ) : null}

        <RowOrColumn
          width="100%"
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-start"
          mt={4}
          isRow={!isMobile}
        >
          <DashboardBox width={isMobile ? "100%" : "50%"}>
            {data ? (
              <SupplyList
                assets={data.assets}
                comptrollerAddress={data.comptroller}
                supplyBalanceUSD={data.totalSupplyBalanceUSD}
              />
            ) : (
              <Center height="200px">
                <Spinner />
              </Center>
            )}
          </DashboardBox>

          <DashboardBox
            ml={isMobile ? 0 : 4}
            mt={isMobile ? 4 : 0}
            width={isMobile ? "100%" : "50%"}
          >
            {data ? (
              <BorrowList
                comptrollerAddress={data.comptroller}
                assets={data.assets}
                borrowBalanceUSD={data.totalBorrowBalanceUSD}
              />
            ) : (
              <Center height="200px">
                <Spinner />
              </Center>
            )}
          </DashboardBox>
        </RowOrColumn>
      </Column>

      <CopyrightSpacer forceShow />
    </>
  );
});

export default FusePoolPage;

const CollateralRatioBar = ({
  assets,
  borrowUSD,
}: {
  assets: USDPricedFuseAsset[];
  borrowUSD: number;
}) => {
  const { t } = useTranslation();

  const maxBorrow = useBorrowLimit(assets);

  const ratio = (borrowUSD / maxBorrow) * 100;

  useEffect(() => {
    if (ratio > 95) {
      LogRocket.track("Fuse-AtRiskOfLiquidation");
    }
  }, [ratio]);

  return (
    <DashboardBox width="100%" height="65px" mt={4} p={4}>
      <Row mainAxisAlignment="flex-start" crossAxisAlignment="center" expand>
        <SimpleTooltip
          label={t("Keep this bar from filling up to avoid being liquidated!")}
        >
          <Text flexShrink={0} mr={4}>
            {t("Borrow Limit")}
          </Text>
        </SimpleTooltip>

        <Text flexShrink={0} mt="2px" mr={3} fontSize="10px">
          0%
        </Text>

        <Progress
          size="xs"
          width="100%"
          colorScheme={
            ratio <= 40
              ? "whatsapp"
              : ratio <= 60
              ? "yellow"
              : ratio <= 80
              ? "orange"
              : "red"
          }
          borderRadius="10px"
          value={ratio}
        />

        <SimpleTooltip
          label={t(
            "If your borrow amount reaches this value, you will be liquidated."
          )}
        >
          <Text flexShrink={0} mt="2px" ml={3} fontSize="10px">
            {smallUsdFormatter(maxBorrow)}
          </Text>
        </SimpleTooltip>
      </Row>
    </DashboardBox>
  );
};

const SupplyList = ({
  assets,
  supplyBalanceUSD,
  comptrollerAddress,
}: {
  assets: USDPricedFuseAsset[];
  supplyBalanceUSD: number;
  comptrollerAddress: string;
}) => {
  const { t } = useTranslation();

  const suppliedAssets = assets.filter((asset) => asset.supplyBalanceUSD > 1);
  const nonSuppliedAssets = assets.filter(
    (asset) => asset.supplyBalanceUSD < 1
  );

  return (
    <Column
      mainAxisAlignment="flex-start"
      crossAxisAlignment="flex-start"
      height="100%"
      pb={1}
    >
      <Heading size="md" px={4} py={3}>
        {t("Supply Balance:")} {smallUsdFormatter(supplyBalanceUSD)}
      </Heading>
      <ModalDivider />

      {assets.length > 0 ? (
        <Row
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-start"
          width="100%"
          px={4}
          mt={4}
        >
          <Text width="27%" fontWeight="bold" pl={1}>
            {t("Asset")}
          </Text>

          <Text width="27%" fontWeight="bold" textAlign="right">
            {t("APY/WPY")}
          </Text>

          <Text width="27%" fontWeight="bold" textAlign="right">
            {t("Balance")}
          </Text>

          <Text width="20%" fontWeight="bold" textAlign="right">
            {t("Collateral")}
          </Text>
        </Row>
      ) : null}

      <Column
        mainAxisAlignment="flex-start"
        crossAxisAlignment="flex-start"
        expand
        mt={1}
      >
        {assets.length > 0 ? (
          <>
            {suppliedAssets.map((asset, index) => {
              return (
                <AssetSupplyRow
                  comptrollerAddress={comptrollerAddress}
                  key={asset.underlyingToken}
                  assets={suppliedAssets}
                  index={index}
                />
              );
            })}

            {suppliedAssets.length > 0 ? <ModalDivider my={2} /> : null}

            {nonSuppliedAssets.map((asset, index) => {
              return (
                <AssetSupplyRow
                  comptrollerAddress={comptrollerAddress}
                  key={asset.underlyingToken}
                  assets={nonSuppliedAssets}
                  index={index}
                />
              );
            })}
          </>
        ) : (
          <Center expand my={8}>
            {t("There are no assets in this pool.")}
          </Center>
        )}
      </Column>
    </Column>
  );
};

const AssetSupplyRow = ({
  assets,
  index,
  comptrollerAddress,
}: {
  assets: USDPricedFuseAsset[];
  index: number;
  comptrollerAddress: string;
}) => {
  const {
    isOpen: isModalOpen,
    onOpen: openModal,
    onClose: closeModal,
  } = useDisclosure();

  const asset = assets[index];

  const { fuse, address } = useRari();

  const tokenData = useTokenData(asset.underlyingToken);

  const supplyAPY =
    (Math.pow((asset.supplyRatePerBlock / 1e18) * (4 * 60 * 24) + 1, 365) - 1) *
    100;
  const supplyWPY =
    (Math.pow((asset.supplyRatePerBlock / 1e18) * (4 * 60 * 24) + 1, 7) - 1) *
    100;

  const queryCache = useQueryCache();

  const toast = useToast();

  const onToggleCollateral = async () => {
    const comptroller = createComptroller(comptrollerAddress, fuse);

    let call;
    if (asset.membership) {
      call = comptroller.methods.exitMarket(asset.cToken);
    } else {
      call = comptroller.methods.enterMarkets([asset.cToken]);
    }

    let response = await call.call({ from: address });
    // For some reason `response` will be `["0"]` if no error but otherwise it will return a string number.
    if (response[0] !== "0") {
      if (asset.membership) {
        toast({
          title: "Error! Code: " + response,
          description:
            "You cannot disable this asset as collateral as you would not have enough collateral posted to keep your borrow. Try adding more collateral of another type or paying back some of your debt.",
          status: "error",
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      } else {
        toast({
          title: "Error! Code: " + response,
          description:
            "You cannot enable this asset as collateral at this time.",
          status: "error",
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      }

      return;
    }

    await call.send({ from: address });

    LogRocket.track("Fuse-ToggleCollateral");

    queryCache.refetchQueries();
  };

  return (
    <>
      <PoolModal
        defaultMode={Mode.SUPPLY}
        comptrollerAddress={comptrollerAddress}
        assets={assets}
        index={index}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      <Row
        mainAxisAlignment="flex-start"
        crossAxisAlignment="center"
        width="100%"
        px={4}
        py={1.5}
        className="hover-row"
      >
        <Row
          mainAxisAlignment="flex-start"
          crossAxisAlignment="center"
          width="27%"
          as="button"
          onClick={openModal}
        >
          <Avatar
            bg="#FFF"
            boxSize="37px"
            name={tokenData?.symbol ?? "Loading..."}
            src={
              tokenData?.logoURL ??
              "https://raw.githubusercontent.com/feathericons/feather/master/icons/help-circle.svg"
            }
          />
          <Text fontWeight="bold" fontSize="lg" ml={2} flexShrink={0}>
            {asset.underlyingSymbol}
          </Text>
        </Row>

        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-end"
          width="27%"
          as="button"
          onClick={openModal}
        >
          <Text
            color={tokenData?.color ?? "#FF"}
            fontWeight="bold"
            fontSize="17px"
          >
            {supplyAPY.toFixed(3)}%
          </Text>

          <Text fontSize="sm">{supplyWPY.toFixed(3)}%</Text>
        </Column>

        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-end"
          width="27%"
          as="button"
          onClick={openModal}
        >
          <Text
            color={tokenData?.color ?? "#FFF"}
            fontWeight="bold"
            fontSize="17px"
          >
            {smallUsdFormatter(asset.supplyBalanceUSD)}
          </Text>

          <Text fontSize="sm">
            {smallUsdFormatter(
              asset.supplyBalance / 10 ** asset.underlyingDecimals
            ).replace("$", "")}{" "}
            {asset.underlyingSymbol}
          </Text>
        </Column>

        <Row
          width="20%"
          mainAxisAlignment="flex-end"
          crossAxisAlignment="center"
        >
          <style>
            {`  
            
            .${
              asset.underlyingSymbol + "-switch"
            } > .chakra-switch__track[data-checked] {
              background-color: ${
                tokenData?.color
                  ? tokenData.color === "#FFFFFF"
                    ? "#282727"
                    : tokenData.color
                  : "#282727"
              } !important;
            }
            .${asset.underlyingSymbol + "-switch"} .chakra-switch__input {
              /* Fixes a bug in the FusePoolPage with the switches creating bottom padding */
              position: static !important;
              height: 0px !important;
              width: 0px !important;
            }

            `}
          </style>
          <Switch
            isChecked={asset.membership}
            className={asset.underlyingSymbol + "-switch"}
            onChange={onToggleCollateral}
            size="md"
            mt={1}
            mr={5}
          />
        </Row>
      </Row>
    </>
  );
};

const BorrowList = ({
  assets,
  borrowBalanceUSD,
  comptrollerAddress,
}: {
  assets: USDPricedFuseAsset[];
  borrowBalanceUSD: number;
  comptrollerAddress: string;
}) => {
  const { t } = useTranslation();
  const borrowedAssets = assets.filter((asset) => asset.borrowBalanceUSD > 1);
  const nonBorrowedAssets = assets.filter(
    (asset) => asset.borrowBalanceUSD < 1
  );

  return (
    <Column
      mainAxisAlignment="flex-start"
      crossAxisAlignment="flex-start"
      height="100%"
      pb={1}
    >
      <Heading size="md" px={4} py={3}>
        {t("Borrow Balance:")} {smallUsdFormatter(borrowBalanceUSD)}
      </Heading>
      <ModalDivider />

      {assets.length > 0 ? (
        <Row
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-start"
          width="100%"
          px={4}
          mt={4}
        >
          <Text width="27%" fontWeight="bold" pl={1}>
            {t("Asset")}
          </Text>

          <Text width="27%" fontWeight="bold" textAlign="right">
            {t("APY/WPY")}
          </Text>

          <Text width="27%" fontWeight="bold" textAlign="right">
            {t("Balance")}
          </Text>

          <Text width="20%" fontWeight="bold" textAlign="right">
            {t("Liquidity")}
          </Text>
        </Row>
      ) : null}

      <Column
        mainAxisAlignment="flex-start"
        crossAxisAlignment="flex-start"
        expand
        mt={1}
      >
        {assets.length > 0 ? (
          <>
            {borrowedAssets.map((asset, index) => {
              return (
                <AssetBorrowRow
                  comptrollerAddress={comptrollerAddress}
                  key={asset.underlyingToken}
                  assets={borrowedAssets}
                  index={index}
                />
              );
            })}

            {borrowedAssets.length > 0 ? <ModalDivider my={2} /> : null}

            {nonBorrowedAssets.map((asset, index) => {
              return (
                <AssetBorrowRow
                  comptrollerAddress={comptrollerAddress}
                  key={asset.underlyingToken}
                  assets={nonBorrowedAssets}
                  index={index}
                />
              );
            })}
          </>
        ) : (
          <Center expand my={8}>
            {t("There are no assets in this pool.")}
          </Center>
        )}
      </Column>
    </Column>
  );
};

const AssetBorrowRow = ({
  assets,
  index,
  comptrollerAddress,
}: {
  assets: USDPricedFuseAsset[];
  index: number;
  comptrollerAddress: string;
}) => {
  const asset = assets[index];

  const {
    isOpen: isModalOpen,
    onOpen: openModal,
    onClose: closeModal,
  } = useDisclosure();

  const tokenData = useTokenData(asset.underlyingToken);

  const borrowAPY =
    (Math.pow((asset.borrowRatePerBlock / 1e18) * (4 * 60 * 24) + 1, 365) - 1) *
    100;
  const borrowWPY =
    (Math.pow((asset.borrowRatePerBlock / 1e18) * (4 * 60 * 24) + 1, 7) - 1) *
    100;

  return (
    <>
      <PoolModal
        comptrollerAddress={comptrollerAddress}
        defaultMode={Mode.BORROW}
        assets={assets}
        index={index}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      <Row
        mainAxisAlignment="flex-start"
        crossAxisAlignment="center"
        width="100%"
        px={4}
        py={1.5}
        className="hover-row"
        as="button"
        onClick={openModal}
      >
        <Row
          mainAxisAlignment="flex-start"
          crossAxisAlignment="center"
          width="27%"
        >
          <Avatar
            bg="#FFF"
            boxSize="37px"
            name={tokenData?.symbol ?? "Loading..."}
            src={
              tokenData?.logoURL ??
              "https://raw.githubusercontent.com/feathericons/feather/master/icons/help-circle.svg"
            }
          />
          <Text fontWeight="bold" fontSize="lg" ml={2} flexShrink={0}>
            {asset.underlyingSymbol}
          </Text>
        </Row>

        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-end"
          width="27%"
        >
          <Text
            color={tokenData?.color ?? "#FF"}
            fontWeight="bold"
            fontSize="17px"
          >
            {borrowAPY.toFixed(3)}%
          </Text>

          <Text fontSize="sm">{borrowWPY.toFixed(3)}%</Text>
        </Column>

        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-end"
          width="27%"
        >
          <Text
            color={tokenData?.color ?? "#FFF"}
            fontWeight="bold"
            fontSize="17px"
          >
            {smallUsdFormatter(asset.borrowBalanceUSD)}
          </Text>

          <Text fontSize="sm">
            {smallUsdFormatter(
              asset.borrowBalance / 10 ** asset.underlyingDecimals
            ).replace("$", "")}{" "}
            {asset.underlyingSymbol}
          </Text>
        </Column>

        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-end"
          width="20%"
        >
          <Text
            color={tokenData?.color ?? "#FFF"}
            fontWeight="bold"
            fontSize="17px"
          >
            {shortUsdFormatter(asset.liquidityUSD)}
          </Text>

          <Text fontSize="sm">
            {shortUsdFormatter(
              asset.liquidity / 10 ** asset.underlyingDecimals
            ).replace("$", "")}{" "}
            {asset.underlyingSymbol}
          </Text>
        </Column>
      </Row>
    </>
  );
};
