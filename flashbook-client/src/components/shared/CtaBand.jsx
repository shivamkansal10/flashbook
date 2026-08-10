import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

export const CtaBand = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/events');
  };

  return (
    <div className="w-full py-8 bg-gray-50 flex justify-center">
      <Button onClick={handleClick} variant="default" size="lg">
        Browse Events
      </Button>
    </div>
  );
};

export default CtaBand;
