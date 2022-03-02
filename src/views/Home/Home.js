import React, { useMemo } from 'react';
import Page from '../../components/Page';
import { createGlobalStyle } from 'styled-components';
import CountUp from 'react-countup';
import CardIcon from '../../components/CardIcon';
import TokenSymbol from '../../components/TokenSymbol';
import useBombStats from '../../hooks/useBombStats';
import useLpStats from '../../hooks/useLpStats';
import useLpStatsBTC from '../../hooks/useLpStatsBTC';
import useModal from '../../hooks/useModal';
import useZap from '../../hooks/useZap';
import useBondStats from '../../hooks/useBondStats';
import usebShareStats from '../../hooks/usebShareStats';
import useTotalValueLocked from '../../hooks/useTotalValueLocked';
import { Gaia as bombTesting, GShare as bShareTesting } from '../../bomb-finance/deployments/deployments.testing.json';
import { Bomb as bombProd, BShare as bShareProd } from '../../bomb-finance/deployments/deployments.mainnet.json';
import { roundAndFormatNumber } from '../../0x';
import MetamaskFox from '../../assets/img/metamask-fox.svg';
import { Box, Button, Card, CardContent, Grid, Paper } from '@material-ui/core';
import ZapModal from '../Bank/components/ZapModal';
import { Alert } from '@material-ui/lab';

import { makeStyles } from '@material-ui/core/styles';
import useBombFinance from '../../hooks/useBombFinance';
import { ReactComponent as IconTelegram } from '../../assets/img/telegram.svg';
import { Helmet } from 'react-helmet'
import BombImage from '../../assets/logos/gaia.png';

import HomeImage from '../../assets/img/bg2.svg';
const BackgroundImage = createGlobalStyle`
  body {
    background: url(${HomeImage}) repeat fixed !important;
    background-size: cover !important;
    background-color: #33333;
  }
`;
const TITLE = 'gaia.finance | BNB pegged algocoin'

// const BackgroundImage = createGlobalStyle`
//   body {
//     background-color: grey;
//     background-size: cover !important;
//   }
// `;

const useStyles = makeStyles((theme) => ({
  button: {
    [theme.breakpoints.down('415')]: {
      // marginTop: '10px'
    },
  },
}));

