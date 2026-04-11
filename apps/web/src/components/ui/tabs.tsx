import * as React from 'react';
import { cn } from '../../utils/cn';

interface TabsProps extends React.ComponentPropsWithoutRef<'div'> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

function Tabs({ defaultValue, value, onValueChange, className, children, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  
  const currentValue = value ?? internalValue;
  const handleValueChange = React.useCallback((newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  }, [onValueChange]);
  
  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn('space-y-6', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.ComponentPropsWithoutRef<'div'> {
  variant?: 'default' | 'pills' | 'underline';
}

function TabsList({ variant = 'default', className, children, ...props }: TabsListProps) {
  const baseStyles = {
    default: 'inline-flex items-center gap-1 p-1 bg-muted rounded-lg',
    pills: 'inline-flex items-center gap-2',
    underline: 'inline-flex items-center border-b border-border',
  };
  
  return (
    <div className={cn(baseStyles[variant], className)} role="tablist" {...props}>
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<'button'> {
  value: string;
  disabled?: boolean;
}

function TabsTrigger({ value, disabled, className, children, ...props }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isSelected = selectedValue === value;
  
  const baseStyles = isSelected
    ? 'bg-background text-foreground shadow-sm'
    : 'text-muted-foreground hover:text-foreground';
  
  const variantStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      className={cn(variantStyles, baseStyles, className)}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.ComponentPropsWithoutRef<'div'> {
  value: string;
  forceMount?: boolean;
}

function TabsContent({ value, forceMount, className, children, ...props }: TabsContentProps) {
  const { value: selectedValue } = useTabsContext();
  const isSelected = selectedValue === value;
  
  if (!isSelected && !forceMount) {
    return null;
  }
  
  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      className={cn('ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };