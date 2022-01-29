// import { Fetcher, Route, Token } from '@uniswap/sdk';
//import { Fetcher as FetcherSpirit, Token as TokenSpirit } from '@spiritswap/sdk';
// import {Fetcher, Route, Token} from '@pancakeswap/sdk';
import {Fetcher, Route, Token} from 'pancakeswap-v2-testnet-sdk';
import {Configuration} from './config';
import {ContractName, TokenStat, AllocationTime, LPStat, Bank, PoolStats, GShareSwapperStat} from './types';
import {BigNumber, Contract, ethers, EventFilter} from 'ethers';
import {decimalToBalance} from './ether-utils';
import {TransactionResponse} from '@ethersproject/providers';
import ERC20 from './ERC20';
import {getFullDisplayBalance, getDisplayBalance} from '../utils/formatBalance';
import {getDefaultProvider} from '../utils/provider';
import IUniswapV2PairABI from './IUniswapV2Pair.abi.json';
import config, {bankDefinitions} from '../config';
import moment from 'moment';
import {parseUnits} from 'ethers/lib/utils';
import {BNB_TICKER, PANCAKESWAP_ROUTER_ADDR, GAIA_TICKER} from '../utils/constants';
/**
 * An API module of Bomb Money contracts.
 * All contract-interacting domain logic should be defined in here.
 */
export class BombFinance {
  myAccount: string;
  provider: ethers.providers.Web3Provider;
  signer?: ethers.Signer;
  config: Configuration;
  contracts: {[name: string]: Contract};
  externalTokens: {[name: string]: ERC20};
  boardroomVersionOfUser?: string;

  GAIAWBNB_LP: Contract;
  GAIA: ERC20;
  GSHARE: ERC20;
  GBOND: ERC20;
  BNB: ERC20;
  // BTC: ERC20;

  constructor(cfg: Configuration) {
    const {deployments, externalTokens} = cfg;
    const provider = getDefaultProvider();

    // loads contracts from deployments
    this.contracts = {};
    for (const [name, deployment] of Object.entries(deployments)) {
      this.contracts[name] = new Contract(deployment.address, deployment.abi, provider);
    }
    this.externalTokens = {};
    for (const [symbol, [address, decimal]] of Object.entries(externalTokens)) {
      this.externalTokens[symbol] = new ERC20(address, provider, symbol, decimal);
    }
    this.GAIA = new ERC20(deployments.Gaia.address, provider, 'GAIA');
    this.GSHARE = new ERC20(deployments.GShare.address, provider, 'GSHARE');
    this.GBOND = new ERC20(deployments.GBond.address, provider, 'GBOND');
    this.BNB = this.externalTokens['WBNB'];
    // this.BTC = this.externalTokens['BTCB'];

    

    // Uniswap V2 Pair
    this.GAIAWBNB_LP = new Contract(externalTokens['GAIA-BNB-LP'][0], IUniswapV2PairABI, provider);

    this.config = cfg;
    this.provider = provider;
  }

  /**
   * @param provider From an unlocked wallet. (e.g. Metamask)
   * @param account An address of unlocked wallet account.
   */
  unlockWallet(provider: any, account: string) {
    const newProvider = new ethers.providers.Web3Provider(provider, this.config.chainId);
    this.signer = newProvider.getSigner(0);
    this.myAccount = account;
    for (const [name, contract] of Object.entries(this.contracts)) {
      this.contracts[name] = contract.connect(this.signer);
    }
    const tokens = [this.GAIA, this.GSHARE, this.GBOND, ...Object.values(this.externalTokens)];
    for (const token of tokens) {
      token.connect(this.signer);
    }
    this.GAIAWBNB_LP = this.GAIAWBNB_LP.connect(this.signer);
    console.log(`🔓 Wallet is unlocked. Welcome, ${account}!`);
    this.fetchBoardroomVersionOfUser()
      .then((version) => (this.boardroomVersionOfUser = version))
      .catch((err) => {
        console.error(`Failed to fetch boardroom version: ${err.stack}`);
        this.boardroomVersionOfUser = 'latest';
      });
  }

  get isUnlocked(): boolean {
    return !!this.myAccount;
  }

  //===================================================================
  //===================== GET ASSET STATS =============================
  //===================FROM APE TO DISPLAY =========================
  //=========================IN HOME PAGE==============================
  //===================================================================

  async getGaiaStat(): Promise<TokenStat> {

    try {
      const {GaiaRewardPool, GaiaGenesisRewardPool} = this.contracts;
      const supply = await this.GAIA.totalSupply();

      const gaiaRewardPoolSupply = await this.GAIA.balanceOf(GaiaGenesisRewardPool.address);

      const gaiaRewardPoolSupply2 = await this.GAIA.balanceOf(GaiaRewardPool.address);

      const gaiaCirculatingSupply = supply.sub(gaiaRewardPoolSupply).sub(gaiaRewardPoolSupply2);

      const priceInBNB = await this.getTokenPriceFromPancakeswap(this.GAIA);

      console.log({priceInBNB})
      const priceInBNBstring = priceInBNB?.toString();
      console.log({priceInBNBstring})
      // const priceInBTC = await this.getTokenPriceFromPancakeswapBTC(this.GAIA);
      const priceOfOneBNB = await this.getWBNBPriceFromPancakeswap();
      // const priceOfOneBTC = await this.getBTCBPriceFromPancakeswap();
      const priceInDollars = await this.getTokenPriceFromPancakeswapGAIAUSD();
      const priceOfBombInDollars = ((Number(priceInBNB) * Number(priceOfOneBNB)) / 10000).toFixed(2);
      console.log('priceOfBombInDollars!!!!!!!!!', priceOfBombInDollars, priceInBNB, priceInBNBstring, priceInDollars);

      return {
        tokenInBnb: (Number(priceInBNB) * 100).toString(),
        // tokenInBnb: priceInBTC.toString(),
        priceInDollars: priceOfBombInDollars,
        totalSupply: getDisplayBalance(supply, this.GAIA.decimal, 0),
        circulatingSupply: getDisplayBalance(gaiaCirculatingSupply, this.GAIA.decimal, 0),
      };
    }catch (e) {
      console.log({e})
    }

  }


