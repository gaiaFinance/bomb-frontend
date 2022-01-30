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

import HomeImage from '../../assets/img/background.jpg';
const BackgroundImage = createGlobalStyle`
  body {
    background: url(${HomeImage}) repeat !important;
    background-size: cover !important;
    background-color: #171923;
  }
`;
const TITLE = 'bomb.money | BTC pegged algocoin'

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
  const bombBnbLpStats = useLpStatsBTC('GAIA-WBNB-LP');
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
  const gaiaLPStats = useMemo(() => (bombBnbLpStats ? bombBnbLpStats : null), [bombBnbLpStats]);
  const gshareLPStats = useMemo(() => (bShareBnbLpStats ? bShareBnbLpStats : null), [bShareBnbLpStats]);
  const bombPriceInDollars = useMemo(
    () => (bombStats ? Number(bombStats.priceInDollars).toFixed(2) : null),
    [bombStats],
  );
  const bombPriceInBNB = useMemo(() => (bombStats ? Number(bombStats.tokenInFtm).toFixed(4) : null), [bombStats]);
  const bombCirculatingSupply = useMemo(() => (bombStats ? String(bombStats.circulatingSupply) : null), [bombStats]);
  const bombTotalSupply = useMemo(() => (bombStats ? String(bombStats.totalSupply) : null), [bombStats]);

  const bSharePriceInDollars = useMemo(
    () => (bShareStats ? Number(bShareStats.priceInDollars).toFixed(2) : null),
    [bShareStats],
  );
  const bSharePriceInBNB = useMemo(
    () => (bShareStats ? Number(bShareStats.tokenInFtm).toFixed(4) : null),
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
  const gBondPriceInBNB = useMemo(() => (tBondStats ? Number(tBondStats.tokenInFtm).toFixed(4) : null), [tBondStats]);
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
        {/* Logo */}
        <Grid
          item
          xs={12}
          sm={4}
          style={{ display: 'flex', justifyContent: 'center', verticalAlign: 'middle', overflow: 'hidden' }}
        >
          <img src={BombImage} alt='Bomb.money' style={{ maxHeight: '240px' }} />
        </Grid>
        {/* Explanation text */}
        <Grid item xs={12} sm={8}>
          <Paper>
            <Box p={4} style={{ textAlign: 'center' }}>
              <h2 className='bg-red-900'>Welcome to Gaia.finance</h2>
              <p>
              The first algorithmic token pegged to BNB running on Binance Smart Chain. 
              Completely decentralized on-chain governance.
              </p>
              <p>
                <strong>GAIA is pegged via algorithm to a 10,000:1 ratio to BTC. $100k BTC = $10 GAIA PEG</strong>
                {/* Stake your GAIA-BTC LP in the Farm to earn GSHARE rewards. Then stake your earned GSHARE in the
                Boardroom to earn more GAIA! */}
              </p>
              <p>
                <IconTelegram alt="telegram" style={{ fill: '#dddfee', height: '15px' }} /> Join our{' '}
                <a
                  href="https://t.me/bombmoneybsc"
                  rel="noopener noreferrer"
                  target="_blank"
                  style={{ color: '#dddfee' }}
                >
                  Telegram
                </a>{' '}
                to find out more!
              </p>
              <button>
                <a href="https://docs.gaiafinance.io/why-gaia.finance">Read More</a>
              </button>
            </Box>
          </Paper>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={12} justify="center" style={{ margin: '12px', display: 'flex' }}>

            <Alert variant="filled" severity="info">
              <strong>Please Note:</strong> We were not impacted by any of the recent exploits. &nbsp;
              <a rel="noopener noreferrer" href="https://medium.com/@bombbshare/dec-18-quick-update-regarding-grim-exploit-4f1a0c989fba" target="_blank">
                Read more here.
              </a>

            </Alert>

          </Grid>
        </Grid>

        {/* TVL */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center">
              <h2>Total Value Locked</h2>
              <CountUp style={{ fontSize: '25px' }} end={TVL} separator="," prefix="$" />
            </CardContent>
          </Card>
        </Grid>

        {/* Wallet */}
        <Grid item xs={12} sm={8}>
          <Card style={{ height: '100%' }}>
            <CardContent align="center" style={{ marginTop: '2.5%' }}>
              {/* <h2 style={{ marginBottom: '20px' }}>Wallet Balance</h2> */}
              <Button href="/boardroom" className="shinyButton" style={{ margin: '10px' }}>
                Stake Now
              </Button>
              <Button href="/farm" className="shinyButton" style={{ margin: '10px' }}>
                Farm Now
              </Button>
              <Button
                target="_blank"
                href={buyBombAddress}
                style={{ margin: '10px' }}
                className={'shinyButton ' + classes.button}
              >
                Buy GAIA
              </Button>
              <Button
                target="_blank"
                href={buyBShareAddress}
                className={'shinyButton ' + classes.button}
                style={{ marginLeft: '10px' }}
              >
                Buy GSHARE
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* GAIA */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center" style={{ position: 'relative' }}>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="GAIA" />
                </CardIcon>
              </Box>
              <Button
                onClick={() => {
                  bombFinance.watchAssetInMetamask('GAIA');
                }}
                style={{ position: 'absolute', top: '10px', right: '10px', border: '1px grey solid' }}
              >
                {' '}
                <b>+</b>&nbsp;&nbsp;
                <img alt="metamask fox" style={{ width: '20px', filter: 'grayscale(100%)' }} src={MetamaskFox} />
              </Button>
              <h2 style={{ marginBottom: '10px' }}>GAIA</h2>
              10,000 GAIA (1.0 Peg) =
              <Box>
                <span style={{ fontSize: '30px', color: 'white' }}>{bombPriceInBNB ? bombPriceInBNB : '-.----'} BNB</span>
              </Box>
              <Box>
                <span style={{ fontSize: '16px', alignContent: 'flex-start' }}>
                  ${bombPriceInDollars ? roundAndFormatNumber(bombPriceInDollars, 2) : '-.--'} / GAIA
                </span>
              </Box>
              <span style={{ fontSize: '12px' }}>
                Market Cap: ${roundAndFormatNumber(bombCirculatingSupply * bombPriceInDollars, 2)} <br />
                Circulating Supply: {roundAndFormatNumber(bombCirculatingSupply, 2)} <br />
                Total Supply: {roundAndFormatNumber(bombTotalSupply, 2)}
              </span>
            </CardContent>
          </Card>
        </Grid>

        {/* GSHARE */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center" style={{ position: 'relative' }}>
              <Button
                onClick={() => {
                  bombFinance.watchAssetInMetamask('GSHARE');
                }}
                style={{ position: 'absolute', top: '10px', right: '10px', border: '1px grey solid' }}
              >
                {' '}
                <b>+</b>&nbsp;&nbsp;
                <img alt="metamask fox" style={{ width: '20px', filter: 'grayscale(100%)' }} src={MetamaskFox} />
              </Button>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="GSHARE" />
                </CardIcon>
              </Box>
              <h2 style={{ marginBottom: '10px' }}>GSHARE</h2>
              Current Price
              <Box>
                <span style={{ fontSize: '30px', color: 'white' }}>
                  {bSharePriceInBNB ? bSharePriceInBNB : '-.----'} BNB
                </span>
              </Box>
              <Box>
                <span style={{ fontSize: '16px' }}>${bSharePriceInDollars ? bSharePriceInDollars : '-.--'} / GSHARE</span>
              </Box>
              <span style={{ fontSize: '12px' }}>
                Market Cap: ${roundAndFormatNumber((bShareCirculatingSupply * bSharePriceInDollars).toFixed(2), 2)}{' '}
                <br />
                Circulating Supply: {roundAndFormatNumber(bShareCirculatingSupply, 2)} <br />
                Total Supply: {roundAndFormatNumber(bShareTotalSupply, 2)}
              </span>
            </CardContent>
          </Card>
        </Grid>

        {/* GBOND */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center" style={{ position: 'relative' }}>
              <Button
                onClick={() => {
                  bombFinance.watchAssetInMetamask('GBOND');
                }}
                style={{ position: 'absolute', top: '10px', right: '10px', border: '1px grey solid' }}
              >
                {' '}
                <b>+</b>&nbsp;&nbsp;
                <img alt="metamask fox" style={{ width: '20px', filter: 'grayscale(100%)' }} src={MetamaskFox} />
              </Button>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="GBOND" />
                </CardIcon>
              </Box>
              <h2 style={{ marginBottom: '10px' }}>GBOND</h2>
              10,000 GBOND
              <Box>
                <span style={{ fontSize: '30px', color: 'white' }}>
                  {gBondPriceInBNB ? gBondPriceInBNB : '-.----'} BTC
                </span>
              </Box>
              <Box>
                <span style={{ fontSize: '16px' }}>${gBondPriceInDollars ? gBondPriceInDollars : '-.--'} / GBOND</span>
              </Box>
              <span style={{ fontSize: '12px' }}>
                Market Cap: ${roundAndFormatNumber((gBondCirculatingSupply * gBondPriceInDollars).toFixed(2), 2)} <br />
                Circulating Supply: {roundAndFormatNumber(gBondCirculatingSupply, 2)} <br />
                Total Supply: {roundAndFormatNumber(gBondTotalSupply, 2)}
              </span>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
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
        </Grid>
        <Grid item xs={12} sm={6}>
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
        </Grid>
      </Grid>
    </Page>
  );
};

export default Home;
