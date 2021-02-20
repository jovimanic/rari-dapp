import React, { useState } from "react";
import { Row, Column } from "buttered-chakra";

import LogRocket from "logrocket";
import {
  Heading,
  Box,
  Button,
  Text,
  Image,
  Input,
  useToast,
  IconButton,
} from "@chakra-ui/react";
import SmallWhiteCircle from "../../../../../static/small-white-circle.png";

import BigNumber from "bignumber.js";

import { useQueryCache } from "react-query";

import { HashLoader } from "react-spinners";

import { useTranslation } from "react-i18next";
import { useRari } from "../../../../../context/RariContext";
import {
  fetchTokenBalance,
  useTokenBalance,
} from "../../../../../hooks/useTokenBalance";
import { BN, smallUsdFormatter } from "../../../../../utils/bigUtils";

import DashboardBox, {
  DASHBOARD_BOX_SPACING,
} from "../../../../shared/DashboardBox";
import { ModalDivider } from "../../../../shared/Modal";

import { Mode } from ".";
import { SettingsIcon } from "@chakra-ui/icons";
import { USDPricedFuseAsset } from "../../FusePoolPage";
import {
  ETH_TOKEN_DATA,
  useTokenData,
} from "../../../../../hooks/useTokenData";
import { useBorrowLimit } from "../../../../../hooks/useBorrowLimit";

interface Props {
  onClose: () => any;
  assets: USDPricedFuseAsset[];
  index: number;
  mode: Mode;
  openOptions: () => any;
}

enum UserAction {
  NO_ACTION,
  WAITING_FOR_TRANSACTIONS,
}