  async getBTCPriceUSD(): Promise<Number> {
    const priceOfOneBTC = await this.getBTCBPriceFromPancakeswap();
    return Number(priceOfOneBTC);
  }

  /**
   * Calculates various stats for the requested LP
   * @param name of the LP token to load stats for
   * @returns
   */
  async getLPStat(name: string): Promise<LPStat> {
    const lpToken = this.externalTokens[name];
    const lpTokenSupplyBN = await lpToken.totalSupply();
    const lpTokenSupply = getDisplayBalance(lpTokenSupplyBN, 18);
    const token0 = name.startsWith('GAIA') ? this.GAIA : this.GSHARE;
    const isGaia = name.startsWith('GAIA');
    const tokenAmountBN = await token0.balanceOf(lpToken.address);
    const tokenAmount = getDisplayBalance(tokenAmountBN, 18);

    const ftmAmountBN = await this.BNB.balanceOf(lpToken.address);
    const ftmAmount = getDisplayBalance(ftmAmountBN, 18);
    const tokenAmountInOneLP = Number(tokenAmount) / Number(lpTokenSupply);
    const ftmAmountInOneLP = Number(ftmAmount) / Number(lpTokenSupply);
    const lpTokenPrice = await this.getLPTokenPrice(lpToken, token0, isGaia);
    const lpTokenPriceFixed = Number(lpTokenPrice).toFixed(2).toString();
    const liquidity = (Number(lpTokenSupply) * Number(lpTokenPrice)).toFixed(2).toString();
    return {
      tokenAmount: tokenAmountInOneLP.toFixed(2).toString(),
      bnbAmount: ftmAmountInOneLP.toFixed(2).toString(),
      priceOfOne: lpTokenPriceFixed,
      totalLiquidity: liquidity,
      totalSupply: Number(lpTokenSupply).toFixed(2).toString(),
    };
  }

  async getLPStatBNB(name: string): Promise<LPStat> {
    const lpToken = this.externalTokens[name];
    const lpTokenSupplyBN = await lpToken.totalSupply();
    const lpTokenSupply = getDisplayBalance(lpTokenSupplyBN, 18);
    const token0 = name.startsWith('GAIA') ? this.GAIA : this.GSHARE;
    const isBomb = name.startsWith('GAIA');
    const tokenAmountBN = await token0.balanceOf(lpToken.address);
    const tokenAmount = getDisplayBalance(tokenAmountBN, 18);

    const btcAmountBN = await this.BNB.balanceOf(lpToken.address);
    const btcAmount = getDisplayBalance(btcAmountBN, 18);
    const tokenAmountInOneLP = Number(tokenAmount) / Number(lpTokenSupply);
    const ftmAmountInOneLP = Number(btcAmount) / Number(lpTokenSupply);
    const lpTokenPrice = await this.getLPTokenPrice(lpToken, token0, isBomb);

    const lpTokenPriceFixed = Number(lpTokenPrice).toFixed(2).toString();

    const liquidity = (Number(lpTokenSupply) * Number(lpTokenPrice)).toFixed(2).toString();

    return {
      tokenAmount: tokenAmountInOneLP.toFixed(2).toString(),
      bnbAmount: ftmAmountInOneLP.toFixed(5).toString(),
      priceOfOne: lpTokenPriceFixed,
      totalLiquidity: liquidity,
      totalSupply: Number(lpTokenSupply).toFixed(2).toString(),
    };
  }
  /**
   * Use this method to get price for Bomb
   * @returns TokenStat for GBOND
   * priceInBNB
   * priceInDollars
   * TotalSupply
   * CirculatingSupply (always equal to total supply for bonds)
   */
  async getBondStat(): Promise<TokenStat> {
    const {Treasury} = this.contracts;
    const gaiaStat = await this.getGaiaStat();
    const bondGaiaRatioBN = await Treasury.getBondPremiumRate();
    const modifier = bondGaiaRatioBN / 1e14 > 1 ? bondGaiaRatioBN / 1e14 : 1;
    const bondPriceInBNB = (Number(gaiaStat.tokenInBnb) * modifier).toFixed(4);
    const priceOfBBondInDollars = (Number(gaiaStat.priceInDollars) * modifier).toFixed(4);
    const supply = await this.GBOND.displayedTotalSupply();
    return {
      tokenInBnb: bondPriceInBNB,
      priceInDollars: priceOfBBondInDollars,
      totalSupply: supply,
      circulatingSupply: supply,
    };
  }

  /**
   * @returns TokenStat for GSHARE
   * priceInBNB
   * priceInDollars
   * TotalSupply
   * CirculatingSupply (always equal to total supply for bonds)
   */
  async getShareStat(): Promise<TokenStat> {
    const {GShareRewardPool} = this.contracts;

    const supply = await this.GSHARE.totalSupply();

    const priceInBNB = await this.getTokenPriceFromPancakeswap(this.GSHARE);
    const bombRewardPoolSupply = await this.GSHARE.balanceOf(GShareRewardPool.address);
    const tShareCirculatingSupply = supply.sub(bombRewardPoolSupply);
    const priceOfOneBNB = await this.getWBNBPriceFromPancakeswap();
    const priceOfSharesInDollars = (Number(priceInBNB) * Number(priceOfOneBNB)).toFixed(2);

    return {
      tokenInBnb: priceInBNB,
      priceInDollars: priceOfSharesInDollars,
      totalSupply: getDisplayBalance(supply, this.GSHARE.decimal, 0),
      circulatingSupply: getDisplayBalance(tShareCirculatingSupply, this.GSHARE.decimal, 0),
    };
  }

  async getBombStatInEstimatedTWAP(): Promise<TokenStat> {
    const {Oracle, GaiaRewardPool} = this.contracts;
    const expectedPrice = await Oracle.twap(this.GAIA.address, ethers.utils.parseEther('10000'));

    const supply = await this.GAIA.totalSupply();
    const gaiaRewardPoolSupply = await this.GAIA.balanceOf(GaiaRewardPool.address);
    const gaiaCirculatingSupply = supply.sub(gaiaRewardPoolSupply);
    return {
      tokenInBnb: getDisplayBalance(expectedPrice),
      priceInDollars: getDisplayBalance(expectedPrice),
      totalSupply: getDisplayBalance(supply, this.GAIA.decimal, 0),
      circulatingSupply: getDisplayBalance(gaiaCirculatingSupply, this.GAIA.decimal, 0),
    };
  }

