import React, {useCallback, useMemo} from 'react';
import Page from '../../components/Page';
import {createGlobalStyle} from 'styled-components';
import {Route, Switch, useRouteMatch} from 'react-router-dom';
import {useWallet} from 'use-wallet';
import UnlockWallet from '../../components/UnlockWallet';
import PageHeader from '../../components/PageHeader';
import ExchangeCard from './components/ExchangeCard';
import styled from 'styled-components';
import Spacer from '../../components/Spacer';
import useBondStats from '../../hooks/useBondStats';
//import useBombStats from '../../hooks/useBombStats';
import useBombFinance from '../../hooks/useBombFinance';
import useCashPriceInLastTWAP from '../../hooks/useCashPriceInLastTWAP';
import {useTransactionAdder} from '../../state/transactions/hooks';
import ExchangeStat from './components/ExchangeStat';
import useTokenBalance from '../../hooks/useTokenBalance';
import useBondsPurchasable from '../../hooks/useBondsPurchasable';
import {getDisplayBalance} from '../../utils/formatBalance';
import { BOND_REDEEM_PRICE, BOND_REDEEM_PRICE_BN } from '../../bomb-finance/constants';
import { Alert } from '@material-ui/lab';


import HomeImage from '../../assets/img/bg2.svg';
import { Grid, Box } from '@material-ui/core';
import { Helmet } from 'react-helmet';
const BackgroundImage = createGlobalStyle`
  body {
    background: url(${HomeImage}) repeat fixed !important;
    background-size: cover !important;
    background-color: #171923;
  }
`;
const TITLE = 'bomb.money | Bonds'

const Bond: React.FC = () => {
  const {path} = useRouteMatch();
  const {account} = useWallet();
  const bombFinance = useBombFinance();
  const addTransaction = useTransactionAdder();
  const bondStat = useBondStats();
  console.log('Bond stat', !bondStat)
  //const bombStat = useBombStats();
  const cashPrice = useCashPriceInLastTWAP();

  const bondsPurchasable = useBondsPurchasable();

  const bondBalance = useTokenBalance(bombFinance?.GBOND);
  //const scalingFactor = useMemo(() => (cashPrice ? Number(cashPrice) : null), [cashPrice]);

  const handleBuyBonds = useCallback(
    async (amount: string) => {
      const tx = await bombFinance.buyBonds(amount);
      addTransaction(tx, {
        summary: `Buy ${Number(amount).toFixed(2)} GBOND with ${amount} GAIA`,
      });
    },
    [bombFinance, addTransaction],
  );

  const handleRedeemBonds = useCallback(
    async (amount: string) => {
      const tx = await bombFinance.redeemBonds(amount);
      addTransaction(tx, {summary: `Redeem ${amount} GBOND`});
    },
    [bombFinance, addTransaction],
  );
  const isBondRedeemable = useMemo(() => cashPrice.gt(BOND_REDEEM_PRICE_BN), [cashPrice]);
  const isBondPurchasable = useMemo(() => Number(bondStat?.tokenInBnb) < 1.01, [bondStat]);
  const isBondPayingPremium = useMemo(() => Number(bondStat?.tokenInBnb) >= 1.1, [bondStat]);

  console.log(Number(bondStat?.tokenInBnb) < 1.01, [bondStat])
// console.log("bondstat", Number(bondStat?.tokenInBnb))
  const bondScale = (Number(cashPrice) / 1000000000000000000).toFixed(4); 

  return (
    <Switch>
      <Page>
        <BackgroundImage />
              <Helmet>
        <title>{TITLE}</title>
      </Helmet>
        {!!account ? (
          <div className='mx-0 md:mx-20'>
            <Route exact path={path}>
              {/* <PageHeader icon={'💣'} title="Buy &amp; Redeem Bonds" subtitle="Earn premiums upon redemption" /> */}
              <div className='bg-black p-5 mb-20 flex sm:flex-row md:flex-row flex-col justify-between items-center border-b-4 border-gaiagray rounded-md'>
                <div>
                  <h2 className='text-white font-bold text-3xl mb-5'>Buy &amp; Redeem Bonds</h2>
                  <p className='text-white text-base'>Earn premiums upon redemption</p>
                </div>
                <div className='flex md:flex-row sm:flex-row flex-col md:space-x-9'>
                  <ExchangeStat
                    tokenName="GAIA"
                    description="Last-Hour TWAP Price"
                    // price={Number(bondStat?.tokenInBnb).toFixed(4) || '-'}
                  price={bondScale || '-'}

                  />
                  <ExchangeStat
                    tokenName="GBOND"
                    description="Current Price: (GAIA)^2"
                    price= {  !(bondStat?.tokenInBnb) ? "-----_-" : (Number(bondStat?.tokenInBnb).toFixed(4) || '-') }
                  />
                </div>
              </div>
            </Route>
            {isBondPayingPremium === false ? (


              <Box mt={5}>
                <Grid item xs={12} sm={12} justify="center" style={{ margin: '18px', display: 'flex' }}>
                <Alert variant="filled" severity="error">
                    <b>
                      Claiming below 1.1 peg will not receive a redemption bonus, claim wisely!</b>
              </Alert>
            
              </Grid>
              </Box>
            ) : <></>}
          
            <StyledBond>
              <StyledCardWrapper>
                <ExchangeCard
                  action="Purchase"
                  fromToken={bombFinance.GAIA}
                  fromTokenName="GAIA"
                  toToken={bombFinance.GBOND}
                  toTokenName="GBOND"
                  priceDesc={
                    !isBondPurchasable
                      ? 'GAIA is over peg'
                      : getDisplayBalance(bondsPurchasable, 18, 4) + ' GBOND available for purchase'
                  }
                  onExchange={handleBuyBonds}
                  disabled={!bondStat || isBondRedeemable}
                />
              </StyledCardWrapper>
              <StyledCardWrapper>
                <ExchangeCard
                  action="Redeem"
                  fromToken={bombFinance.GBOND}
                  fromTokenName="GBOND"
                  toToken={bombFinance.GAIA}
                  toTokenName="GAIA"
                  priceDesc={`${getDisplayBalance(bondBalance)} GBOND Available in wallet`}
                  onExchange={handleRedeemBonds}
                  disabled={!bondStat || bondBalance.eq(0) || !isBondRedeemable}
                  disabledDescription={!isBondRedeemable ? `Enabled when 10,000 GAIA > ${BOND_REDEEM_PRICE}BTC` : null}
                />
              </StyledCardWrapper>
            </StyledBond>
          </div>
        ) : (
          <UnlockWallet />
        )}
      </Page>
    </Switch>
  );
};

const StyledBond = styled.div`
  display: flex;
  @media (max-width: 768px) {
    width: 100%;
    flex-flow: column nowrap;
    align-items: center;
  }
`;

const StyledCardWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StyledStatsWrapper = styled.div`
  display: flex;
  flex: 0.8;
  margin: 0 20px;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 80%;
    margin: 16px 0;
  }
`;

export default Bond;
