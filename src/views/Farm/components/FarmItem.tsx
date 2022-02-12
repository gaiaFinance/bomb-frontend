import React, { useRef, useState } from 'react'
import TokenSymbol from '../../../components/TokenSymbol'
// import { appConfig } from '../../../../appConfig'

// interface AccordionProps {
//   title: React.ReactNode
//   content: React.ReactNode
// }

export const FarmItem = () => {
  const [active, setActive] = useState(true)
  const [height, setHeight] = useState('0px')
  const [rotate, setRotate] = useState('transform duration-700 ease')

  const contentSpace = useRef(null)

  function toggleAccordion() {}
    return(
        // container
        <div className='bg-gaiagray p-5'>
            {/* outer */}
            <div className='flex items-center justify-between border border-black h-full text-white'>
                <div className="flex border w-2/12">
                    <TokenSymbol symbol= "GAIA" size={50} />
                    <div className='ml-5'>
                        <h3 className='font-bold text-base'>GAIA/BNB LP</h3>
                        <p>GAIA/BNB LP</p>
                        <p>GAIA/BNB LP</p>
                    </div>
                </div>
                <div className="flex space-x-9 w-5/12 border">
                    <div>
                        <p>You Deposited</p>
                        <p>~$0</p>
                    </div>
                    <div>
                        <p>TVL</p>
                        <p>$2.09M</p>
                    </div>
                    <div>
                        <p>APR</p>
                        <p>807.25%</p>
                    </div>
                </div>
                <div className='border border-black flex items-center justify-center h-full w-1/12'>
                    ++
                </div>
            </div>
            {/* innner */}
            <div>
                Inner
            </div>
        </div>
    )
}