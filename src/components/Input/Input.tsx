import React from 'react';
import styled from 'styled-components';

export interface InputProps {
  endAdornment?: React.ReactNode;
  onChange: (e: React.FormEvent<HTMLInputElement>) => void;
  placeholder?: string;
  startAdornment?: React.ReactNode;
  value: string;
}

const Input: React.FC<InputProps> = ({endAdornment, onChange, placeholder, startAdornment, value}) => {
  return (
    <StyledInputWrapper>
      {!!startAdornment && startAdornment}
      <StyledInput placeholder={placeholder} value={value} onChange={onChange} />
      {!!endAdornment && endAdornment}
    </StyledInputWrapper>
  );
};

const StyledInputWrapper = styled.div`
  align-items: center;
  background-color: ${(props) => props.theme.color.grey[200]};
  border-radius: ${(props) => props.theme.borderRadius}px;
  display: flex;
  padding: 0 ${(props) => props.theme.spacing[3]}px;
`;

const StyledInput = styled.input`
  background: #ccc;
  border: 0;
  color: #000;
  font-size: 18px;
  flex: 1;
  // height: 56px;
  margin: 0;
  padding: .5rem;
  width: 100%;
  // paddingX: 1rem:
  outline: none;
`;

export default Input;
