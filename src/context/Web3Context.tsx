import React, { useState, useCallback, useEffect } from "react";
import Web3 from "web3";
import FullPageSpinner from "../components/shared/FullPageSpinner";
import { useQueryCache } from "react-query";
import { useTranslation } from "react-i18next";
import { DASHBOARD_BOX_PROPS } from "../components/shared/DashboardBox";

async function launchModalLazy(t: (text: string, extra?: any) => string) {
  const [
    WalletConnectProvider,
    Portis,
    Authereum,
    Fortmatic,
    Torus,
    Web3Modal,
  ] = await Promise.all([
    import("@walletconnect/web3-provider"),
    import("@portis/web3"),
    import("authereum"),
    import("fortmatic"),
    import("@toruslabs/torus-embed"),
    import("web3modal"),
  ]);

  const providerOptions = {
    injected: {
      display: {
        description: t("Connect with a browser extension"),
      },
      package: null,
    },
    walletconnect: {
      package: WalletConnectProvider.default,
      options: {
        infuraId: process.env.REACT_APP_INFURA_ID,
      },
      display: {
        description: t("Scan with a wallet to connect"),
      },
    },
    fortmatic: {
      package: Fortmatic.default,
      options: {
        key: process.env.REACT_APP_FORTMATIC_KEY,
      },
      display: {
        description: t("Connect with your {{provider}} account", {
          provider: "Fortmatic",
        }),
      },
    },
    torus: {
      package: Torus.default,
      display: {
        description: t("Connect with your {{provider}} account", {
          provider: "Torus",
        }),
      },
    },
    portis: {
      package: Portis.default,
      options: {
        id: process.env.REACT_APP_PORTIS_ID,
      },
      display: {
        description: t("Connect with your {{provider}} account", {
          provider: "Portis",
        }),
      },
    },
    authereum: {
      package: Authereum.default,
      display: {
        description: t("Connect with your {{provider}} account", {
          provider: "Authereum",
        }),
      },
    },
  };

  const web3Modal = new Web3Modal.default({
    cacheProvider: false,
    providerOptions,
    theme: {
      background: DASHBOARD_BOX_PROPS.backgroundColor,
      main: "#FFFFFF",
      secondary: "#858585",
      border: DASHBOARD_BOX_PROPS.borderColor,
      hover: "#000000",
    },
  });

  return web3Modal.connect();
}

export interface Web3ContextData {
  web3Network: Web3;
  web3Authed: Web3 | null;
  web3: Web3;
  web3ModalProvider: any | null;
  isAuthed: boolean;
  login: () => any;
  forceLogin: () => any;
  logout: () => any;
  address: string;
}

export const EmptyAddress = "0x0000000000000000000000000000000000000000";

export const Web3Context = React.createContext<Web3ContextData | undefined>(
  undefined
);

export const Web3Provider = ({ children }: { children: JSX.Element }) => {
  const { t } = useTranslation();

  const [web3Network] = useState<Web3>(
    () =>
      new Web3(
        `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_ID}`
      )
  );

  const [web3Authed, setWeb3Authed] = useState<Web3 | null>(null);
  const [address, setAddress] = useState<string>(EmptyAddress);

  const [web3ModalProvider, setWeb3ModalProvider] = useState<any | null>(null);

  const queryCache = useQueryCache();

  const setWeb3AuthedAndAddressFromModal = useCallback(
    (modalProvider) => {
      let authedProvider = new Web3(modalProvider);

      setWeb3Authed(authedProvider);

      authedProvider.eth
        .getAccounts()
        .then((addresses) => setAddress(addresses[0]));
    },
    [setWeb3Authed, setAddress]
  );

  const forceLogin = useCallback(async () => {
    try {
      const provider = await launchModalLazy(t);

      setWeb3ModalProvider(provider);

      setWeb3AuthedAndAddressFromModal(provider);
    } catch (e) {
      if (e === "Modal closed by user") {
        forceLogin();
      }
    }
  }, [setWeb3ModalProvider, setWeb3AuthedAndAddressFromModal, t]);

  const login = useCallback(async () => {
    const provider = await launchModalLazy(t);

    setWeb3ModalProvider(provider);

    setWeb3AuthedAndAddressFromModal(provider);
  }, [setWeb3ModalProvider, setWeb3AuthedAndAddressFromModal, t]);

  const refetchAccountData = useCallback(() => {
    console.log("New account, clearing the queryCache!");

    setWeb3AuthedAndAddressFromModal(web3ModalProvider);

    queryCache.clear();
  }, [setWeb3AuthedAndAddressFromModal, web3ModalProvider, queryCache]);

  const logout = useCallback(() => {
    setWeb3ModalProvider((past: any) => {
      past?.off("accountsChanged", refetchAccountData);
      past?.off("chainChanged", refetchAccountData);

      return null;
    });

    setWeb3Authed(null);

    setAddress(EmptyAddress);
  }, [setWeb3Authed, setWeb3ModalProvider, refetchAccountData]);

  useEffect(() => {
    if (web3ModalProvider !== null) {
      web3ModalProvider.on("accountsChanged", refetchAccountData);
      web3ModalProvider.on("chainChanged", refetchAccountData);
    }

    return () => {
      web3ModalProvider?.off("accountsChanged", refetchAccountData);
      web3ModalProvider?.off("chainChanged", refetchAccountData);
    };
  }, [web3ModalProvider, refetchAccountData]);

  const value = {
    web3Network,
    web3Authed,
    web3ModalProvider,
    web3: web3Authed !== null ? web3Authed : web3Network,
    login,
    forceLogin,
    logout,
    isAuthed: web3Authed !== null,
    address,
  };

  // If the address is still loading in, don't render children who rely on it.
  if (value.isAuthed && address === EmptyAddress) {
    return <FullPageSpinner />;
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export function useWeb3() {
  const context = React.useContext(Web3Context);

  if (context === undefined) {
    throw new Error(`useWeb3Network must be used within a Web3NetworkProvider`);
  }

  return context;
}
