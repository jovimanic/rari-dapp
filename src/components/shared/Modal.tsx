import React from "react";
import { DASHBOARD_BOX_PROPS } from "./DashboardBox";
import { Box, Heading, CloseButton } from "@chakra-ui/core";
import { Row } from "buttered-chakra";

export const MODAL_PROPS = {
  width: { md: "450px", xs: "92%" },
  color: "#FFFFFF",
  ...DASHBOARD_BOX_PROPS,
};

export const ModalTitle = React.memo(({ text }: { text: string }) => {
  return (
    <Row
      width="100%"
      mainAxisAlignment="center"
      crossAxisAlignment="center"
      p={4}
    >
      <Heading fontSize="27px">{text}</Heading>
    </Row>
  );
});

export const ModalTitleWithCloseButton = React.memo(
  ({ text, onClose }: { text: string; onClose: () => any }) => {
    return (
      <Row
        width="100%"
        mainAxisAlignment="space-between"
        crossAxisAlignment="center"
        p={4}
      >
        <Box width="32px" />
        <Heading fontSize="27px">{text}</Heading>
        <CloseButton onClick={onClose} />
      </Row>
    );
  }
);

export const ModalDivider = React.memo(() => {
  return <Box h="1px" width="100%" bg="#272727" />;
});