  async getBombPriceInLastTWAP(): Promise<BigNumber> {
    const { Treasury } = this.contracts;
    return Treasury.getBombUpdatedPrice();
  }

  // async getBombPegTWAP(): Promise<any> {
  //   const { Treasury } = this.contracts;
  //   const updatedPrice = Treasury.getBombUpdatedPrice();
  //   const updatedPrice2 = updatedPrice * 10000;
  //   return updatedPrice2;
  // }

  async getBondsPurchasable(): Promise<BigNumber> {
    const {Treasury} = this.contracts;
    // const burnableBomb = (Number(Treasury.getBurnableBombLeft()) * 1000).toFixed(2).toString();
    return Treasury.getBurnableBombLeft();
  }

  /**
   * Calculates the TVL, APR and daily APR of a provided pool/bank
   * @param bank
   * @returns
   */
  async getPoolAPRs(bank: Bank): Promise<PoolStats> {
    if (this.myAccount === undefined) return;
    const depositToken = bank.depositToken;
    const poolContract = this.contracts[bank.contract];
    const depositTokenPrice = await this.getDepositTokenPriceInDollars(bank.depositTokenName, depositToken);
    const stakeInPool = await depositToken.balanceOf(bank.address);
    const TVL = Number(depositTokenPrice) * Number(getDisplayBalance(stakeInPool, depositToken.decimal));
    const stat = bank.earnTokenName === 'GAIA' ? await this.getGaiaStat() : await this.getShareStat();
    const tokenPerSecond = await this.getTokenPerSecond(
      bank.earnTokenName,
      bank.contract,
      poolContract,
      bank.depositTokenName,
    );

    const tokenPerHour = tokenPerSecond.mul(60).mul(60);
    const totalRewardPricePerYear =
      Number(stat.priceInDollars) * Number(getDisplayBalance(tokenPerHour.mul(24).mul(365)));
    const totalRewardPricePerDay = Number(stat.priceInDollars) * Number(getDisplayBalance(tokenPerHour.mul(24)));
    const totalStakingTokenInPool =
      Number(depositTokenPrice) * Number(getDisplayBalance(stakeInPool, depositToken.decimal));
    const dailyAPR = (totalRewardPricePerDay / totalStakingTokenInPool) * 100;
    const yearlyAPR = (totalRewardPricePerYear / totalStakingTokenInPool) * 100;
    return {
      dailyAPR: dailyAPR.toFixed(2).toString(),
      yearlyAPR: yearlyAPR.toFixed(2).toString(),
      TVL: TVL.toFixed(2).toString(),
    };
  }

  /**
   * Method to return the amount of tokens the pool yields per second
   * @param earnTokenName the name of the token that the pool is earning
   * @param contractName the contract of the pool/bank
   * @param poolContract the actual contract of the pool
   * @returns
   */
  async getTokenPerSecond(
    earnTokenName: string,
    contractName: string,
    poolContract: Contract,
    depositTokenName: string,
  ) {
    if (earnTokenName === 'GAIA') {
      if (!contractName.endsWith('GaiaRewardPool')) {
        const rewardPerSecond = await poolContract.gSharePerSecond();
        if (depositTokenName === 'WBNB') {
          return rewardPerSecond.mul(6000).div(11000).div(24);
        } else if (depositTokenName === 'CAKE') {
          return rewardPerSecond.mul(2500).div(11000).div(24);
        } else if (depositTokenName === 'SUSD') {
          return rewardPerSecond.mul(1000).div(11000).div(24);
        } else if (depositTokenName === 'SVL') {
          return rewardPerSecond.mul(1500).div(11000).div(24);
        }
        return rewardPerSecond.div(24);
      }
      const poolStartTime = await poolContract.poolStartTime();
      const startDateTime = new Date(poolStartTime.toNumber() * 1000);
      const FOUR_DAYS = 4 * 24 * 60 * 60 * 1000;
      if (Date.now() - startDateTime.getTime() > FOUR_DAYS) {
        return await poolContract.epochBombPerSecond(1);
      }
      return await poolContract.epochBombPerSecond(0);
    }
    const rewardPerSecond = await poolContract.tSharePerSecond();
    if (depositTokenName.startsWith('GAIA')) {
      return rewardPerSecond.mul(44625).div(59500);
    } else {
      return rewardPerSecond.mul(14875).div(59500);
    }
  }

  /**
   * Method to calculate the tokenPrice of the deposited asset in a pool/bank
   * If the deposited token is an LP it will find the price of its pieces
   * @param tokenName
   * @param pool
   * @param token
   * @returns
   */
  async getDepositTokenPriceInDollars(tokenName: string, token: ERC20) {
    let tokenPrice;
    const priceOfOneBnbInDollars = await this.getWBNBPriceFromPancakeswap();
    if (tokenName === 'WBNB') {
      tokenPrice = priceOfOneBnbInDollars;
    } else {
      if (tokenName === 'GAIA-BNB-LP') {
        tokenPrice = await this.getLPTokenPrice(token, this.GAIA, true);
      } else if (tokenName === 'GSHARE-BNB-LP') {
        tokenPrice = await this.getLPTokenPrice(token, this.GSHARE, false);
      } else if (tokenName === 'GSHARE-BNB-APELP') {
        tokenPrice = await this.getApeLPTokenPrice(token, this.GSHARE, false);
      } else if (tokenName === 'GAIA-BTCB-APELP') {
        tokenPrice = await this.getApeLPTokenPrice(token, this.GAIA, true);
      } else {
        tokenPrice = await this.getTokenPriceFromPancakeswap(token);
        tokenPrice = (Number(tokenPrice) * Number(priceOfOneBnbInDollars)).toString();
      }
    }
    return tokenPrice;
  }

  //===================================================================
  //===================== GET ASSET STATS =============================
  //=========================== END ===================================
  //===================================================================