const AmountSelect = ({ onClose, assets, index, mode, openOptions }: Props) => {
  const asset = assets[index];

  const { rari, address, fuse } = useRari();

  const toast = useToast();

  const queryCache = useQueryCache();

  const tokenData = useTokenData(asset.underlyingToken);
  const { data: balance } = useTokenBalance(asset.underlyingToken);

  const [userAction, setUserAction] = useState(UserAction.NO_ACTION);

  const [userEnteredAmount, _setUserEnteredAmount] = useState("");

  const [amount, _setAmount] = useState<BigNumber | null>(
    () => new BigNumber(0)
  );

  const { t } = useTranslation();

  const updateAmount = (newAmount: string) => {
    if (newAmount.startsWith("-")) {
      return;
    }

    _setUserEnteredAmount(newAmount);

    try {
      BigNumber.DEBUG = true;

      // Try to set the amount to BigNumber(newAmount):
      const bigAmount = new BigNumber(newAmount);
      _setAmount(bigAmount.multipliedBy(10 ** asset.underlyingDecimals));

      console.log(
        "RE INFLATED",
        bigAmount
          .multipliedBy(10 ** asset.underlyingDecimals)
          .decimalPlaces(0)
          .toString()
      );
    } catch (e) {
      // If the number was invalid, set the amount to null to disable confirming:
      _setAmount(null);
    }

    setUserAction(UserAction.NO_ACTION);
  };

  const amountIsValid = (() => {
    if (amount === null || amount.isZero()) {
      return false;
    }

    if (!balance) {
      return false;
    }

    if (mode === Mode.SUPPLY) {
      return amount.lte(balance.toString());
    }

    if (mode === Mode.REPAY) {
      return amount.lte(balance.toString()) && amount.lte(asset.borrowBalance);
    }

    if (mode === Mode.BORROW) {
      // TODO: CALC BORROW LIMIT AND SUBTRACT BORROWED CURRENTLY THEN USE PRICE OF THIS TOKEN
      return true;
    }

    if (mode === Mode.WITHDRAW) {
      // TODO: HELP
      return true;
    }
  })();

  let depositOrWithdrawAlert;

  if (amount === null || amount.isZero()) {
    if (mode === Mode.SUPPLY) {
      depositOrWithdrawAlert = t("Enter a valid amount to supply.");
    } else if (mode === Mode.BORROW) {
      depositOrWithdrawAlert = t("Enter a valid amount to borrow.");
    } else if (mode === Mode.WITHDRAW) {
      depositOrWithdrawAlert = t("Enter a valid amount to withdraw.");
    } else {
      depositOrWithdrawAlert = t("Enter a valid amount to repay.");
    }
  } else if (!balance) {
    depositOrWithdrawAlert = t("Loading your balance of {{token}}...", {
      token: asset.underlyingSymbol,
    });
  } else if (!amountIsValid) {
    if (mode === Mode.SUPPLY) {
      depositOrWithdrawAlert = t("You don't have enough {{token}}.", {
        token: asset.underlyingSymbol,
      });
    } else if (mode === Mode.REPAY) {
      depositOrWithdrawAlert = t(
        "You don't have enough {{token}} or are trying to over-repay!",
        {
          token: asset.underlyingSymbol,
        }
      );
    } else if (mode === Mode.WITHDRAW) {
      depositOrWithdrawAlert = t(
        "You cannot withdraw this much; try repaying some debt."
      );
    } else if (mode === Mode.BORROW) {
      depositOrWithdrawAlert = t(
        "You cannot borrow this much; try supplying more collateral."
      );
    }
  } else {
    depositOrWithdrawAlert = t("Click confirm to continue!");
  }

  const onConfirm = async () => {
    try {
      setUserAction(UserAction.WAITING_FOR_TRANSACTIONS);

      //@ts-ignore
      const amountBN = rari.web3.utils.toBN(amount!.decimalPlaces(0));

      console.log("BN'D REINFLATED", amountBN.toString());

      const isETH = asset.underlyingToken === ETH_TOKEN_DATA.address;
      const cToken = new rari.web3.eth.Contract(
        isETH
          ? JSON.parse(
              fuse.compoundContracts[
                "contracts/CEtherDelegator.sol:CEtherDelegator"
              ].abi
            )
          : JSON.parse(
              fuse.compoundContracts[
                "contracts/EIP20Interface.sol:EIP20Interface"
              ]
            ),
        asset.cToken
      );

      // TODO: CHECK IF REVERTS BEFORE AND SHOW TOAST!

      if (mode === Mode.SUPPLY) {
        if (!isETH) {
          const token = new rari.web3.eth.Contract(
            JSON.parse(
              fuse.compoundContracts[
                "contracts/EIP20Interface.sol:EIP20Interface"
              ].abi
            ),
            asset.underlyingToken
          );

          await token.methods
            .approve(cToken.options.address, amountBN)
            .send({ from: address });
        }

        await (isETH
          ? cToken.methods.mint().send({ from: address, value: amountBN })
          : cToken.methods.mint(amountBN).send({ from: address }));
      } else if (mode === Mode.REPAY) {
        if (!isETH) {
          const token = new rari.web3.eth.Contract(
            JSON.parse(
              fuse.compoundContracts[
                "contracts/EIP20Interface.sol:EIP20Interface"
              ].abi
            ),
            asset.underlyingToken
          );

          await token.methods
            .approve(cToken.options.address, amountBN)
            .send({ from: address });
        }

        await (isETH
          ? cToken.methods
              .repayBorrow()
              .send({ from: address, value: amountBN })
          : cToken.methods.replayBorrow(amountBN).send({ from: address }));
      } else if (mode === Mode.BORROW) {
        await cToken.methods.borrow(amountBN).send({ from: address });
      } else if (mode === Mode.WITHDRAW) {
        await cToken.methods.redeemUnderlying(amountBN).send({ from: address });
      }

      await queryCache.refetchQueries();
      onClose();
    } catch (e) {
      let message: string;

      if (e instanceof Error) {
        message = e.toString();
        LogRocket.captureException(e);
      } else {
        message = JSON.stringify(e);
        LogRocket.captureException(new Error(message));
      }

      toast({
        title: "Error!",
        description: message,
        status: "error",
        duration: 9000,
        isClosable: true,
        position: "top-right",
      });

      setUserAction(UserAction.NO_ACTION);
    }
  };

  return userAction === UserAction.WAITING_FOR_TRANSACTIONS ? (
    <Column expand mainAxisAlignment="center" crossAxisAlignment="center" p={4}>
      <HashLoader size={70} color={tokenData?.color ?? "#FFF"} loading />
      <Heading mt="30px" textAlign="center" size="md">
        {t("Check your wallet to submit the transactions")}
      </Heading>
      <Text fontSize="sm" mt="15px" textAlign="center">
        {t("Do not close this tab until you submit all transactions!")}
      </Text>
    </Column>
  ) : (
    <>
      <Row
        width="100%"
        mainAxisAlignment="space-between"
        crossAxisAlignment="center"
        p={DASHBOARD_BOX_SPACING.asPxString()}
      >
        <Box width="40px" />
        <Heading fontSize="27px">
          {mode === Mode.SUPPLY
            ? t("Supply")
            : mode === Mode.BORROW
            ? t("Borrow")
            : mode === Mode.WITHDRAW
            ? t("Withdraw")
            : t("Repay")}
        </Heading>
        <IconButton
          color="#FFFFFF"
          variant="ghost"
          aria-label="Options"
          icon={<SettingsIcon />}
          _hover={{
            transform: "rotate(360deg)",
            transition: "all 0.7s ease-in-out",
          }}
          _active={{}}
          onClick={openOptions}
        />
      </Row>

      <ModalDivider />

      <Column
        mainAxisAlignment="space-between"
        crossAxisAlignment="center"
        p={DASHBOARD_BOX_SPACING.asPxString()}
        height="100%"
      >
        <Text fontWeight="bold" fontSize="sm" textAlign="center">
          {depositOrWithdrawAlert}
        </Text>

        <DashboardBox width="100%" height="70px" mt={4}>
          <Row
            p={DASHBOARD_BOX_SPACING.asPxString()}
            mainAxisAlignment="space-between"
            crossAxisAlignment="center"
            expand
          >
            <AmountInput
              color={tokenData?.color ?? "#FFF"}
              displayAmount={userEnteredAmount}
              updateAmount={updateAmount}
            />

            <TokenNameAndMaxButton
              mode={mode}
              logoURL={
                tokenData?.logoURL ??
                "https://raw.githubusercontent.com/feathericons/feather/master/icons/help-circle.svg"
              }
              symbol={asset.underlyingSymbol}
              asset={asset}
              updateAmount={updateAmount}
            />
          </Row>
        </DashboardBox>

        <StatsColumn
          color={tokenData?.color ?? "#FFF"}
          assets={assets}
          index={index}
          mode={mode}
        />

        <Button
          mt={4}
          fontWeight="bold"
          fontSize="2xl"
          borderRadius="10px"
          width="100%"
          height="70px"
          bg={tokenData?.color ?? "#FFF"}
          color={tokenData?.overlayTextColor ?? "#000"}
          _hover={{ transform: "scale(1.02)" }}
          _active={{ transform: "scale(0.95)" }}
          onClick={onConfirm}
          // isLoading={!poolTokenBalance}
          isDisabled={!amountIsValid}
        >
          {t("Confirm")}
        </Button>
      </Column>
    </>
  );
};

