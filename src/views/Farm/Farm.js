import React, { useEffect, useState } from 'react';
import { useWallet } from 'use-wallet';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import Bank from '../Bank';

import { Box, Container, Typography, Grid } from '@material-ui/core';

import { Alert } from '@material-ui/lab';

import UnlockWallet from '../../components/UnlockWallet';
import Page from '../../components/Page';
import FarmCard from './FarmCard';
//import FarmImage from '../../assets/img/farm.png';
import { createGlobalStyle } from 'styled-components';

import useBanks from '../../hooks/useBanks';
import { Helmet } from 'react-helmet'

import HomeImage from '../../assets/img/bg2.svg';
import { FarmItem } from './components/FarmItem';
import gaiaLogo from '../../assets/logos/gaia.png';
import CountUp from 'react-countup';
import useStatsForPool from '../../hooks/useStatsForPool';

const BackgroundImage = createGlobalStyle`
  body {
    background: url(${HomeImage}) repeat fixed !important;
    background-size: cover !important;
    background-color: #171923;
  }
`;

const TITLE = 'bomb.money | Farms'


const Farm = () => {
  const [banks] = useBanks();
  const { path } = useRouteMatch();
  const { account } = useWallet();
  const activeBanks = banks.filter((bank) => !bank.finished);  

  const [displayState, setDisplayState] = useState(banks.filter((bank) => bank.sectionInUI === 1));
  const [activeBtnState, setactiveBtnState] = useState("gaia")

 
  // const statsOnPool = displayState.forEach(bank => useStatsForPool(bank))

  const handleSwitch = (page) => {
    if (page === "gaia"){
      setDisplayState(banks.filter((bank) => bank.sectionInUI === 1))
      setactiveBtnState("gaia")
      banks.filter((bank) => bank.sectionInUI === 1)
    }else if (page === "gshare"){
      setDisplayState(banks.filter((bank) => bank.sectionInUI === 2))
      setactiveBtnState("gshare")
    }
  }

  

  return (
    <Switch>
      <Page>

        <Route exact path={path}>
          <BackgroundImage />
          <Helmet>
            <title>{TITLE}</title>
          </Helmet>
          {!!account ? (
            <div>
              {/* <Typography color="textYellow" align="center" variant="h3" gutterBottom>
                Farm
              </Typography> */}
              <div className='flex w-full border-b border-gaiagray'>
                <button
                onClick={() => handleSwitch("gaia")}
                className={`p-3 rounded-t-md outline-none ${activeBtnState === 'gaia' ? 'bg-gaiagray' : 'bg-gray-600' } flex text-white space-x-1 items-center`}>
                  <img
                  alt="bomb.money"
                  src={gaiaLogo}
                  style={{height: '20px'}}
                  />
                  <span>Earn GAIA</span>
                </button>
                <button 
                onClick={() => handleSwitch("gshare")}
                className={`p-3 rounded-t-md outline-none ${activeBtnState === 'gshare' ? 'bg-gaiagray' : 'bg-gray-600'} flex text-white space-x-1 items-center`}>
                  <img
                  alt="bomb.money"
                  src={gaiaLogo}
                  style={{height: '20px'}}
                  />
                  <span>Earn GSHARE</span>
                </button>
              </div>

              <main className='flex justify-between'>
                <section className='w-full md:w-9/12'>
                  <div className='py-7 rounded-md flex justify-between items-center mb-10'>
                    <div className='text-white'>
                      <p className='mb-3 font-bold text-4xl'>Pick a bank</p>
                      <p classNmae='text-base'>Earn GAIA by providing liquidity</p>
                    </div>
                    <img
                      alt="bomb.money"
                      src={gaiaLogo}
                      style={{height: '84px'}}
                      />
                  </div>
                  
                  {displayState
                    .map((bank) => ( 
                      <React.Fragment key={bank.name}>
                        <FarmItem bank={bank}/>
                      </React.Fragment>
                    ))
                    }
                </section>
                
                  <section style={{flexDirection: "column"}} className="ml-7 mt-7 w-full md:w-1/4" >
                    <div className="border-gray-700 border rounded-md p-5 w-full mb-5 h-32 flex flex-col justify-center">
                      <div align="left">
                        <Typography style={{ textTransform: 'uppercase', color: '#fff', fontSize: '12px', marginBottom: '10px' }}>Total value locked</Typography>
                        <Typography className="text-primary text-lg">$14</Typography>
                        {/* <CountUp style={{ fontSize: '25px' }} end={statsOnPool.TVL} separator="," prefix="$" /> */}
                      </div>
                    </div>
                    <div className="border-gray-700 border rounded-md p-5 w-full mb-5 h-32 flex flex-col justify-center">
                      <div align="left">
                        <Typography style={{ textTransform: 'uppercase', color: '#fff', fontSize: '12px', marginBottom: '10px' }}>Deposited</Typography>
                        <Typography className="text-primary text-lg">$0.0</Typography>
                      </div>
                    </div>
                    {/* <div className="border-gray-700 border rounded-md p-5 w-full mb-5 h-32 flex flex-col justify-center">
                      <div align="left">
                        <Typography style={{ textTransform: 'uppercase', color: '#fff', fontSize: '12px', marginBottom: '10px' }}>Current Epoch</Typography>
                        <Typography className="text-primary text-lg">23</Typography>
                      </div>
                    </div> */}
                    {/* <div className="border-gray-700 border rounded-md p-5 w-full mb-5 h-32 flex flex-col justify-center">
                      <div align="left">
                        <Typography style={{ textTransform: 'uppercase', color: '#fff', fontSize: '12px', marginBottom: '10px' }}>Current Epoch</Typography>
                        <Typography className="text-primary text-lg">23</Typography>
                      </div>
                    </div> */}
                  
                </section>
              </main>
              {/* <Box mt={5}> */}
                {/* <div hidden={banks.filter((bank) => bank.sectionInUI === 2).length === 0}>
                  
                
                  <Typography color="textYellow" align="center" variant="h4" gutterBottom>
                    Earn GSHARE by staking PancakeSwap LP
                  </Typography>
                 
                  <Grid container spacing={3} style={{ marginTop: '20px' }}>
                    {!activeBanks
                      .filter((bank) => bank.sectionInUI === 2)
                      .map((bank) => (
                        <React.Fragment key={bank.name}>
                          <FarmCard bank={bank} />
                        </React.Fragment>
                      ))}
                  </Grid>
                </div> */}

                {/* <div hidden={banks.filter((bank) => bank.sectionInUI === 1).length === 0}>
                
                  <Typography color="textPrimary" variant="h4" gutterBottom style={{ marginTop: '20px' }}>
                    Inactive ApeSwap Farms
                  </Typography>
                  
                  <h2 className='text-white'>Hello</h2>
                  <Grid container spacing={3} style={{ marginTop: '20px', display: 'flex', alignItems: 'center' }}>
                    {activeBanks
                      .filter((bank) => bank.sectionInUI === 1)
                      .map((bank) => (
                        <React.Fragment key={bank.name}>
                          <FarmCard bank={bank} />
                        </React.Fragment>
                      ))}
                  </Grid>
                </div> */}
{/* 
                <div hidden={banks.filter((bank) => bank.sectionInUI === 0).length === 0}>
                
                  <Typography color="textPrimary" variant="h4" gutterBottom style={{ marginTop: '20px' }}>
                    Genesis Pools
                  </Typography>
                  <Alert variant="filled" severity="warning">
                    Genesis pools have ended. Please claim all rewards and remove funds from Genesis pools.
                  </Alert>
                  <Grid container spacing={3} style={{ marginTop: '20px' }}>
                    {activeBanks
                      .filter((bank) => bank.sectionInUI === 0)
                      .map((bank) => (
                        <React.Fragment key={bank.name}>
                          <FarmCard bank={bank} />
                        </React.Fragment>
                      ))}
                  </Grid>
                </div> */}
              {/* </Box> */}
            </div>
            )
           : (
             <UnlockWallet />
           )} 
        </Route>
        <Route path={`${path}/:bankId`}>
          <BackgroundImage />
          <Bank />
        </Route>
      </Page>
    </Switch>
  );
};

export default Farm;
