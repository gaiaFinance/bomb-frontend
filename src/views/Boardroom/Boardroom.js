import React, { useMemo } from 'react';
import { useWallet } from 'use-wallet';
import moment from 'moment';
import styled from 'styled-components';
import Spacer from '../../components/Spacer';
import Harvest from './components/Harvest';
import Stake from './components/Stake';
import { makeStyles } from '@material-ui/core/styles';

import { Box, Card, CardContent, Button, Typography, Grid } from '@material-ui/core';

//import { Alert } from '@material-ui/lab';

import UnlockWallet from '../../components/UnlockWallet';
import Page from '../../components/Page';

import useRedeemOnBoardroom from '../../hooks/useRedeemOnBoardroom';
import useStakedBalanceOnBoardroom from '../../hooks/useStakedBalanceOnBoardroom';
import { getDisplayBalance } from '../../utils/formatBalance';
import useCurrentEpoch from '../../hooks/useCurrentEpoch';
import useFetchBoardroomAPR from '../../hooks/useFetchBoardroomAPR';

import useCashPriceInEstimatedTWAP from '../../hooks/useCashPriceInEstimatedTWAP';
import useTreasuryAllocationTimes from '../../hooks/useTreasuryAllocationTimes';
import useTotalStakedOnBoardroom from '../../hooks/useTotalStakedOnBoardroom';
import useClaimRewardCheck from '../../hooks/boardroom/useClaimRewardCheck';
import useWithdrawCheck from '../../hooks/boardroom/useWithdrawCheck';
import ProgressCountdown from './components/ProgressCountdown';
import { createGlobalStyle } from 'styled-components';
import { Helmet } from 'react-helmet'

import HomeImage from '../../assets/img/bg2.svg';
const BackgroundImage = createGlobalStyle`
  body {
    background: url(${HomeImage}) repeat fixed !important;
    background-size: cover !important;
    background-color: #171923;
  }
`;
const TITLE = 'bomb.money | Boardroom'

const useStyles = makeStyles((theme) => ({
  gridItem: {
    height: '100%',
    [theme.breakpoints.up('md')]: {
      height: '90px',
    },
  },
}));