export default AmountSelect;

const StatsColumn = ({
  color,
  mode,
  assets,
  index,
}: {
  color: string;
  mode: Mode;
  assets: USDPricedFuseAsset[];
  index: number;
}) => {
  const { t } = useTranslation();

  const asset = assets[index];

  const supplyAPY = (asset.supplyRatePerBlock * 2372500) / 1e16;

  const borrowLimi = useBorrowLimit(assets);

  // TODO: SHOW AFTER ACTION STATS WITH ARROW LIKE ->

  return (
    <DashboardBox mt={4} width="100%" height="190px">
      <Column
        mainAxisAlignment="space-between"
        crossAxisAlignment="flex-start"
        expand
        py={3}
        px={4}
        fontSize="lg"
      >
        <Row
          mainAxisAlignment="space-between"
          crossAxisAlignment="center"
          width="100%"
          color={color}
        >
          <Text fontWeight="bold">{t("Supply Balance")}:</Text>
          <Text fontWeight="bold">
            {smallUsdFormatter(
              asset.supplyBalance / 10 ** asset.underlyingDecimals
            ).replace("$", "")}{" "}
            {asset.underlyingSymbol}
          </Text>
        </Row>

        <Row
          mainAxisAlignment="space-between"
          crossAxisAlignment="center"
          width="100%"
        >
          <Text fontWeight="bold">{t("Supply Rate")}:</Text>
          <Text fontWeight="bold">{supplyAPY.toFixed(3)}%</Text>
        </Row>

        <Row
          mainAxisAlignment="space-between"
          crossAxisAlignment="center"
          width="100%"
        >
          <Text fontWeight="bold">{t("Borrow Limit")}:</Text>
          <Text fontWeight="bold">{smallUsdFormatter(borrowLimi)}</Text>
        </Row>

        <Row
          mainAxisAlignment="space-between"
          crossAxisAlignment="center"
          width="100%"
        >
          <Text fontWeight="bold">{t("Borrow Limit Used")}:</Text>
          <Text fontWeight="bold">{smallUsdFormatter(asset.borrowUSD)}</Text>
        </Row>
      </Column>
    </DashboardBox>
  );
};