  async getCurrentEpoch(): Promise<BigNumber> {
    const {Treasury} = this.contracts;
    return Treasury.epoch();
  }

  async getBondOraclePriceInLastTWAP(): Promise<BigNumber> {
    const {Treasury} = this.contracts;
    return Treasury.getBondPremiumRate();
  }

  /**
   * Buy bonds with cash.
   * @param amount amount of cash to purchase bonds with.
   */
  async buyBonds(amount: string | number): Promise<TransactionResponse> {
    const {Treasury} = this.contracts;
    const treasuryGaiaPrice = await Treasury.getGaiaPrice();
    return await Treasury.buyBonds(decimalToBalance(amount), treasuryGaiaPrice);
  }

  /**
   * Redeem bonds for cash.
   * @param amount amount of bonds to redeem.
   */
  async redeemBonds(amount: string | number): Promise<TransactionResponse> {
    const {Treasury} = this.contracts;
    const priceForGaia = await Treasury.getGaiaPrice();

    return await Treasury.redeemBonds(decimalToBalance(amount), priceForGaia);
  }

  async getTotalValueLocked(): Promise<Number> {
    let totalValue = 0;
    for (const bankInfo of Object.values(bankDefinitions)) {
      const pool = this.contracts[bankInfo.contract];
      const token = this.externalTokens[bankInfo.depositTokenName];
      const tokenPrice = await this.getDepositTokenPriceInDollars(bankInfo.depositTokenName, token);
      const tokenAmountInPool = await token.balanceOf(pool.address);
      const value = Number(getDisplayBalance(tokenAmountInPool, token.decimal)) * Number(tokenPrice);
      const poolValue = Number.isNaN(value) ? 0 : value;
      totalValue += poolValue;
    }

    const GSHAREPrice = (await this.getShareStat()).priceInDollars;
    const boardroomtShareBalanceOf = await this.GSHARE.balanceOf(this.currentBoardroom().address);
    const boardroomTVL = Number(getDisplayBalance(boardroomtShareBalanceOf, this.GSHARE.decimal)) * Number(GSHAREPrice);

    return totalValue + boardroomTVL;
  }

  /**
   * Calculates the price of an LP token
   * Reference https://github.com/DefiDebauchery/discordpricebot/blob/4da3cdb57016df108ad2d0bb0c91cd8dd5f9d834/pricebot/pricebot.py#L150
   * @param lpToken the token under calculation
   * @param token the token pair used as reference (the other one would be BNB in most cases)
   * @param isBomb sanity check for usage of bomb token or tShare
   * @returns price of the LP token
   */
  async getLPTokenPrice(lpToken: ERC20, token: ERC20, isBomb: boolean): Promise<string> {
    const totalSupply = getFullDisplayBalance(await lpToken.totalSupply(), lpToken.decimal);
    //Get amount of tokenA
    const tokenSupply = getFullDisplayBalance(await token.balanceOf(lpToken.address), token.decimal);
    const stat = isBomb === true ? await this.getGaiaStat() : await this.getShareStat();
    const priceOfToken = stat.priceInDollars;
    const tokenInLP = Number(tokenSupply) / Number(totalSupply);
    const tokenPrice = (Number(priceOfToken) * tokenInLP * 2) //We multiply by 2 since half the price of the lp token is the price of each piece of the pair. So twice gives the total
      .toString();
    return tokenPrice;
  }

  /**
   * Calculates the price of an LP token
   * Reference https://github.com/DefiDebauchery/discordpricebot/blob/4da3cdb57016df108ad2d0bb0c91cd8dd5f9d834/pricebot/pricebot.py#L150
   * @param lpToken the token under calculation
   * @param token the token pair used as reference (the other one would be BNB in most cases)
   * @param isGaia sanity check for usage of bomb token or tShare
   * @returns price of the LP token
   */
  async getApeLPTokenPrice(lpToken: ERC20, token: ERC20, isGaia: boolean): Promise<string> {
    const totalSupply = getFullDisplayBalance(await lpToken.totalSupply(), lpToken.decimal);
    //Get amount of tokenA
    const tokenSupply = getFullDisplayBalance(await token.balanceOf(lpToken.address), token.decimal);
    const stat = isGaia === true ? await this.getGaiaStat() : await this.getShareStat();
    const priceOfToken = stat.priceInDollars;
    const tokenInLP = Number(tokenSupply) / Number(totalSupply);
    const tokenPrice = (Number(priceOfToken) * tokenInLP * 2) //We multiply by 2 since half the price of the lp token is the price of each piece of the pair. So twice gives the total
      .toString();
    return tokenPrice;
  }

  async earnedFromBank(
    poolName: ContractName,
    earnTokenName: String,
    poolId: Number,
    account = this.myAccount,
  ): Promise<BigNumber> {
    const pool = this.contracts[poolName];
    try {
      if (earnTokenName === 'GAIA') {
        return await pool.pendingGAIA(poolId, account);
      } else {
        return await pool.pendingShare(poolId, account);
      }
    } catch (err) {
      console.error(`Failed to call pendingShare() on pool ${pool.address}: ${err.stack}`);
      return BigNumber.from(0);
    }
  }

  async stakedBalanceOnBank(poolName: ContractName, poolId: Number, account = this.myAccount): Promise<BigNumber> {
    const pool = this.contracts[poolName];
    try {
      let userInfo = await pool.userInfo(poolId, account);
      return await userInfo.amount;
    } catch (err) {
      console.error(`Failed to call userInfo() on pool ${pool.address}: ${err.stack}`);
      return BigNumber.from(0);
    }
  }

  /**
   * Deposits token to given pool.
   * @param poolName A name of pool contract.
   * @param amount Number of tokens with decimals applied. (e.g. 1.45 DAI * 10^18)
   * @returns {string} Transaction hash
   */
  async stake(poolName: ContractName, poolId: Number, amount: BigNumber): Promise<TransactionResponse> {
    const pool = this.contracts[poolName];
    return await pool.deposit(poolId, amount);
  }

  /**
   * Withdraws token from given pool.
   * @param poolName A name of pool contract.
   * @param amount Number of tokens with decimals applied. (e.g. 1.45 DAI * 10^18)
   * @returns {string} Transaction hash
   */
  async unstake(poolName: ContractName, poolId: Number, amount: BigNumber): Promise<TransactionResponse> {
    const pool = this.contracts[poolName];
    return await pool.withdraw(poolId, amount);
  }

