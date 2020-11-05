import React, { useCallback, useState, useMemo } from "react";
import { Row, Column } from "buttered-chakra";

import {
  Heading,
  Box,
  Icon,
  Button,
  Text,
  Image,
  IconButton,
  Input,
  Link,
  useToast,
} from "@chakra-ui/core";
import DashboardBox, { DASHBOARD_BOX_SPACING } from "../../shared/DashboardBox";
import { tokens } from "../../../utils/tokenUtils";
import SmallWhiteCircle from "../../../static/small-white-circle.png";
import {
  useTokenBalance,
  fetchTokenBalance,
} from "../../../hooks/useTokenBalance";

import { Mode } from ".";

import { useTranslation } from "react-i18next";
import { ModalDivider } from "../../shared/Modal";
import { useRari } from "../../../context/RariContext";
import { Pool, usePoolType } from "../../../context/PoolContext";
import { BN, stringUsdFormatter } from "../../../utils/bigUtils";

import { notify } from "../../../utils/notify";
import BigNumber from "bignumber.js";

import { useQueryCache } from "react-query";

import { getSDKPool, poolHasDivergenceRisk } from "../../../utils/poolUtils";
import {
  fetchMaxWithdraw,
  useMaxWithdraw,
} from "../../../hooks/useMaxWithdraw";
import Honeybadger from "honeybadger-js";

interface Props {
  selectedToken: string;
  openCoinSelect: () => any;
  openOptions: () => any;
  mode: Mode;
}