const Home = () => {
  const classes = useStyles();
  const TVL = useTotalValueLocked();
  const bombBnbLpStats = useLpStatsBTC('GAIA-BNB-LP');
  const bShareBnbLpStats = useLpStats('GSHARE-BNB-LP');
  const bombStats = useBombStats();
  const bShareStats = usebShareStats();
  const tBondStats = useBondStats();
  const bombFinance = useBombFinance();

  // console.log({bShareStats})
  let bomb;
  let bShare;
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    bomb = bombTesting;
    bShare = bShareTesting;
  } else {
    bomb = bombProd;
    bShare = bShareProd;
  }

  const buyBombAddress =
    //  'https://pancakeswap.finance/swap?inputCurrency=0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c&outputCurrency=' +
    // 'https://app.bogged.finance/bsc/swap?tokenIn=0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c&tokenOut='+bomb.address;
    `https://pcs.nhancv.com/#/swap?inputCurrency=BNB&outputCurrency=${bomb.address}`;
  //https://pancakeswap.finance/swap?outputCurrency=0x531780FAcE85306877D7e1F05d713D1B50a37F7A';
  const buyBShareAddress = 
  `https://pcs.nhancv.com/#/swap?inputCurrency=BNB&outputCurrency=${bShare.address}`;
  // 'https://app.bogged.finance/bsc/swap?tokenIn=BNB&tokenOut=0x4c528F579A2C69Bb9e3803fD820289345cDB2e98';
  const bombLPStats = useMemo(() => (bombBnbLpStats ? bombBnbLpStats : null), [bombBnbLpStats]);
  const bShareLPStats = useMemo(() => (bShareBnbLpStats ? bShareBnbLpStats : null), [bShareBnbLpStats]);
  const bombPriceInDollars = useMemo(
    () => (bombStats ? Number(bombStats.priceInDollars).toFixed(2) : null),
    [bombStats],
  );
  const bombPriceInBNB = useMemo(() => (bombStats ? Number(bombStats.tokenInBnb).toFixed(4) : null), [bombStats]);
  const bombCirculatingSupply = useMemo(() => (bombStats ? String(bombStats.circulatingSupply) : null), [bombStats]);
  const bombTotalSupply = useMemo(() => (bombStats ? String(bombStats.totalSupply) : null), [bombStats]);

  const bSharePriceInDollars = useMemo(
    () => (bShareStats ? Number(bShareStats.priceInDollars).toFixed(2) : null),
    [bShareStats],
  );
  const bSharePriceInBNB = useMemo(
    () => (bShareStats ? Number(bShareStats.tokenInBnb).toFixed(4) : null),
    [bShareStats],
  );
  const bShareCirculatingSupply = useMemo(
    () => (bShareStats ? String(bShareStats.circulatingSupply) : null),
    [bShareStats],
  );
  const bShareTotalSupply = useMemo(() => (bShareStats ? String(bShareStats.totalSupply) : null), [bShareStats]);

  const gBondPriceInDollars = useMemo(
    () => (tBondStats ? Number(tBondStats.priceInDollars).toFixed(2) : null),
    [tBondStats],
  );
  const gBondPriceInBNB = useMemo(() => (tBondStats ? Number(tBondStats.tokenInBnb).toFixed(4) : null), [tBondStats]);
  const gBondCirculatingSupply = useMemo(
    () => (tBondStats ? String(tBondStats.circulatingSupply) : null),
    [tBondStats],
  );
  console.log({bombPriceInDollars, bSharePriceInBNB})
  const gBondTotalSupply = useMemo(() => (tBondStats ? String(tBondStats.totalSupply) : null), [tBondStats]);

  const bombLpZap = useZap({ depositTokenName: 'GAIA-BNB-LP' });
  const bshareLpZap = useZap({ depositTokenName: 'GSHARE-BNB-LP' });

  const [onPresentBombZap, onDissmissBombZap] = useModal(
    <ZapModal
      decimals={18}
      onConfirm={(zappingToken, tokenName, amount) => {
        if (Number(amount) <= 0 || isNaN(Number(amount))) return;
        bombLpZap.onZap(zappingToken, tokenName, amount);
        onDissmissBombZap();
      }}
      tokenName={'GAIA-BNB-LP'}
    />,
  );

  const [onPresentBshareZap, onDissmissBshareZap] = useModal(
    <ZapModal
      decimals={18}
      onConfirm={(zappingToken, tokenName, amount) => {
        if (Number(amount) <= 0 || isNaN(Number(amount))) return;
        bshareLpZap.onZap(zappingToken, tokenName, amount);
        onDissmissBshareZap();
      }}
      tokenName={'GSHARE-BNB-LP'}
    />,
  );

  return (
    <Page>
      <Helmet>
        <title>{TITLE}</title>
      </Helmet>
      <BackgroundImage />
      <Grid container spacing={3}>
        {/* <Grid container spacing={3}> */}
          <Grid item xs={12} sm={12} justify="center" style={{ display: 'flex', margin: "2px", marginBottom: "10px" }}>

            <Alert variant="filled" severity="info">
              <strong>Please Note:</strong> We were not impacted by any of the recent exploits. &nbsp;
              <a rel="noopener noreferrer" href="https://medium.com/@bombbshare/dec-18-quick-update-regarding-grim-exploit-4f1a0c989fba" target="_blank">
                Read more here.
              </a>

            </Alert>

          </Grid>
        {/* </Grid> */}
        <div className='flex flex-col md:flex-row sm:flex-col p-5 rounded-md bg-black md:space-x-9 items-center justify-center relative  md:h-64 h-max'>
        {/* Logo */}
          <img src={BombImage} alt='Bomb.money' className='-ml-0 md:-ml-16 max-h-64 md:max-h-96' />
          {/* Explanation text */}
          <div className='text-left text-white space-y-5 md:space-y-3 my-12 md:mt-0 md:w-2/5 w-full '>
            <h2 className='font-bold text-3xl'>Welcome to Gaia.finance</h2>
            <p>
            The first algorithmic token pegged to BNB running on Binance Smart Chain. 
            Completely decentralized on-chain governance.
            </p>
            <button className="border rounded-md px-3 py-2">
              <a href="https://docs.gaiafinance.io/why-gaia.finance">Read More</a>
            </button>
          </div>

           {/* TVL */}
          <div class="bg-primary hidden md:block p-10 rounded-md md:-mt-24 mt-5 h-52 w-full md:w-1/2">
              <h2 className='font-bold text-xl'>Total Value Locked</h2>
              <CountUp style={{ fontSize: '70px', fontWeight: 'bold' }} end={TVL} separator="," prefix="$" />
          </div>
        </div>
           {/* TVL */}
           <div class="bg-primary md:hidden p-10 rounded-md md:-mt-24 mt-5 h-52 w-full md:w-1/2">
              <h2 className='font-bold text-xl'>Total Value Locked</h2>
              <CountUp style={{ fontSize: '70px', fontWeight: 'bold' }} end={TVL} separator="," prefix="$" />
          </div>

      <div className="flex flex-wrap md:flex-nowrap justify-between md:space-x-9 space-y-9 md:space-y-0 w-full mt-20">

        {/* GAIA */}
        <div  style={{borderRadius: '10px'}} className="border border-gray-800 w-full p-5 h-max-screen">
          <div>
            <div style={{position: 'relative'}}> 
              <Button
                onClick={() => {
                  bombFinance.watchAssetInMetamask('GAIA');
                }}
                style={{ position: 'absolute', top: '10px', right: '10px', border: '1px grey solid' }}
              >
                {' '}
                <b>+</b>&nbsp;&nbsp;
                <img alt="metamask fox" style={{ width: '20px' }} src={MetamaskFox} />
              </Button>
              <Box mt={2}>
                <div>
                  <TokenSymbol symbol="GAIA" />
                </div>
              </Box>
              <h2 style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '30px' }} className='text-xl text-gray-200 font-bold mt-2'>GAIA</h2>
              <p style={{ marginBottom: '20px'}} className='text-base text-gray-400'>GAIA</p>
              {/* 10,000 GAIA (1.0 Peg) = */}
              <div className='rounded-md bg-gaiagray h-40 p-5 w-full flex-col flex items-center mt-16'>
                <p className='text-base text-gray-300'>Current Price</p>
                <p style={{ fontSize: '30px', color: 'white' }}>{bombPriceInBNB ? bombPriceInBNB : '-.----'} BNB</p>
                <Box>
                  <span style={{ fontSize: '16px',  color: 'white',  alignContent: 'flex-center' }}>
                    ${bombPriceInDollars ? roundAndFormatNumber(bombPriceInDollars, 2) : '-.--'} / GAIA
                  </span>
                </Box>
              </div>
              <div style={{ fontSize: '12px' }} className="space-y-3 w-full my-10">
                <p className='flex w-full justify-between text-base text-gray-400'>
                  Market Cap: 
                  <span className='font-bold text-white'>
                    ${roundAndFormatNumber(bombCirculatingSupply * bombPriceInDollars, 2)}
                  </span>
                </p>
                <p className='flex w-full justify-between text-base text-gray-400'>
                  Circulating Supply: 
                  <span className='font-bold text-white'>
                    {roundAndFormatNumber(bombCirculatingSupply, 2)}
                  </span>
                </p>
                <p className='flex w-full justify-between text-base text-gray-400'>
                  Total Supply:
                  <span className='font-bold text-white'>
                    {roundAndFormatNumber(bombTotalSupply, 2)}
                  </span> 
                </p>
              </div>
            </div>
            <button
                className='bg-primary p-3 text-gray-800 w-full font-bold'
              >
                <a 
                target="_blank"
                href={buyBombAddress}>
                  Buy GAIA
                </a>
            </button>
            </div>
          </div>

        {/* GSHARE */}
        <div  style={{borderRadius: '10px'}} className="border border-gray-800 w-full p-5 h-max-screen">
            <div>
              <div style={{position: 'relative'}} >
                <Button
                  onClick={() => {
                    bombFinance.watchAssetInMetamask('GSHARE');
                  }}
                  style={{ position: 'absolute', top: '10px', right: '10px', border: '1px grey solid' }}
                >
                  {' '}
                  <b>+</b>&nbsp;&nbsp;
                  <img alt="metamask fox" style={{ width: '20px' }} src={MetamaskFox} />
                </Button>
                <Box mt={2}>
                  <div>
                    <TokenSymbol symbol="GSHARE" />
                  </div>
                </Box>
                <h2 style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '30px' }} className='text-xl text-gray-200 font-bold mt-2'>Gaia Share</h2>
                <p style={{ marginBottom: '20px'}} className='text-base text-gray-400'>GSHARE</p>

                <div className='rounded-md bg-gaiagray h-40 p-5 w-full flex-col flex items-center mt-16'>
                  <p className='text-base text-gray-300'>Current Price</p>
                  <p style={{ fontSize: '30px', color: 'white' }}>{bombPriceInBNB ? bombPriceInBNB : '-.----'} BNB</p>
                  <Box>
                    <span style={{ fontSize: '16px',  color: 'white',  alignContent: 'flex-center' }}>
                      {bSharePriceInBNB ? bSharePriceInBNB : '-.----'} BNB
                    </span>
                  </Box>
                  <Box>
                    <span style={{ fontSize: '16px',  color: 'white',  alignContent: 'flex-center' }}>${bSharePriceInDollars ? bSharePriceInDollars : '-.--'} / GSHARE</span>
                  </Box>
                </div>
                <div style={{ fontSize: '12px' }} className="space-y-3 w-full my-10">
                  <p className='flex w-full justify-between text-base text-gray-400'>
                  Market Cap: 
                    <span className='font-bold text-white'>
                      ${roundAndFormatNumber((bShareCirculatingSupply * bSharePriceInDollars).toFixed(2), 2)}{' '}
                    </span>
                  </p>
                  <p className='flex w-full justify-between text-base text-gray-400'>
                  Circulating Supply: 
                    <span className='font-bold text-white'>
                      {roundAndFormatNumber(bShareCirculatingSupply, 2)}
                    </span>
                  </p>
                  <p className='flex w-full justify-between text-base text-gray-400'>
                  Total Supply: 
                    <span className='font-bold text-white'>
                    {roundAndFormatNumber(bShareTotalSupply, 2)}
                    </span>
                  </p>
                </div>
              </div>
              <button
                  className='bg-primary p-3 text-gray-800 w-full font-bold'
                >
                  <a
                    target="_blank"
                    href={buyBShareAddress}>
                    Buy GSHARE
                    </a>
                </button>
              </div>
          </div>
        

        {/* GBOND */}
        <div  style={{borderRadius: '10px'}} className="border border-gray-800 w-full p-5 h-max-screen">
          <div>
            <div style={{ position: 'relative' }} className="">
              <Button
                onClick={() => {
                  bombFinance.watchAssetInMetamask('GBOND');
                }}
                style={{ position: 'absolute', top: '10px', right: '10px', border: '1px grey solid' }}
              >
                {' '}
                <b>+</b>&nbsp;&nbsp;
                <img alt="metamask fox" style={{ width: '20px' }} src={MetamaskFox} />
              </Button>
              <Box mt={2}>
                <div>
                  <TokenSymbol symbol="GBOND" />
                </div>
              </Box>
              <h2 style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '30px' }} className='text-xl text-gray-200 font-bold mt-2'>Gaia Bond</h2>
              <p style={{ marginBottom: '20px'}} className='text-base text-gray-400'>GBOND</p>
              {/* 10,000 GBOND */}
              <div className='rounded-md bg-gaiagray h-40 p-5 w-full flex-col flex items-center mt-16'>
                <p className='text-base text-gray-300'>Current Price</p>
                <Box>
                  <span style={{ fontSize: '30px', color: 'white' }}>
                    {gBondPriceInBNB ? gBondPriceInBNB : '-.----'} BNB
                  </span>
                </Box>
                <Box>
                  <span style={{ fontSize: '16px', color: 'white' }}>${gBondPriceInDollars ? gBondPriceInDollars : '-.--'} / GBOND</span>
                </Box>
              </div>
              <div style={{ fontSize: '12px' }} className="space-y-3 w-full my-10">
                <p className='flex w-full justify-between text-base text-gray-400'>
                  Market Cap:
                  <span className='font-bold text-white'>
                    ${roundAndFormatNumber((gBondCirculatingSupply * gBondPriceInDollars).toFixed(2), 2)}
                  </span>
                </p>
                <p className='flex w-full justify-between text-base text-gray-400'>
                  Circulating Supply: 
                  <span className='font-bold text-white'>
                    {roundAndFormatNumber(gBondCirculatingSupply, 2)}
                  </span>
                </p> 
                  <p className='flex w-full justify-between text-base text-gray-400'>
                    Total Supply:
                    <span className='font-bold text-white'>
                      {roundAndFormatNumber(gBondTotalSupply, 2)}
                    </span> 
                  </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
        {/* <Grid item xs={12} sm={6}>
          <Card>
            <CardContent align="center">
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="GAIA-BNB-LP" />
                </CardIcon>
              </Box>
              <h2>GAIA-BNB PancakeSwap LP</h2>
              <Box mt={2}>
                <Button disabled onClick={onPresentBombZap} className="shinyButtonDisabledSecondary">
                  Zap In
                </Button>
              </Box>
              <Box mt={2}>
                <span style={{ fontSize: '26px' }}>
                  {gaiaLPStats?.tokenAmount ? gaiaLPStats?.tokenAmount : '-.--'} GAIA /{' '}
                  {gaiaLPStats?.ftmAmount ? gaiaLPStats?.ftmAmount : '-.--'} WBNB
                </span>
              </Box>
              <Box>${gaiaLPStats?.priceOfOne ? gaiaLPStats.priceOfOne : '-.--'}</Box>
              <span style={{ fontSize: '12px' }}>
                Liquidity: ${gaiaLPStats?.totalLiquidity ? roundAndFormatNumber(gaiaLPStats.totalLiquidity, 2) : '-.--'}{' '}
                <br />
                Total Supply: {gaiaLPStats?.totalSupply ? roundAndFormatNumber(gaiaLPStats.totalSupply, 2) : '-.--'}
              </span>
            </CardContent>
          </Card>
        </Grid> */}
        {/* <Grid item xs={12} sm={6}>
          <Card>
            <CardContent align="center">
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="GSHARE-BNB-LP" />
                </CardIcon>
              </Box>
              <h2>GSHARE-BNB PancakeSwap LP</h2>
              <Box mt={2}>
                <Button onClick={onPresentBshareZap} className="shinyButtonSecondary">
                  Zap In
                </Button>
              </Box>
              <Box mt={2}>
                <span style={{ fontSize: '26px' }}>
                  {gshareLPStats?.tokenAmount ? gshareLPStats?.tokenAmount : '-.--'} GSHARE /{' '}
                  {gshareLPStats?.ftmAmount ? gshareLPStats?.ftmAmount : '-.--'} BNB
                </span>
              </Box>
              <Box>${gshareLPStats?.priceOfOne ? gshareLPStats.priceOfOne : '-.--'}</Box>
              <span style={{ fontSize: '12px' }}>
                Liquidity: $
                {gshareLPStats?.totalLiquidity ? roundAndFormatNumber(gshareLPStats.totalLiquidity, 2) : '-.--'}
                <br />
                Total Supply: {gshareLPStats?.totalSupply ? roundAndFormatNumber(gshareLPStats.totalSupply, 2) : '-.--'}
              </span>
            </CardContent>
          </Card>
        </Grid> */}
      </Grid>
    </Page>
  );
};

export default Home;
