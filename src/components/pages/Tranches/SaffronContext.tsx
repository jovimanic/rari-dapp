import React, { useState, useEffect } from "react";
import { useRari } from "../../../context/RariContext";
import { Contract } from "web3-eth-contract";
import SaffronPoolABI from "./SaffronPoolABI.json";
import SaffronStrategyABI from "./SaffronStrategyABI.json";
import { SaffronStrategyAddress, SaffronPoolAddress } from "constants/saffron";

interface SaffronContextType {
  saffronStrategy: Contract;
  saffronPool: Contract;
}

export const SaffronContext =
  React.createContext<SaffronContextType | undefined>(undefined);

export const SaffronProvider = React.memo(({ children }) => {
  const { rari } = useRari();

  const [saffronStrategy, setSaffronStrategy] = useState(() => {
    return new rari.web3.eth.Contract(
      SaffronStrategyABI as any,
      SaffronStrategyAddress
    );
  });

  const [saffronPool, setSaffronPool] = useState(() => {
    return new rari.web3.eth.Contract(
      SaffronPoolABI as any,
      SaffronPoolAddress
    );
  });

  useEffect(() => {
    setSaffronStrategy(
      new rari.web3.eth.Contract(
        SaffronStrategyABI as any,
        SaffronStrategyAddress
      )
    );

    setSaffronPool(
      new rari.web3.eth.Contract(SaffronPoolABI as any, SaffronPoolAddress)
    );
  }, [rari]);

  return (
    <SaffronContext.Provider value={{ saffronStrategy, saffronPool }}>
      {children}
    </SaffronContext.Provider>
  );
});

export const useSaffronContracts = () => {
  const context = React.useContext(SaffronContext);

  if (context === undefined) {
    throw new Error(
      `useSaffronContracts must be used within a SaffronProvider`
    );
  }

  return context;
};