  /**
   * Transfers earned token reward from given pool to my account.
   */
  async harvest(poolName: ContractName, poolId: Number): Promise<TransactionResponse> {
    const pool = this.contracts[poolName];
    //By passing 0 as the amount, we are asking the contract to only redeem the reward and not the currently staked token
    return await pool.withdraw(poolId, 0);
  }

  /**
   * Harvests and withdraws deposited tokens from the pool.
   */
  async exit(poolName: ContractName, poolId: Number, account = this.myAccount): Promise<TransactionResponse> {
    const pool = this.contracts[poolName];
    let userInfo = await pool.userInfo(poolId, account);
    return await pool.withdraw(poolId, userInfo.amount);
  }

  async fetchBoardroomVersionOfUser(): Promise<string> {
    return 'latest';
  }

  currentBoardroom(): Contract {
    if (!this.boardroomVersionOfUser) {
      //throw new Error('you must unlock the wallet to continue.');
    }
    return this.contracts.Boardroom;
  }

  isOldBoardroomMember(): boolean {
    return this.boardroomVersionOfUser !== 'latest';
  }

  async getTokenPriceFromPancakeswap(tokenContract: ERC20): Promise<string> {
    const ready = await this.provider.ready;
    if (!ready) return;
    const { chainId } = this.config;
    const {WBNB} = this.config.externalTokens;

    const wftm = new Token(chainId, WBNB[0], WBNB[1], 'WBNB');
    const token = new Token(chainId, tokenContract.address, tokenContract.decimal, tokenContract.symbol);
    try {
      const wftmToToken = await Fetcher.fetchPairData(wftm, token, this.provider);
      console.log({wftmToToken})
      const priceInBUSD = new Route([wftmToToken], token);
      return priceInBUSD.midPrice.toFixed(4);
    } catch (err) {
      console.log(`Failed to fetch token price of ${tokenContract.symbol}: ${err}`);
    }
  }

  // async getTokenPriceFromPancakeswap(tokenContract: ERC20): Promise<string> {
  //   const ready = await this.provider.ready;
  //   if (!ready) return;
  //   //const { chainId } = this.config;
  //   const {WBNB} = this.config.externalTokens;

  //   const wftm = new Token(56, WBNB[0], WBNB[1], 'WBNB');
  //   const token = new Token(56, tokenContract.address, tokenContract.decimal, tokenContract.symbol);
  //   try {
  //     const wftmToToken = await Fetcher.fetchPairData(wftm, token, this.provider);
  //     const priceInBUSD = new Route([wftmToToken], token);
  //     return priceInBUSD.midPrice.toFixed(4);
  //   } catch (err) {
  //     console.error(`Failed to fetch token price of ${tokenContract.symbol}: ${err}`);
  //   }
  // }

  async getTokenPriceFromPancakeswapBNB(tokenContract: ERC20): Promise<string> {
    const ready = await this.provider.ready;
    if (!ready) return;
    const { chainId } = this.config;
    // const {WBNB} = this.config.externalTokens;

    // const wbnb = new Token(56, WBNB[0], WBNB[1]);
    const wbnb = new Token(chainId, this.BNB.address, this.BNB.decimal, 'WBNB', 'WBNB');
    const token = new Token(chainId, tokenContract.address, tokenContract.decimal, tokenContract.symbol);
    try {
      const wbnbToToken = await Fetcher.fetchPairData(wbnb, token, this.provider);
      const priceInBUSD = new Route([wbnbToToken], token);
      //   console.log('priceInBUSDBTC', priceInBUSD.midPrice.toFixed(12));

      const priceForPeg = Number(priceInBUSD.midPrice.toFixed(12)) * 10000;
      return priceForPeg.toFixed(4);
    } catch (err) {
      console.error(`Failed to fetch token price of ${tokenContract.symbol}: ${err}`);
    }
  }

  async getTokenPriceFromPancakeswapGAIAUSD(): Promise<string> {
    const ready = await this.provider.ready;
    if (!ready) return;
    //const { chainId } = this.config;
    //const {WBNB} = this.config.externalTokens;

    //  const wbnb = new Token(56, WBNB[0], WBNB[1]);
    const wbnb = new Token(56, this.GAIA.address, this.GAIA.decimal, 'WBNB', 'WBNB');
    const token = new Token(56, this.GAIA.address, this.GAIA.decimal, this.GAIA.symbol);
    try {
      const wbnbToToken = await Fetcher.fetchPairData(wbnb, token, this.provider);
      const priceInBUSD = new Route([wbnbToToken], token);
      // console.log('test', priceInBUSD.midPrice.toFixed(12));

      const priceForPeg = Number(priceInBUSD.midPrice.toFixed(12)) * 10000;
      return priceForPeg.toFixed(4);
    } catch (err) {
      console.error(`Failed to fetch token price of ${this.GAIA.symbol}: ${err}`);
    }
  }

  // async getTokenPriceFromSpiritswap(tokenContract: ERC20): Promise<string> {
  //   const ready = await this.provider.ready;
  //   if (!ready) return;
  //   const { chainId } = this.config;

  //   const { WBNB } = this.externalTokens;

  //   const wftm = new TokenSpirit(chainId, WBNB.address, WBNB.decimal);
  //   const token = new TokenSpirit(chainId, tokenContract.address, tokenContract.decimal, tokenContract.symbol);
  //   try {
  //     const wftmToToken = await FetcherSpirit.fetchPairData(wftm, token, this.provider);
  //     const liquidityToken = wftmToToken.liquidityToken;
  //     let ftmBalanceInLP = await WBNB.balanceOf(liquidityToken.address);
  //     let ftmAmount = Number(getFullDisplayBalance(ftmBalanceInLP, WBNB.decimal));
  //     let shibaBalanceInLP = await tokenContract.balanceOf(liquidityToken.address);
  //     let shibaAmount = Number(getFullDisplayBalance(shibaBalanceInLP, tokenContract.decimal));
  //     const priceOfOneFtmInDollars = await this.getWBNBPriceFromPancakeswap();
  //     let priceOfShiba = (ftmAmount / shibaAmount) * Number(priceOfOneFtmInDollars);
  //     return priceOfShiba.toString();
  //   } catch (err) {
  //     console.error(`Failed to fetch token price of ${tokenContract.symbol}: ${err}`);
  //   }
  // }

