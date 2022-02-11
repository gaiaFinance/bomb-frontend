import React from 'react';
import styled from 'styled-components';

import {Card} from '@material-ui/core';

interface ExchangeStatProps {
  tokenName: string;
  description: string;
  price: string;
}

const ExchangeStat: React.FC<ExchangeStatProps> = ({tokenName, description, price}) => {
  return (
    <div className='border border-primary text-white rounded-md p-5 md:w-80 h-40 md:my-0 my-5'>
      <div className='text-center'>
        <p className='mb-2'>{description}</p>
        <p className='font-bold text-2xl text-primary'>{` ${tokenName} = ${price} BTC`}</p>
      </div>
    </div>
  );
};
// 💰

export default ExchangeStat;
