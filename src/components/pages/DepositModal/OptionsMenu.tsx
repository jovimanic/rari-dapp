import React, { useCallback } from "react";

import { Button } from "@chakra-ui/core";

import { Fade } from "react-awesome-reveal";
import { Column } from "buttered-chakra";

import { Mode } from ".";
import { useTranslation } from "react-i18next";
import { ModalDivider, ModalTitleWithCloseButton } from "../../shared/Modal";

const OptionsMenu = React.memo(
  ({
    mode,
    onSetMode,
    onClose,
  }: {
    mode: Mode;
    onClose: () => any;
    onSetMode: (mode: Mode) => any;
  }) => {
    const toggleMode = useCallback(() => {
      onSetMode(mode === Mode.DEPOSIT ? Mode.WITHDRAW : Mode.DEPOSIT);
      onClose();
    }, [onSetMode, onClose, mode]);

    const { t } = useTranslation();

    return (
      <Fade>
        <ModalTitleWithCloseButton text={t("Options")} onClose={onClose} />
        <ModalDivider />
        <Column
          mt={4}
          mainAxisAlignment="space-between"
          crossAxisAlignment="center"
        >
          <Button
            variantColor="whiteAlpha"
            variant="solid"
            onClick={toggleMode}
          >
            {mode === Mode.DEPOSIT
              ? t("Want to withdraw?")
              : t("Want to deposit?")}
          </Button>
        </Column>
      </Fade>
    );
  }
);

export default OptionsMenu;
