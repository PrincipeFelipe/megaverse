import React, { useState, ReactNode } from 'react';

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className = ""
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const currentValue = value !== undefined ? value : internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };
  
  return (
    <div className={`w-full ${className}`} data-value={currentValue}>
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        
        return React.cloneElement(child as React.ReactElement<any>, {
          currentValue,
          onValueChange: handleValueChange
        });
      })}
    </div>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ 
  children, 
  className = "", 
  ...props
}) => {
  const { currentValue, onValueChange } = props as { currentValue: string, onValueChange: (value: string) => void };
  
  return (
    <div className={`flex items-center justify-center rounded-lg bg-dark-800/50 p-1 mb-4 ${className}`} role="tablist">
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        
        return React.cloneElement(child as React.ReactElement<any>, {
          currentValue,
          onValueChange
        });
      })}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  value, 
  children, 
  className = "", 
  ...props 
}) => {
  const { currentValue, onValueChange } = props as { currentValue: string, onValueChange: (value: string) => void };
  
  const isActive = currentValue === value;
  
  return (
    <button
      className={`px-3 py-1.5 text-sm font-medium transition-all rounded-md ${
        isActive 
          ? 'bg-primary-600 text-white shadow-sm' 
          : 'text-gray-400 hover:text-gray-100 hover:bg-dark-700'
      } ${className}`}
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({ 
  value, 
  children, 
  className = "", 
  ...props 
}) => {
  const { currentValue } = props as { currentValue: string };
  
  const isActive = currentValue === value;
  
  if (!isActive) return null;
  
  return (
    <div 
      className={`mt-2 ${className}`}
      role="tabpanel"
      data-state={isActive ? 'active' : 'inactive'}
    >
      {children}
    </div>
  );
};