const Boardroom = () => {
  const classes = useStyles();
  const { account } = useWallet();
  const { onRedeem } = useRedeemOnBoardroom();
  const stakedBalance = useStakedBalanceOnBoardroom();
  const currentEpoch = useCurrentEpoch();
  const cashStat = useCashPriceInEstimatedTWAP();
  const totalStaked = useTotalStakedOnBoardroom();
  const boardroomAPR = useFetchBoardroomAPR();
  const canClaimReward = useClaimRewardCheck();
  const canWithdraw = useWithdrawCheck();
  const scalingFactor = useMemo(() => (cashStat ? Number(cashStat.priceInDollars).toFixed(4) : null), [cashStat]);
  const { to } = useTreasuryAllocationTimes();

  return (
    <Page>
      <BackgroundImage />
      <Helmet>
        <title>{TITLE}</title>
      </Helmet>
      {!!account ? (
        <>
          {/* <Typography color="textPrimary" align="center" variant="h3" gutterBottom>
            Boardroom
          </Typography> */}
          <Box mt={5} className="flex md:flex-row flex-col">
            <div style={{flexDirection: "column"}} className="w-full md:w-1/4 mr-5" >
                <div className="border-gray-700 border rounded-md p-3 w-full mb-5 h-32 flex flex-col justify-center">
                  <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'left' }}>
                    <Typography style={{ textTransform: 'uppercase', color: '#fff', fontSize: '12px', marginBottom: '10px' }}>Next Epoch</Typography>
                    <ProgressCountdown base={moment().toDate()} hideBar={true} deadline={to} description="Next Epoch" style={{color: 'yellow', fontSize: '20px'}} />
                  </div>
                </div>
                <div className="border-gray-700 border rounded-md p-5 w-full mb-5 h-32 flex flex-col justify-center">
                  <div align="left">
                    <Typography style={{ textTransform: 'uppercase', color: '#fff', fontSize: '12px', marginBottom: '10px' }}>Current Epoch</Typography>
                    <Typography className="text-primary text-lg">{Number(currentEpoch)}</Typography>
                  </div>
                </div>
                <div className="border-gray-700 border rounded-md p-5 w-full mb-5 h-32 flex flex-col justify-center">
                  <div align="left">
                    <Typography style={{ textTransform: 'uppercase', color: '#fff', fontSize: '12px', marginBottom: '10px' }}>
                      GAIA PEG <small>(TWAP)</small>
                    </Typography>
                    <Typography className="text-primary text-lg">{scalingFactor} BTC</Typography>
                    <Typography className="text-primary text-lg">
                      <small>per 10,000 GAIA</small>
                    </Typography>
                  </div>
                </div>
                <div className="border-gray-700 border rounded-md p-5 w-full mb-5 h-32 flex flex-col justify-center">
                  <div align="left">
                    <Typography style={{ textTransform: 'uppercase', color: '#fff', fontSize: '12px', marginBottom: '10px' }}>APR</Typography>
                    <Typography className="text-primary text-lg">{boardroomAPR.toFixed(2)}%</Typography>
                  </div>
                </div>
                <div className="border-gray-700 border rounded-md p-5 w-full mb-5 h-32 flex flex-col justify-center">
                  <div align="left">
                    <Typography style={{ textTransform: 'uppercase', color: '#fff', fontSize: '12px', marginBottom: '10px' }}>BSHARES Staked</Typography>
                    <Typography className="text-primary text-lg">{getDisplayBalance(totalStaked)}</Typography>
                  </div>
                </div>
            </div>

            {/* <Grid container justify="center">
              <Box mt={3} style={{ width: '600px' }}>
                <Alert variant="filled" severity="warning">
                  <b> Boardroom smart contract has been updated! </b><br />
                  If you have GSHARE in the previous Boardroom, visit here to retrieve it:<br />
                  <a href="https://61aadb35c5a5c50007c2a61b--bomb-money.netlify.app/boardroom">https://61aadb35c5a5c50007c2a61b--bomb-money.netlify.app/boardroom</a><br /><br />
                </Alert>

              </Box>
            </Grid> */}

            <div className='md:w-3/4 w-full'>
              <div>
                <StyledCardsWrapper>
                  <StyledCardWrapper>
                    <Harvest />
                  </StyledCardWrapper>
                  <Spacer />
                  <StyledCardWrapper>
                    <Stake />
                  </StyledCardWrapper>
                </StyledCardsWrapper>
              </div>
            </div>

            {/* <Grid container justify="center" spacing={3}>
            <Grid item xs={4}>
              <Card>
                <CardContent align="center">
                  <Typography>Rewards</Typography>

                </CardContent>
                <CardActions style={{justifyContent: 'center'}}>
                  <Button color="primary" variant="outlined">Claim Reward</Button>
                </CardActions>
                <CardContent align="center">
                  <Typography>Claim Countdown</Typography>
                  <Typography>00:00:00</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent align="center">
                  <Typography>Stakings</Typography>
                  <Typography>{getDisplayBalance(stakedBalance)}</Typography>
                </CardContent>
                <CardActions style={{justifyContent: 'center'}}>
                  <Button>+</Button>
                  <Button>-</Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid> */}
          </Box>

          <Box mt={5}>
            <Grid container justify="center" spacing={3} mt={10}>
              <Button
                disabled={stakedBalance.eq(0) || (!canWithdraw && !canClaimReward)}
                onClick={onRedeem}
                className={
                  stakedBalance.eq(0) || (!canWithdraw && !canClaimReward)
                    ? 'shinyButtonDisabledSecondary'
                    : 'shinyButtonSecondary'
                }
              >
                Claim &amp; Withdraw
              </Button>
            </Grid>
          </Box>
        </>
      ) : (
        <UnlockWallet />
      )}
    </Page>
  );
};

const StyledBoardroom = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StyledCardsWrapper = styled.div`
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

export default Boardroom;
