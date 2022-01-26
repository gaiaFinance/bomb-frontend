import {useEffect, useState} from 'react';
import useBombFinance from '../useBombFinance';
import {GShareSwapperStat} from '../../bomb-finance/types';
import useRefresh from '../useRefresh';

const useGShareSwapperStats = (account: string) => {
  const [stat, setStat] = useState<GShareSwapperStat>();
  const {fastRefresh /*, slowRefresh*/} = useRefresh();
  const bombFinance = useBombFinance();

  useEffect(() => {
    async function fetchGShareSwapperStat() {
      try {
        if (bombFinance.myAccount) {
          setStat(await bombFinance.getGShareSwapperStat(account));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchGShareSwapperStat();
  }, [setStat, bombFinance, fastRefresh, account]);

  return stat;
};

export default useGShareSwapperStats;
