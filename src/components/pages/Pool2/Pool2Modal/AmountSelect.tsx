import React, { useState } from "react";
import { Row, Column, Center } from "buttered-chakra";

import LogRocket from "logrocket";
import {
  Heading,
  Box,
  Button,
  Text,
  Image,
  Input,
  Link,
  useToast,
  IconButton,
} from "@chakra-ui/react";
import SmallWhiteCircle from "../../../../static/small-white-circle.png";

import BigNumber from "bignumber.js";

import { useQueryCache } from "react-query";

import { AttentionSeeker } from "react-awesome-reveal";

import { HashLoader } from "react-spinners";

import { useTranslation } from "react-i18next";
import { useRari } from "../../../../context/RariContext";
import { fetchTokenBalance } from "../../../../hooks/useTokenBalance";
import { BN, smallStringUsdFormatter } from "../../../../utils/bigUtils";
import { tokens } from "../../../../utils/tokenUtils";
import DashboardBox, {
  DASHBOARD_BOX_SPACING,
} from "../../../shared/DashboardBox";
import { ModalDivider } from "../../../shared/Modal";

import { Mode } from ".";
import { SettingsIcon } from "@chakra-ui/icons";

import { LP_TOKEN_CONTRACT } from "../../../../rari-sdk/governance";

interface Props {
  onClose: () => any;
  token: string;
  mode: Mode;
  openOptions: () => any;
}

enum UserAction {
  NO_ACTION,
  WAITING_FOR_TRANSACTIONS,
}

const AmountSelect = ({ onClose, mode, openOptions }: Props) => {
  const toast = useToast();

  const queryCache = useQueryCache();

  const [userAction, setUserAction] = useState(UserAction.NO_ACTION);

  const [quoteAmount, setQuoteAmount] = useState<null | BN>(null);

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
      // _setAmount(bigAmount.multipliedBy(10 ** token.decimals));
    } catch (e) {
      // If the number was invalid, set the amount to null to disable confirming:
      _setAmount(null);
    }

    setUserAction(UserAction.NO_ACTION);
  };

  const amountIsValid = (() => {
    // if (amount === null || amount.isZero()) {
    //   return false;
    // }

    // if (!poolTokenBalance) {
    //   return false;
    // }

    // return amount.lte(poolTokenBalance.toString());

    return true;
  })();

  let depositOrWithdrawAlert;

  if (amount === null || amount.isZero()) {
    if (mode === Mode.DEPOSIT) {
      depositOrWithdrawAlert = t("Enter a valid amount to deposit.");
    } else if (mode === Mode.WITHDRAW) {
      depositOrWithdrawAlert = t("Enter a valid amount to withdraw.");
    }
  }
  // else if (!poolTokenBalance || !sfiBalance) {
  //   depositOrWithdrawAlert = t("Loading your balance of {{token}}...", {
  //     token: tranchePool,
  //   });
  // }
  else if (!amountIsValid) {
    depositOrWithdrawAlert = t("You don't have enough {{token}}.", {
      token: "ETH-RGT SLP",
    });
  } else {
    depositOrWithdrawAlert = t("Click review + confirm to continue!");
  }

  const onConfirm = async () => {
    try {
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
      <HashLoader
        size={70}
        //TODO: COLOR
        color={"#C34535"}
        loading
      />
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
          {mode === Mode.DEPOSIT ? t("Deposit") : t("Withdraw")}
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
          <Link
            href="https://www.notion.so/Fees-e4689d7b800f485098548dd9e9d0a69f"
            isExternal
          >
            {depositOrWithdrawAlert}
          </Link>
        </Text>

        <DashboardBox width="100%" height="70px" mt={4}>
          <Row
            p={DASHBOARD_BOX_SPACING.asPxString()}
            mainAxisAlignment="space-between"
            crossAxisAlignment="center"
            expand
          >
            <AmountInput
              displayAmount={userEnteredAmount}
              updateAmount={updateAmount}
            />

            <TokenNameAndMaxButton updateAmount={updateAmount} />
          </Row>
        </DashboardBox>

        <Button
          mt={4}
          fontWeight="bold"
          fontSize="2xl"
          borderRadius="10px"
          width="100%"
          height="70px"
          //TODO: COLOR
          bg={"#C34535"}
          _hover={{ transform: "scale(1.02)" }}
          _active={{ transform: "scale(0.95)" }}
          //TODO: COLOR
          color={"#FFF"}
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

const TokenNameAndMaxButton = ({
  updateAmount,
}: {
  updateAmount: (newAmount: string) => any;
}) => {
  //TODO: BETTER COLOR SOURCE

  const { rari, address } = useRari();

  const [isMaxLoading, setIsMaxLoading] = useState(false);

  const setToMax = async () => {
    setIsMaxLoading(true);
    let maxBN: BN;

    const balance = await fetchTokenBalance(LP_TOKEN_CONTRACT, rari, address);

    maxBN = balance;

    if (maxBN.isNeg() || maxBN.isZero()) {
      updateAmount("0.0");
    } else {
      const str = new BigNumber(maxBN.toString())
        .div(10 ** 18)
        .toFixed(18)
        // Remove trailing zeroes
        .replace(/\.?0+$/, "");

      if (str.startsWith("0.000000")) {
        updateAmount("0.0");
      } else {
        updateAmount(str);
      }
    }

    setIsMaxLoading(false);
  };

  const { t } = useTranslation();

  return (
    <Row mainAxisAlignment="flex-start" crossAxisAlignment="center">
      <Row mainAxisAlignment="flex-start" crossAxisAlignment="center">
        <Box height="25px" width="25px" mr={2}>
          <Image
            width="100%"
            height="100%"
            borderRadius="50%"
            backgroundImage={`url(${SmallWhiteCircle})`}
            src={
              "https://assets.coingecko.com/coins/images/12900/small/rgt_logo.png?1603340632"
            }
            alt=""
          />
        </Box>
        <Heading fontSize="24px" mr={2}>
          ETH-RGT SLP
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
}: {
  displayAmount: string;
  updateAmount: (symbol: string) => any;
}) => {
  //TODO: BETTER COLOR SOURCE

  return (
    <Input
      type="number"
      inputMode="decimal"
      fontSize="3xl"
      fontWeight="bold"
      variant="unstyled"
      _placeholder={{ color: "#929192" }}
      placeholder="0.0"
      value={displayAmount}
      color={"#929192"}
      onChange={(event) => updateAmount(event.target.value)}
      mr={4}
    />
  );
};
