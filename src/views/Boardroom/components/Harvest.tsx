import React, {useMemo} from 'react';
import styled from 'styled-components';

import {Box, Button, Card, CardContent, Typography} from '@material-ui/core';

import TokenSymbol from '../../../components/TokenSymbol';
import Label from '../../../components/Label';
import Value from '../../../components/Value';
import CardIcon from '../../../components/CardIcon';
import useClaimRewardTimerBoardroom from '../../../hooks/boardroom/useClaimRewardTimerBoardroom';
import useClaimRewardCheck from '../../../hooks/boardroom/useClaimRewardCheck';
import ProgressCountdown from './ProgressCountdown';
import useHarvestFromBoardroom from '../../../hooks/useHarvestFromBoardroom';
import useEarningsOnBoardroom from '../../../hooks/useEarningsOnBoardroom';
import useBombStats from '../../../hooks/useBombStats';
import {getDisplayBalance} from '../../../utils/formatBalance';


interface stakeInfo  {
  h3: string,
  p1: string,
  p2?: string
}

export const StakeInfo = ({h3, p1, p2}: stakeInfo) => {
  return(
    <div className='p-5 border-gray-800 border rounded-md mt-7 h-72'>
        <div className='text-gray-400'>
          <h3 className='font-bold mb-7 text-white'>{h3}</h3>
          <p className='my-5'>{p1}</p>
          <p>{p2}</p>
        </div>
      </div>
  )
}

const Harvest: React.FC = () => {
  const bombStats = useBombStats();
  const {onReward} = useHarvestFromBoardroom();
  const earnings = useEarningsOnBoardroom();
  const canClaimReward = useClaimRewardCheck();

  const tokenPriceInDollars = useMemo(
    () => (bombStats ? Number(bombStats.priceInDollars).toFixed(2) : null),
    [bombStats],
  );

  const earnedInDollars = (Number(tokenPriceInDollars) * Number(getDisplayBalance(earnings))).toFixed(2);

  const {from, to} = useClaimRewardTimerBoardroom();

  return (
    <Box>
      <Card>
        <CardContent>
          <StyledCardContentInner>
            <StyledCardHeader>
              <CardIcon>
                <TokenSymbol symbol="GAIA" />
              </CardIcon>
              <Value value={getDisplayBalance(earnings)} />
              <Label text={`≈ $${earnedInDollars}`} variant="yellow" />
              <Label text="GAIA Earned" variant="yellow" />
            </StyledCardHeader>
            <StyledCardActions>
              <Button
                onClick={onReward}
                className={earnings.eq(0) || !canClaimReward ? 'shinyButtonDisabled' : 'shinyButton'}
                disabled={earnings.eq(0) || !canClaimReward}
              >
                Claim Reward
              </Button>
            </StyledCardActions>
          </StyledCardContentInner>
        </CardContent>
      </Card>
      <StakeInfo h3="Stake &amp; Unstake" p1=" There is a 2% tax fee per stake. The unstake fee is 0% during expansion, and 2% on contraction period. These fees will be used to buyback DARK." p2=" Upon stake, the fund will be locked for 6 epochs. Any time the user claims rewards or stakes more funds or unstakes fully/partially, both lock and reward counter will be reset."/>
      
      <Box mt={2} style={{color: '#FFF'}}>
        {canClaimReward ? (
          ''
        ) : (
          <Card>
            <CardContent>
              <Typography style={{textAlign: 'center'}}>Claim possible in</Typography>
              <ProgressCountdown hideBar={true} base={from} deadline={to} description="Claim available in" />
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

const StyledCardHeader = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
`;
const StyledCardActions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${(props) => props.theme.spacing[6]}px;
  width: 100%;
`;

const StyledCardContentInner = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
`;

export default Harvest;