  async getWBNBPriceFromPancakeswap(): Promise<string> {
    const ready = await this.provider.ready;
    if (!ready) return;
    const {WBNB, FUSDT} = this.externalTokens;
    try {
      const fusdt_wbnb_lp_pair = this.externalTokens['USDT-BNB-LP'];
      let ftm_amount_BN = await WBNB.balanceOf(fusdt_wbnb_lp_pair.address);
      let ftm_amount = Number(getFullDisplayBalance(ftm_amount_BN, WBNB.decimal));
      let fusdt_amount_BN = await FUSDT.balanceOf(fusdt_wbnb_lp_pair.address);
      let fusdt_amount = Number(getFullDisplayBalance(fusdt_amount_BN, FUSDT.decimal));
      return (fusdt_amount / ftm_amount).toString();
    } catch (err) {
      console.error(`Failed to fetch token price of WBNB: ${err}`);
    }
  }

  

  async getBTCBPriceFromPancakeswap(): Promise<string> {
    const ready = await this.provider.ready;
    if (!ready) return;
    const {WBNB} = this.externalTokens;
    try {
      const btcPriceInBNB = await this.getTokenPriceFromPancakeswap(WBNB);

      const wbnbPrice = await this.getWBNBPriceFromPancakeswap();

      const btcprice = (Number(btcPriceInBNB) * Number(wbnbPrice)).toFixed(2).toString();
      //console.log('btcprice', btcprice);
      return btcprice;
    } catch (err) {
      console.error(`Failed to fetch token price of BTCB: ${err}`);
    }
  }

  // async getBTCBPriceFromPancakeswap(): Promise<string> {
  //   const ready = await this.provider.ready;
  //   if (!ready) return;
  //   const { BTCB, FUSDT } = this.externalTokens;
  //   try {
  //     const fusdt_btcb_lp_pair = this.externalTokens['USDT-BTCB-LP'];
  //     let ftm_amount_BN = await BTCB.balanceOf(fusdt_btcb_lp_pair.address);
  //     let ftm_amount = Number(getFullDisplayBalance(ftm_amount_BN, BTCB.decimal));
  //     let fusdt_amount_BN = await FUSDT.balanceOf(fusdt_btcb_lp_pair.address);
  //     let fusdt_amount = Number(getFullDisplayBalance(fusdt_amount_BN, FUSDT.decimal));
  //     console.log('BTCB price', (fusdt_amount / ftm_amount).toString());
  //     return (fusdt_amount / ftm_amount).toString();
  //     console.log('BTCB price');
  //   } catch (err) {
  //     console.error(`Failed to fetch token price of BTCB: ${err}`);
  //   }
  // }

  //===================================================================
  //===================================================================
  //===================== MASONRY METHODS =============================
  //===================================================================
  //===================================================================

  async getBoardroomAPR() {
    const Boardroom = this.currentBoardroom();
    const latestSnapshotIndex = await Boardroom.latestSnapshotIndex();
    const lastHistory = await Boardroom.boardroomHistory(latestSnapshotIndex);

    const lastRewardsReceived = lastHistory[1];

    const GSHAREPrice = (await this.getShareStat()).priceInDollars;
    const GAIAPrice = (await this.getGaiaStat()).priceInDollars;
    const epochRewardsPerShare = lastRewardsReceived / 1e18;

    //Mgod formula
    const amountOfRewardsPerDay = epochRewardsPerShare * Number(GAIAPrice) * 4;
    const boardroomtShareBalanceOf = await this.GSHARE.balanceOf(Boardroom.address);
    const boardroomTVL = Number(getDisplayBalance(boardroomtShareBalanceOf, this.GSHARE.decimal)) * Number(GSHAREPrice);
    const realAPR = ((amountOfRewardsPerDay * 100) / boardroomTVL) * 365;
    return realAPR;
  }

  /**
   * Checks if the user is allowed to retrieve their reward from the Boardroom
   * @returns true if user can withdraw reward, false if they can't
   */
  async canUserClaimRewardFromBoardroom(): Promise<boolean> {
    const Boardroom = this.currentBoardroom();
    return await Boardroom.canClaimReward(this.myAccount);
  }

  /**
   * Checks if the user is allowed to retrieve their reward from the Boardroom
   * @returns true if user can withdraw reward, false if they can't
   */
  async canUserUnstakeFromBoardroom(): Promise<boolean> {
    const Boardroom = this.currentBoardroom();
    const canWithdraw = await Boardroom.canWithdraw(this.myAccount);
    const stakedAmount = await this.getStakedSharesOnBoardroom();
    const notStaked = Number(getDisplayBalance(stakedAmount, this.GSHARE.decimal)) === 0;
    const result = notStaked ? true : canWithdraw;
    return result;
  }

  async timeUntilClaimRewardFromBoardroom(): Promise<BigNumber> {
    // const Boardroom = this.currentBoardroom();
    // const mason = await Boardroom.masons(this.myAccount);
    return BigNumber.from(0);
  }

  async getTotalStakedInBoardroom(): Promise<BigNumber> {
    const Boardroom = this.currentBoardroom();
    return await Boardroom.totalSupply();
  }

  async stakeShareToBoardroom(amount: string): Promise<TransactionResponse> {
    if (this.isOldBoardroomMember()) {
      throw new Error("you're using old boardroom. please withdraw and deposit the GSHARE again.");
    }
    const Boardroom = this.currentBoardroom();
    return await Boardroom.stake(decimalToBalance(amount));
  }

  async getStakedSharesOnBoardroom(): Promise<BigNumber> {
    const Boardroom = this.currentBoardroom();
    if (this.boardroomVersionOfUser === 'v1') {
      return await Boardroom.getShareOf(this.myAccount);
    }
    return await Boardroom.balanceOf(this.myAccount);
  }

