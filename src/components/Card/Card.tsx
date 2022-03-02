import React from 'react';
import styled from 'styled-components';

const Card: React.FC = ({children}) => <StyledCard>{children}</StyledCard>;

const StyledCard = styled.div`
  background-color: #333;
  color: #ccc !important;
  display: flex;
  flex: 1;
  flex-direction: column;
`;

export default Card;
