import React, { ChangeEventHandler, MouseEventHandler, useState } from 'react'
import { Bank } from '../../../bomb-finance';
import useStake from '../../../hooks/useStake';
import useWithdraw from '../../../hooks/useWithdraw';


interface DepositOrWithdrawalProps  {
    bank?: Bank,
    val: number | string,
    onChange: ChangeEventHandler<HTMLInputElement>,
    onSelectMax: MouseEventHandler<HTMLButtonElement>,
}

function DepositOrWithdrawal({bank, val, onChange, onSelectMax}: DepositOrWithdrawalProps) {

    const [state, setState] = useState('deposit');
    const {onStake} = useStake(bank);
    const {onWithdraw} = useWithdraw(bank);

    const handleConfirm=(amount:any) => {
        console.log(amount, "amount")
        if (Number(amount) <= 0 || isNaN(Number(amount))) return;
        if (state === "deposit"){onStake(amount)}else if(state === "withdraw"){onWithdraw(amount)}
    }

    


  return (
    <div className='rounded-md w-1/2 mx-5 border border-gray-500'>
    <div className='flex border-b border-gray-500 w-full'>
        <button className={`p-3 ${state === "deposit" ? 'bg-primary text-black' : "bg-transparent text-gray-400"}  w-1/2 rounded-tl-md`} onClick={() => setState('deposit')}>
            Deposit
        </button>
        <button className={`p-3 ${state === "withdraw" ? 'bg-primary text-black' : "bg-transparent text-gray-400"}  w-1/2 rounded-tr-md `} onClick={() => setState('withdraw')}>
            Withdraw
        </button>
    </div>
    <div className='p-5'>
        <div className='border border-gray-500 rounded-md flex'>
            <div className='w-full '>
                <input
                type='number'
                value={val} 
                onChange={onChange}
                placeholder='Enter amount' 
                className='p-2 bg-transparent w-full outline-none text-white'/>
                <p className='p-2 text-white'>
                    {state === 'deposit' ? "Balance" : "Avail"}:
                    {" "}
                <span>0</span></p>
            </div>
            <button 
                onClick={onSelectMax}
                className='border-l border-gray-500 p-5 text-white hover:text-gray-400'
                >MAX
            </button>
        </div>
        <div className='w-full flex flex-col items-center justify-center mt-5'>
            <div className='flex items-center w-full my-10'>
                <div className='flex w-1/4 items-center'>
                    <span className='border rounded-full p-1 border-r-0'/>
                    <span className='border h-1 rounded-l-full border-gray-400 border-x-0 w-full'/>
                    <span className='border rounded-full p-1 border-x-0'/>
                </div>
                <div className='flex w-1/4 items-center'>
                    <span className='border h-1 rounded-l-full border-gray-400 border-x-0 w-full'/>
                    <span className='border border-x-0 rounded-full p-1'/>
                </div>
                <div className='flex w-1/4 items-center'>
                    <span className='border h-1 rounded-l-full border-gray-400 border-x-0 w-full'/>
                    <span className='border border-x-0 rounded-full p-1'/>
                </div>
                <div className='flex w-1/4 items-center'>
                    <span className='border h-1 rounded-l-full border-gray-400 border-x-0 w-full'/>
                    <span className='border border-l-0 rounded-full p-1'/>
                </div>
            </div>
            {/* <button className='bg-primary rounded-md w-full p-2 font-bold'>Connect wallet</button> */}
            {
                state === 'deposit' ?
                <button
                onClick={() => handleConfirm(val)}
                className='bg-primary rounded-md w-full p-2 font-bold'>Approve</button>
                :
                <button
                onClick={() => handleConfirm(val)}
                className='bg-gray-200 rounded-md w-full p-2 font-bold'>Withdraw</button>
            }
           
            { state === 'deposit' && (<div className='mt-5 space-x-3'>
                <a href="#" className='text-gray-400 underline hover:text-gray-300'>Add liquidity</a>
                <span className='text-gray-400'>|</span>
                <a href="#" className='text-gray-400 underline hover:text-gray-300'>Remove liquidity</a>
            </div>)
            }
        </div>
    </div>
</div>
  )
}

export default DepositOrWithdrawal