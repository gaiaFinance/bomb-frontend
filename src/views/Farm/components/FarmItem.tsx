import React, { useCallback, useMemo, useState} from 'react'
import gaiaLogo from '../../../assets/logos/gaia.png';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import useStatsForPool from '../../../hooks/useStatsForPool';
import { getDisplayBalance, getFullDisplayBalance } from '../../../utils/formatBalance';
import useTokenBalance from '../../../hooks/useTokenBalance';
import DepositOrWithdrawal from './DepositOrWithdrawal';
import { Bank } from '../../../bomb-finance';
import useBombStats from '../../../hooks/useBombStats';
import useEarnings from '../../../hooks/useEarnings';
import useShareStats from '../../../hooks/usebShareStats';
import useHarvest from '../../../hooks/useHarvest';
import useStakedBalance from '../../../hooks/useStakedBalance';

interface FarmItemProps  {
    bank: Bank;
}



export const FarmItem = ({bank}:FarmItemProps) => {
    const bombStats = useBombStats();
    const tokenBalance = useTokenBalance(bank.depositToken)
    const earnings = useEarnings(bank.contract, bank.earnTokenName, bank.poolId);
    const tShareStats = useShareStats();
    const {onReward} = useHarvest(bank);
    const [isInner, setIsInner] = useState(false)
    const statsOnPool = useStatsForPool(bank)
    const [val, setVal] = useState('');

    const stakedBalance = useStakedBalance(bank.contract, bank.poolId);

    const tokenName = bank.earnTokenName === 'GSHARE' ? 'GSHARE' : 'GAIA';
    const tokenStats = bank.earnTokenName === 'GSHARE' ? tShareStats : bombStats;

    const tokenPriceInDollars = useMemo(
        () => (tokenStats ? Number(tokenStats.priceInDollars).toFixed(2) : null),
        [tokenStats],
      );

    const earnedInDollars = (Number(tokenPriceInDollars) * Number(getDisplayBalance(earnings))).toFixed(2);
    

    
  

    const decimals = bank.depositToken.decimal
    const fullBalance = useMemo(() => {
        return getFullDisplayBalance(tokenBalance, decimals, false);
    }, [tokenBalance, decimals]);



    const handleChange = useCallback(
        (e: React.FormEvent<HTMLInputElement>) => {
        setVal(e.currentTarget.value);
        },
        [setVal],
    );
    const handleSelectMax = useCallback(() => {
        setVal(fullBalance);
    }, [fullBalance, setVal]);

  

    return(
        // container
        <div className={`rounded-md mb-5`}>
            {/* outer */}
            <div className={`flex items-center justify-between border-b border-gray-700 bg-gaiagray h-full text-white rounded-md ${isInner ? 'rounded-b-none' : 'rounded-b-md'}`}>
                <div className="flex item-center">
                    <div className="flex items-center justify-center p-3 pb-1 pl-3">
                        <img
                        alt="bomb.money"
                        src={gaiaLogo}
                        style={{height: '40px'}}
                        />
                    </div>
                    <div className='p-3 pb-1'>
                        <h3 className='font-bold text-base mb-1'>{bank.depositTokenName}</h3>
                        <p className='text-gray-400 mb-1' >No lockup</p>
                        <p className='text-gray-400 mb-1' >Deposit Fee 0%</p>
                    </div>
                </div>
                <div className="flex space-x-9 w-5/12 justify-between p-3 pb-1">
                    <div>
                        <p className='text-gray-400'>You Deposited</p>
                        <p className='font-bold text-lg mt-2'>~${getDisplayBalance(stakedBalance, bank.depositToken.decimal)}</p>
                    </div>
                    <div>
                        <p className='text-gray-400'>TVL</p>
                        <p className='font-bold text-primary mt-2'>${statsOnPool?.TVL}</p>
                    </div>
                    <div>
                        <p className='text-gray-400'>APR</p>
                        <p className='font-bold text-primary mt-2'>{bank.closedForStaking ? '0.00' : statsOnPool?.yearlyAPR}%
                        </p>
                    </div>
                </div>
                <div className='border-l border-gray-500 flex items-center justify-center h-full w-1/12 p-3 pb-1 pr-3 cursor-pointer' onClick={() => setIsInner(!isInner)}>
                    {isInner ? <FiChevronUp size={20} color="white" /> : <FiChevronDown size={20} color="white" />}
                    
                </div>
            </div>
            {/* innner */}
            {isInner &&
               (<div className="flex justify-between p-5 bg-transparent border border-t-0 border-gaiagray rounded-b-md">
                   <DepositOrWithdrawal 
                    val={val}
                    onChange={handleChange}
                    onSelectMax={handleSelectMax}
                    bank={bank}
                   />
                    <div className='rounded-md w-1/2 mx-5 border border-gray-500'>
                        <p className='p-3 text-center text-white border-b border-gray-500'>Pending reward</p>
                        <div className='p-5'>
                            <div className='bg-gaiagray p-5 rounded-md items-center justify-center flex flex-col space-y-5 w-full'>
                                <img
                                alt="bomb.money"
                                src={gaiaLogo}
                                style={{height: '40px'}}
                                />
                                <p className='text-3xl text-center text-white w-full'>{getDisplayBalance(earnings)} {tokenName}</p>
                                <p className='text-lg text-center text-primary w-full'>~${earnedInDollars}</p>
                            </div>
                            <div className='w-full flex flex-col items-center justify-center mt-5'>
                                <button 
                                onClick={onReward}
                                disabled={earnings.eq(0)}
                                className={
                                    `${earnings.eq(0) ? 'bg-gray-400 text-white' : 'bg-primary text-black'} rounded-md w-full p-2 font-bold`}>Claim</button>
                            </div>
                        </div>
                    </div>
                </div>)
            }
        </div>
    )
}