import React, { ReactNode } from 'react';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open = false,
  onOpenChange,
  children,
  className = '',
}) => {
  if (!open) return null;
  
  const handleBackdropClick = () => {
    if (onOpenChange) onOpenChange(false);
  };
  
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-all"
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white dark:bg-dark-800 rounded-lg shadow-lg max-h-[90vh] overflow-auto ${className}`}
        onClick={handleDialogClick}
      >
        {children}
      </div>
    </div>
  );
};

interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

export const DialogContent: React.FC<DialogContentProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`p-6 w-full max-w-md md:max-w-lg ${className}`}>
      {children}
    </div>
  );
};

interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`pb-4 ${className}`}>
      {children}
    </div>
  );
};

interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({
  children,
  className = '',
}) => {
  return (
    <h2 className={`text-xl font-semibold ${className}`}>
      {children}
    </h2>
  );
};

interface DialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const DialogDescription: React.FC<DialogDescriptionProps> = ({
  children,
  className = '',
}) => {
  return (
    <p className={`mt-1.5 text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
};

export const DialogFooter: React.FC<DialogHeaderProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`pt-4 flex justify-end space-x-2 ${className}`}>
      {children}
    </div>
  );
};