  async getEarningsOnBoardroom(): Promise<BigNumber> {
    const Boardroom = this.currentBoardroom();
    if (this.boardroomVersionOfUser === 'v1') {
      return await Boardroom.getCashEarningsOf(this.myAccount);
    }
    return await Boardroom.earned(this.myAccount);
  }

  async withdrawShareFromBoardroom(amount: string): Promise<TransactionResponse> {
    const Boardroom = this.currentBoardroom();
    return await Boardroom.withdraw(decimalToBalance(amount));
  }

  async harvestCashFromBoardroom(): Promise<TransactionResponse> {
    const Boardroom = this.currentBoardroom();
    if (this.boardroomVersionOfUser === 'v1') {
      return await Boardroom.claimDividends();
    }
    return await Boardroom.claimReward();
  }

  async exitFromBoardroom(): Promise<TransactionResponse> {
    const Boardroom = this.currentBoardroom();
    return await Boardroom.exit();
  }

  async getTreasuryNextAllocationTime(): Promise<AllocationTime> {
    const {Treasury} = this.contracts;
    const nextEpochTimestamp: BigNumber = await Treasury.nextEpochPoint();
    const nextAllocation = new Date(nextEpochTimestamp.mul(1000).toNumber());
    const prevAllocation = new Date(Date.now());

    return {from: prevAllocation, to: nextAllocation};
  }
  /**
   * This method calculates and returns in a from to to format
   * the period the user needs to wait before being allowed to claim
   * their reward from the boardroom
   * @returns Promise<AllocationTime>
   */
  async getUserClaimRewardTime(): Promise<AllocationTime> {
    const {Boardroom, Treasury} = this.contracts;
    const nextEpochTimestamp = await Boardroom.nextEpochPoint(); //in unix timestamp
    const currentEpoch = await Boardroom.epoch();
    const mason = await Boardroom.members(this.myAccount);
    const startTimeEpoch = mason.epochTimerStart;
    const period = await Treasury.PERIOD();
    const periodInHours = period / 60 / 60; // 6 hours, period is displayed in seconds which is 21600
    const rewardLockupEpochs = await Boardroom.rewardLockupEpochs();
    const targetEpochForClaimUnlock = Number(startTimeEpoch) + Number(rewardLockupEpochs);

    const fromDate = new Date(Date.now());
    if (targetEpochForClaimUnlock - currentEpoch <= 0) {
      return {from: fromDate, to: fromDate};
    } else if (targetEpochForClaimUnlock - currentEpoch === 1) {
      const toDate = new Date(nextEpochTimestamp * 1000);
      return {from: fromDate, to: toDate};
    } else {
      const toDate = new Date(nextEpochTimestamp * 1000);
      const delta = targetEpochForClaimUnlock - currentEpoch - 1;
      const endDate = moment(toDate)
        .add(delta * periodInHours, 'hours')
        .toDate();
      return {from: fromDate, to: endDate};
    }
  }

  /**
   * This method calculates and returns in a from to to format
   * the period the user needs to wait before being allowed to unstake
   * from the boardroom
   * @returns Promise<AllocationTime>
   */
  async getUserUnstakeTime(): Promise<AllocationTime> {
    const {Boardroom, Treasury} = this.contracts;
    const nextEpochTimestamp = await Boardroom.nextEpochPoint();
    const currentEpoch = await Boardroom.epoch();
    const mason = await Boardroom.members(this.myAccount);
    const startTimeEpoch = mason.epochTimerStart;
    const period = await Treasury.PERIOD();
    const PeriodInHours = period / 60 / 60;
    const withdrawLockupEpochs = await Boardroom.withdrawLockupEpochs();
    const fromDate = new Date(Date.now());
    const targetEpochForClaimUnlock = Number(startTimeEpoch) + Number(withdrawLockupEpochs);
    const stakedAmount = await this.getStakedSharesOnBoardroom();
    if (currentEpoch <= targetEpochForClaimUnlock && Number(stakedAmount) === 0) {
      return {from: fromDate, to: fromDate};
    } else if (targetEpochForClaimUnlock - currentEpoch === 1) {
      const toDate = new Date(nextEpochTimestamp * 1000);
      return {from: fromDate, to: toDate};
    } else {
      const toDate = new Date(nextEpochTimestamp * 1000);
      const delta = targetEpochForClaimUnlock - Number(currentEpoch) - 1;
      const endDate = moment(toDate)
        .add(delta * PeriodInHours, 'hours')
        .toDate();
      return {from: fromDate, to: endDate};
    }
  }