const AmountSelect = React.memo(
  ({ selectedToken, openCoinSelect, mode, openOptions }: Props) => {
    const token = tokens[selectedToken];

    const poolType = usePoolType();

    const { rari, address } = useRari();

    const {
      data: selectedTokenBalance,
      isLoading: isSelectedTokenBalanceLoading,
    } = useTokenBalance(token);

    const [areTransactionsRunning, setAreTransactionsRunning] = useState(false);

    const [userEnteredAmount, _setUserEnteredAmount] = useState("");

    const [amount, _setAmount] = useState<BigNumber | null>(
      () => new BigNumber(0)
    );

    const updateAmount = useCallback(
      (newAmount: string) => {
        if (newAmount.startsWith("-")) {
          return;
        }

        _setUserEnteredAmount(newAmount);

        try {
          BigNumber.DEBUG = true;

          // Try to set the amount to BigNumber(newAmount):
          const bigAmount = new BigNumber(newAmount);
          _setAmount(bigAmount.multipliedBy(10 ** token.decimals));
        } catch (e) {
          console.log(e);

          // If the number was invalid, set the amount to null to disable confirming:
          _setAmount(null);
        }
      },
      [_setUserEnteredAmount, _setAmount, token.decimals]
    );

    const { max, isMaxLoading } = useMaxWithdraw(token.symbol);

    const amountIsValid = useMemo(() => {
      if (amount === null || amount.isZero()) {
        return false;
      }

      if (mode === Mode.DEPOSIT) {
        if (isSelectedTokenBalanceLoading) {
          return false;
        }

        return amount.lte(selectedTokenBalance!.toString());
      } else {
        if (isMaxLoading) {
          return false;
        }

        return amount.lte(max!.toString());
      }
    }, [
      isSelectedTokenBalanceLoading,
      selectedTokenBalance,
      amount,
      isMaxLoading,
      max,
      mode,
    ]);

    const { t } = useTranslation();

    let depositOrWithdrawAlert;

    if (amount === null) {
      depositOrWithdrawAlert =
        mode === Mode.DEPOSIT
          ? t("Enter a valid amount to deposit.")
          : t("Enter a valid amount to withdraw.");
    } else if (amount.isZero()) {
      depositOrWithdrawAlert =
        mode === Mode.DEPOSIT
          ? t("Choose which crypto you want to deposit.")
          : t("Choose which crypto you want to withdraw.");
    } else if (isSelectedTokenBalanceLoading) {
      depositOrWithdrawAlert = t("Loading your balance of {{token}}...", {
        token: selectedToken,
      });
    } else if (!amountIsValid) {
      depositOrWithdrawAlert =
        mode === Mode.DEPOSIT
          ? t("You don't have enough {{token}}.", {
              token: selectedToken,
            })
          : t("You cannot withdraw this much {{token}}.", {
              token: selectedToken,
            });
    } else {
      depositOrWithdrawAlert = t(
        "Click to learn about our performance/withdrawal fees."
      );
    }

    const toast = useToast();

    const queryCache = useQueryCache();

    const onDeposit = useCallback(async () => {
      try {
        const pool = getSDKPool({ rari, pool: poolType });

        //@ts-ignore
        const amountBN = rari.web3.utils.toBN(amount!.decimalPlaces(0));

        setAreTransactionsRunning(true);

        const [amountToBeAdded] = await pool.deposits.validateDeposit(
          token.symbol,
          amountBN,
          address
        );

        const amountToBeAddedInFormat =
          poolType === Pool.ETH
            ? rari.web3.utils.fromWei(amountToBeAdded).toString() + " ETH"
            : stringUsdFormatter(
                rari.web3.utils.fromWei(amountToBeAdded).toString()
              );

        if (
          window.confirm(
            t("You will deposit {{amount}}. Do you approve?", {
              amount: amountToBeAddedInFormat,
            })
          )
        ) {
          const [
            ,
            ,
            approvalReceipt,
            depositReceipt,
          ] = await pool.deposits.deposit(
            token.symbol,
            amountBN,
            amountToBeAdded,
            {
              from: address,
            }
          );

          if (approvalReceipt?.transactionHash) {
            notify.hash(approvalReceipt.transactionHash);
          }

          if (!depositReceipt) {
            throw new Error(
              t(
                "Prices and/or slippage have changed. Please reload the page and try again. If the problem persists, please contact us."
              )
            );
          }

          notify.hash(depositReceipt.transactionHash);

          queryCache.refetchQueries();
        }
      } catch (e) {
        let message: string;

        if (e instanceof Error) {
          message = e.toString();
          Honeybadger.notify(e);
        } else {
          message = JSON.stringify(e);
          Honeybadger.notify(new Error(message));
        }

        toast({
          title: "Error!",
          description: message,
          status: "error",
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      }

      setAreTransactionsRunning(false);
    }, [address, poolType, rari, token, amount, t, toast, queryCache]);

    const onWithdraw = useCallback(async () => {
      try {
        const pool = getSDKPool({ rari, pool: poolType });

        //@ts-ignore
        const amountBN = rari.web3.utils.toBN(amount!.decimalPlaces(0));

        setAreTransactionsRunning(true);

        // if (poolType !== Pool.ETH) {
        //   const allocations: {
        //     [key: string]: BN;
        //   } = await pool.allocations.getRawCurrencyAllocations();

        //   const noSlippageTokens: string[] = await pool.deposits.getDirectDepositCurrencies();

        //   // If not enough to direct withdraw in the pool:
        //   if (
        //     noSlippageTokens.includes(token.symbol) &&
        //     amountBN.gt(allocations[token.symbol])
        //   ) {
        //     toast({
        //       title: t("Not enough {{token}} in the pool!", {
        //         token: token.symbol,
        //       }),
        //       description: t(
        //         "There is not enough {{token}} in the pool to withdraw this much directly. There is a max of {{max}} {{token}} in the pool. You can either withdraw a token with slippage or try another non-slippage token the pool has more of.",
        //         {
        //           token: token.symbol,
        //           max: new BigNumber(allocations[token.symbol].toString())
        //             .div(10 ** token.decimals)
        //             .toFixed(2),
        //         }
        //       ),
        //       status: "error",
        //       duration: 15000,
        //       isClosable: true,
        //       position: "top-right",
        //     });

        //     setAreTransactionsRunning(false);
        //     return;
        //   }
        // }

        const [amountToBeRemoved] = await pool.withdrawals.validateWithdrawal(
          token.symbol,
          amountBN,
          address
        );

        const amountToBeRemovedInFormat =
          poolType === Pool.ETH
            ? rari.web3.utils.fromWei(amountToBeRemoved).toString() + " ETH"
            : stringUsdFormatter(
                rari.web3.utils.fromWei(amountToBeRemoved).toString()
              );

        if (
          window.confirm(
            t("You will withdraw {{amount}}. Do you approve?", {
              amount: amountToBeRemovedInFormat,
            })
          )
        ) {
          const [, , receipt] = await pool.withdrawals.withdraw(
            token.symbol,
            amountBN,
            amountToBeRemoved,
            {
              from: address,
            }
          );

          if (!receipt) {
            throw new Error(
              t(
                "Prices and/or slippage have changed. Please reload the page and try again. If the problem persists, please contact us."
              )
            );
          }

          notify.hash(receipt.transactionHash);

          queryCache.refetchQueries();
        }
      } catch (e) {
        let message: string;

        if (e instanceof Error) {
          message = e.toString();
          Honeybadger.notify(e);
        } else {
          message = JSON.stringify(e);
          Honeybadger.notify(new Error(message));
        }

        toast({
          title: "Error!",
          description: message,
          status: "error",
          duration: 9000,
          isClosable: true,
          position: "top-right",
        });
      }

      setAreTransactionsRunning(false);
    }, [address, poolType, rari, token, amount, t, toast, queryCache]);

    return (
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
            icon="settings"
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
            <Link href="https://www.notion.so/Fees-e4689d7b800f485098548dd9e9d0a69f">
              {depositOrWithdrawAlert}
            </Link>
          </Text>
          <DashboardBox width="100%" height="70px">
            <Row
              p={DASHBOARD_BOX_SPACING.asPxString()}
              mainAxisAlignment="space-between"
              crossAxisAlignment="center"
              expand
            >
              <AmountInput
                selectedToken={selectedToken}
                displayAmount={userEnteredAmount}
                updateAmount={updateAmount}
              />

              <TokenNameAndMaxButton
                openCoinSelect={openCoinSelect}
                selectedToken={selectedToken}
                updateAmount={updateAmount}
                mode={mode}
              />
            </Row>
          </DashboardBox>

          <Button
            fontWeight="bold"
            fontSize="2xl"
            borderRadius="10px"
            width="100%"
            height="70px"
            bg={token.color}
            _hover={{ transform: "scale(1.02)" }}
            _active={{ transform: "scale(0.95)" }}
            color={token.overlayTextColor}
            isLoading={isSelectedTokenBalanceLoading || areTransactionsRunning}
            onClick={mode === Mode.DEPOSIT ? onDeposit : onWithdraw}
            isDisabled={!amountIsValid}
          >
            {t("Confirm")}
          </Button>

          {poolHasDivergenceRisk(poolType) ? (
            <Link
              href="https://www.notion.so/Capital-Allocation-Risks-f4bccf324a594f46b849e6358e0a2464#631d223f598b42e28f9758541c1b1525"
              isExternal
            >
              <Text fontSize="xs" textAlign="center">
                {t(
                  "You may experience divergence loss in this pool. Click for more info."
                )}
              </Text>
            </Link>
          ) : null}
        </Column>
      </>
    );
  }
);

export default AmountSelect;

const TokenNameAndMaxButton = React.memo(
  ({
    openCoinSelect,
    selectedToken,
    updateAmount,
    mode,
  }: {
    selectedToken: string;
    openCoinSelect: () => any;
    updateAmount: (newAmount: string) => any;
    mode: Mode;
  }) => {
    const token = tokens[selectedToken];

    const { rari, address } = useRari();

    const poolType = usePoolType();

    const [isMaxLoading, setIsMaxLoading] = useState(false);

    const setToMax = useCallback(async () => {
      setIsMaxLoading(true);
      let maxBN: BN;

      if (mode === Mode.DEPOSIT) {
        const balance = await fetchTokenBalance(token, rari, address);

        if (token.symbol === "ETH") {
          const ethPriceBN = await rari.getEthUsdPriceBN();

          const gasAnd0xFeesInUSD = 18;

          // Subtract gasAnd0xFeesInUSD worth of ETH.
          maxBN = balance.sub(
            rari.web3.utils.toBN(
              // @ts-ignore
              new BigNumber(gasAnd0xFeesInUSD * 1e18)
                .div(ethPriceBN.toString())
                .multipliedBy(1e18)
                .decimalPlaces(0)
            )
          );
        } else {
          maxBN = balance;
        }
      } else {
        const max = await fetchMaxWithdraw({
          rari,
          address,
          poolType,
          symbol: token.symbol,
        });

        maxBN = max;
      }

      if (maxBN.isNeg() || maxBN.isZero()) {
        updateAmount("0.0");
      }

      updateAmount(
        new BigNumber(maxBN.toString()).div(10 ** token.decimals).toString()
      );

      setIsMaxLoading(false);
    }, [updateAmount, token, rari, address, mode, poolType]);

    const { t } = useTranslation();

    return (
      <Row mainAxisAlignment="flex-start" crossAxisAlignment="center">
        <Row
          mainAxisAlignment="flex-start"
          crossAxisAlignment="center"
          as="button"
          onClick={openCoinSelect}
        >
          <Box height="25px" width="25px" mr={2}>
            <Image
              width="100%"
              height="100%"
              borderRadius="50%"
              backgroundImage={`url(${SmallWhiteCircle})`}
              src={token.logoURL}
              alt=""
            />
          </Box>
          <Heading fontSize="24px">{selectedToken}</Heading>
          <Icon name="chevron-down" size="32px" />
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
  }
);

const AmountInput = React.memo(
  ({
    displayAmount,
    updateAmount,
    selectedToken,
  }: {
    displayAmount: string;
    updateAmount: (symbol: string) => any;
    selectedToken: string;
  }) => {
    const token = tokens[selectedToken];

    const onChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) =>
        updateAmount(event.target.value),
      [updateAmount]
    );

    return (
      <Input
        type="number"
        inputMode="decimal"
        fontSize="3xl"
        fontWeight="bold"
        variant="unstyled"
        _placeholder={{ color: token.color }}
        placeholder="0.0"
        value={displayAmount}
        color={token.color}
        onChange={onChange}
        mr={DASHBOARD_BOX_SPACING.asPxString()}
      />
    );
  }
);
