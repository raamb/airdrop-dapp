import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import React, { useMemo } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import Image from 'next/image';
import { lightTheme } from 'snet-ui/Theme/theme';
import createEmotionCache from 'snet-ui/Theme/createEmotionCache';
import 'styles/globals.css';
import { appWithTranslation } from 'next-i18next';

import WalletModal from 'snet-ui/Blockchain/WalletModal';

import { store } from 'utils/store';

import { useAppDispatch, useAppSelector } from 'utils/store/hooks';
import { setShowConnectionModal, setWalletError } from 'utils/store/features/walletSlice';

import UnsupportedNetworkModal from 'snet-ui/Blockchain/UnsupportedNetworkModal';
import nextI18NextConfig from '../next-i18next.config';
console.log(
  `Don't remove this console.
It is mandatory to import the Image from "next/image"
for @sls-next/serverless-component to build the Image lambda properly.`,
  Image.name,
);

const BlockChainProvider = dynamic(() => import('snet-ui/Blockchain/Provider'), { ssr: false });

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

const AppWithBlockchainComps = (props: AppProps) => {
  const { Component, pageProps } = props;

  // !!Caution!!
  // Using `useWeb3React` only to capture the UnsupportedChainIdError.
  // Always use `useActiveWeb3React` anywhere in the rest of the Application.
  const { error, chainId, account } = useWeb3React();
  console.log('global web3 error', error);

  const { showConnectionModal, error: walletError } = useAppSelector((state) => state.wallet);
  const dispatch = useAppDispatch();
  const supportedChainId = Number(process.env.NEXT_PUBLIC_SUPPORTED_CHAIN_ID);

  const showNetworkOverlay = useMemo(() => {
    if (error instanceof UnsupportedChainIdError) return true;
    if (typeof chainId !== 'undefined' && chainId !== supportedChainId) return true;
    return false;
  }, [chainId, error, account]);

  if (error?.message !== walletError) {
    dispatch(setWalletError(error?.message));
  }

  return (
    <>
      <Component
        {
          ...pageProps
        }
      />
      <WalletModal
        open={showConnectionModal}
        setOpen={(val) => dispatch(setShowConnectionModal(val))}
      />
      <UnsupportedNetworkModal open={showNetworkOverlay} supportedChainId={supportedChainId} />
    </>
  );
};

function MyApp(props: AppProps) {
  // @ts-ignore
  const { emotionCache = clientSideEmotionCache } = props;

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>Airdrop</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={lightTheme}>

        <CssBaseline />
           <BlockChainProvider>
       { /* eslint-disable react/jsx-props-no-spreading */}
          <AppWithBlockchainComps {...props} />

           </BlockChainProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

const AppWithRedux = (props: AppProps) => (
   <Provider store={store}>
   { /* eslint-disable react/jsx-props-no-spreading */}
    <MyApp {...props} />
  </Provider>
);
/* eslint-disable react/jsx-props-no-spreading */
MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  emotionCache: PropTypes.object,
  pageProps: PropTypes.object.isRequired,
};

// @ts-ignore
export default appWithTranslation(AppWithRedux, nextI18NextConfig);