const TokenNameAndMaxButton = ({
  symbol,
  updateAmount,
  logoURL,
  asset,
  mode,
}: {
  symbol: string;
  logoURL: string;
  asset: USDPricedFuseAsset;
  mode: Mode;
  updateAmount: (newAmount: string) => any;
}) => {
  const { rari, address } = useRari();

  const [isMaxLoading, setIsMaxLoading] = useState(false);

  const setToMax = async () => {
    setIsMaxLoading(true);
    let maxBN: BN = {} as any;

    if (mode === Mode.SUPPLY) {
      const balance = await fetchTokenBalance(
        asset.underlyingToken,
        rari,
        address
      );

      maxBN = balance;
    }

    if (mode === Mode.REPAY) {
      const balance = await fetchTokenBalance(
        asset.underlyingToken,
        rari,
        address
      );
      const debt = rari.web3.utils.toBN(asset.borrowBalance);

      if (balance.gt(debt)) {
        maxBN = debt;
      } else {
        maxBN = balance;
      }

      // TODO: WHY DO I HAVE TO SEND TWO TXs to FULLY REPAY? IS INTEREST BEING ACCURED WHEN I SUBMIT THE FIRST REPAY? IS THERE A WAY TO FULL REPAY?
    }

    if (mode === Mode.BORROW) {
      // TODO: CALC BORROW LIMIT AND SUBTRACT BORROWED CURRENTLY THEN USE PRICE OF THIS TOKEN
      maxBN = rari.web3.utils.toBN(0);
    }

    if (mode === Mode.WITHDRAW) {
      // TODO: HELP
      maxBN = rari.web3.utils.toBN(0);
    }

    console.log("BORROW", asset.borrowBalance);
    console.log("MAX BN", maxBN.toString());
    if (maxBN.isNeg() || maxBN.isZero()) {
      updateAmount("0.0");
    } else {
      const str = new BigNumber(maxBN.toString())
        .div(10 ** asset.underlyingDecimals)
        .toFixed(18)
        // Remove trailing zeroes
        .replace(/\.?0+$/, "");

      console.log("DECIMAL VERSION", str);

      updateAmount(str);
    }

    setIsMaxLoading(false);
  };

  const { t } = useTranslation();

  return (
    <Row mainAxisAlignment="flex-start" crossAxisAlignment="center">
      <Row mainAxisAlignment="flex-start" crossAxisAlignment="center">
        <Box height="25px" width="25px" mb="2px" mr={2}>
          <Image
            width="100%"
            height="100%"
            borderRadius="50%"
            backgroundImage={`url(${SmallWhiteCircle})`}
            src={logoURL}
            alt=""
          />
        </Box>
        <Heading fontSize="24px" mr={2}>
          {symbol}
        </Heading>
      </Row>

      <Button
        ml={1}
        height="28px"
        width="58px"
        bg="transparent"
        border="2px"
        borderRadius="8px"
        borderColor="#272727"
        fontSize="sm"
        fontWeight="extrabold"
        _hover={{}}
        _active={{}}
        onClick={setToMax}
        isLoading={isMaxLoading}
      >
        {t("MAX")}
      </Button>
    </Row>
  );
};

const AmountInput = ({
  displayAmount,
  updateAmount,
  color,
}: {
  displayAmount: string;
  updateAmount: (symbol: string) => any;
  color: string;
}) => {
  return (
    <Input
      type="number"
      inputMode="decimal"
      fontSize="3xl"
      fontWeight="bold"
      variant="unstyled"
      _placeholder={{ color }}
      placeholder="0.0"
      value={displayAmount}
      color={color}
      onChange={(event) => updateAmount(event.target.value)}
      mr={DASHBOARD_BOX_SPACING.asPxString()}
    />
  );
};
