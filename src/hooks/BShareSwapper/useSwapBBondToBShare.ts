import {useCallback} from 'react';
import useBombFinance from '../useBombFinance';
import useHandleTransactionReceipt from '../useHandleTransactionReceipt';
// import { BigNumber } from "ethers";
import {parseUnits} from 'ethers/lib/utils';

const useSwapGBondToBShare = () => {
  const bombFinance = useBombFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleSwapBShare = useCallback(
    (bbondAmount: string) => {
      const bbondAmountBn = parseUnits(bbondAmount, 18);
      handleTransactionReceipt(bombFinance.swapGBondToGShare(bbondAmountBn), `Swap ${bbondAmount} BBond to BShare`);
    },
    [bombFinance, handleTransactionReceipt],
  );
  return {onSwapBShare: handleSwapBShare};
};

export default useSwapGBondToBShare;
