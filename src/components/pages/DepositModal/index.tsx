import React, { useState, useCallback, useEffect } from "react";
import { Modal, ModalOverlay, ModalContent } from "@chakra-ui/core";
import SlideIn from "../../shared/SlideIn";
import TokenSelect from "./TokenSelect";
import AmountSelect from "./AmountSelect";
import OptionsMenu from "./OptionsMenu";

enum CurrentScreen {
  MAIN,
  COIN_SELECT,
  OPTIONS,
}

export enum Mode {
  DEPOSIT,
  WITHDRAW,
}

export function modeToTitleCaseString(mode: Mode) {
  return mode === Mode.DEPOSIT ? "Deposit" : "Withdraw";
}

export function modeToLowerCaseString(mode: Mode) {
  return modeToTitleCaseString(mode);
}

interface Props {
  isOpen: boolean;

  onClose: () => any;
}

const DepositModal = React.memo((props: Props) => {
  const [currentScreen, setCurrentScreen] = useState(CurrentScreen.MAIN);

  const openCoinSelect = useCallback(
    () => setCurrentScreen(CurrentScreen.COIN_SELECT),
    [setCurrentScreen]
  );

  const openOptions = useCallback(
    () => setCurrentScreen(CurrentScreen.OPTIONS),
    [setCurrentScreen]
  );

  useEffect(() => {
    // When the modal closes return to the main screen.
    if (!props.isOpen) {
      setCurrentScreen(CurrentScreen.MAIN);
    }
  }, [props.isOpen]);

  const [selectedToken, _setSelectedToken] = useState("DAI");

  const onSelectToken = useCallback(
    (symbol: string) => {
      _setSelectedToken(symbol);
      setCurrentScreen(CurrentScreen.MAIN);
    },
    [_setSelectedToken, setCurrentScreen]
  );

  const [mode, setMode] = useState(Mode.DEPOSIT);

  const onSetMode = useCallback(
    (mode: Mode) => {
      setMode(mode);
      setCurrentScreen(CurrentScreen.MAIN);
    },
    [setMode, setCurrentScreen]
  );

  return (
    <SlideIn
      isActivted={props.isOpen}
      render={(styles) => (
        <Modal isOpen={props.isOpen} onClose={props.onClose} isCentered>
          <ModalOverlay />
          <ModalContent
            {...styles}
            height="300px"
            width={{ md: "450px", xs: "92%" }}
            backgroundColor="#121212"
            borderRadius="10px"
            border="1px"
            borderColor="#272727"
            color="#FFFFFF"
          >
            {currentScreen === CurrentScreen.MAIN ? (
              <AmountSelect
                selectedToken={selectedToken}
                openCoinSelect={openCoinSelect}
                openOptions={openOptions}
                mode={mode}
              />
            ) : currentScreen === CurrentScreen.COIN_SELECT ? (
              <TokenSelect onSelectToken={onSelectToken} />
            ) : (
              <OptionsMenu mode={mode} onSetMode={onSetMode} />
            )}
          </ModalContent>
        </Modal>
      )}
    />
  );
});

export default DepositModal;