  async watchAssetInMetamask(assetName: string): Promise<boolean> {
    const {ethereum} = window as any;
    if (ethereum && ethereum.networkVersion === config.chainId.toString()) {
      let asset;
      let assetUrl;
      if (assetName === 'GAIA') {
        asset = this.GAIA;
        assetUrl = 'https://raw.githubusercontent.com/bombmoney/bomb-assets/master/bomb-512.png';
      } else if (assetName === 'GSHARE') {
        asset = this.GSHARE;
        assetUrl = 'https://raw.githubusercontent.com/bombmoney/bomb-assets/master/bshare-512.png';
      } else if (assetName === 'GBOND') {
        asset = this.GBOND;
        assetUrl = 'https://raw.githubusercontent.com/bombmoney/bomb-assets/master/bbond-512.png';
      }
      await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: asset.address,
            symbol: asset.symbol,
            decimals: 18,
            image: assetUrl,
          },
        },
      });
    }
    return true;
  }

  async provideBombFtmLP(bnbAmount: string, gaiaAmount: BigNumber): Promise<TransactionResponse> {
    const {TaxOffice} = this.contracts;
    let overrides = {
      value: parseUnits(bnbAmount, 18),
    };
    return await TaxOffice.addLiquidityETHTaxFree(
      gaiaAmount,
      gaiaAmount.mul(992).div(1000),
      parseUnits(bnbAmount, 18).mul(992).div(1000),
      overrides,
    );
  }

  async quoteFromSpooky(tokenAmount: string, tokenName: string): Promise<string> {
    const {SpookyRouter} = this.contracts;
    const {_reserve0, _reserve1} = await this.GAIAWBNB_LP.getReserves();
    let quote;
    if (tokenName === 'GAIA') {
      quote = await SpookyRouter.quote(parseUnits(tokenAmount), _reserve0, _reserve1);
    } else {
      quote = await SpookyRouter.quote(parseUnits(tokenAmount), _reserve1, _reserve0);
    }
    return (quote / 1e18).toString();
  }

  /**
   * @returns an array of the regulation events till the most up to date epoch
   */
  async listenForRegulationsEvents(): Promise<any> {
    const {Treasury} = this.contracts;

    const treasuryDaoFundedFilter = Treasury.filters.DaoFundFunded();
    const treasuryDevFundedFilter = Treasury.filters.DevFundFunded();
    const treasuryBoardroomFundedFilter = Treasury.filters.BoardroomFunded();
    const boughtBondsFilter = Treasury.filters.BoughtBonds();
    const redeemBondsFilter = Treasury.filters.RedeemedBonds();

    let epochBlocksRanges: any[] = [];
    let boardroomFundEvents = await Treasury.queryFilter(treasuryBoardroomFundedFilter);
    var events: any[] = [];
    boardroomFundEvents.forEach(function callback(value, index) {
      events.push({epoch: index + 1});
      events[index].boardroomFund = getDisplayBalance(value.args[1]);
      if (index === 0) {
        epochBlocksRanges.push({
          index: index,
          startBlock: value.blockNumber,
          boughBonds: 0,
          redeemedBonds: 0,
        });
      }
      if (index > 0) {
        epochBlocksRanges.push({
          index: index,
          startBlock: value.blockNumber,
          boughBonds: 0,
          redeemedBonds: 0,
        });
        epochBlocksRanges[index - 1].endBlock = value.blockNumber;
      }
    });

    epochBlocksRanges.forEach(async (value, index) => {
      events[index].bondsBought = await this.getBondsWithFilterForPeriod(
        boughtBondsFilter,
        value.startBlock,
        value.endBlock,
      );
      events[index].bondsRedeemed = await this.getBondsWithFilterForPeriod(
        redeemBondsFilter,
        value.startBlock,
        value.endBlock,
      );
    });
    let DEVFundEvents = await Treasury.queryFilter(treasuryDevFundedFilter);
    DEVFundEvents.forEach(function callback(value, index) {
      events[index].devFund = getDisplayBalance(value.args[1]);
    });
    let DAOFundEvents = await Treasury.queryFilter(treasuryDaoFundedFilter);
    DAOFundEvents.forEach(function callback(value, index) {
      events[index].daoFund = getDisplayBalance(value.args[1]);
    });
    return events;
  }

  /**
   * Helper method
   * @param filter applied on the query to the treasury events
   * @param from block number
   * @param to block number
   * @returns the amount of bonds events emitted based on the filter provided during a specific period
   */
  async getBondsWithFilterForPeriod(filter: EventFilter, from: number, to: number): Promise<number> {
    const {Treasury} = this.contracts;
    const bondsAmount = await Treasury.queryFilter(filter, from, to);
    return bondsAmount.length;
  }

  async estimateZapIn(tokenName: string, lpName: string, amount: string): Promise<number[]> {
    const {zapper} = this.contracts;
    const lpToken = this.externalTokens[lpName];
    let estimate;
    if (tokenName === BNB_TICKER) {
      estimate = await zapper.estimateZapIn(lpToken.address, PANCAKESWAP_ROUTER_ADDR, parseUnits(amount, 18));
    } else {
      const token = tokenName === GAIA_TICKER ? this.GAIA : this.GSHARE;
      estimate = await zapper.estimateZapInToken(
        token.address,
        lpToken.address,
        PANCAKESWAP_ROUTER_ADDR,
        parseUnits(amount, 18),
      );
    }
    return [estimate[0] / 1e18, estimate[1] / 1e18];
  }
  async zapIn(tokenName: string, lpName: string, amount: string): Promise<TransactionResponse> {
    const {zapper} = this.contracts;
    const lpToken = this.externalTokens[lpName];
    if (tokenName === BNB_TICKER) {
      let overrides = {
        value: parseUnits(amount, 18),
      };
      return await zapper.zapIn(lpToken.address, PANCAKESWAP_ROUTER_ADDR, this.myAccount, overrides);
    } else {
      const token = tokenName === GAIA_TICKER ? this.GAIA : this.GSHARE;
      return await zapper.zapInToken(
        token.address,
        parseUnits(amount, 18),
        lpToken.address,
        PANCAKESWAP_ROUTER_ADDR,
        this.myAccount,
      );
    }
  }
  async swapGBondToGShare(gbondAmount: BigNumber): Promise<TransactionResponse> {
    const {GShareSwapper} = this.contracts;
    return await GShareSwapper.swapGBondToGShare(gbondAmount);
  }
  async estimateAmountOfGShare(gbondAmount: string): Promise<string> {
    const {GShareSwapper} = this.contracts;
    try {
      const estimateBN = await GShareSwapper.estimateAmountOfGShare(parseUnits(gbondAmount, 18));
      return getDisplayBalance(estimateBN, 18, 6);
    } catch (err) {
      console.error(`Failed to fetch estimate bshare amount: ${err}`);
    }
  }

  async getGShareSwapperStat(address: string): Promise<GShareSwapperStat> {
    const {GShareSwapper} = this.contracts;
    const gshareBalanceBN = await GShareSwapper.getGShareBalance();
    const gbondBalanceBN = await GShareSwapper.getGBondBalance(address);
    // const bombPriceBN = await BShareSwapper.getBombPrice();
    // const bsharePriceBN = await BShareSwapper.getBSharePrice();
    const rateGSharePerGaiaBN = await GShareSwapper.getGShareAmountPerGaia();
    const gshareBalance = getDisplayBalance(gshareBalanceBN, 18, 5);
    const gbondBalance = getDisplayBalance(gbondBalanceBN, 18, 5);
    return {
      gshareBalance: gshareBalance.toString(),
      gbondBalance: gbondBalance.toString(),
      // bombPrice: bombPriceBN.toString(),
      // bsharePrice: bsharePriceBN.toString(),
      rateGSharePerGaia: rateGSharePerGaiaBN.toString(),
    };
  }
}