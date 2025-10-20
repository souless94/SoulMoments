'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Smartphone, 
  Monitor,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
}

export default function PWAInstallButton({ 
  variant = 'default',
  size = 'default',
  className,
  showText = true
}: PWAInstallButtonProps) {
  const { 
    isInstallable, 
    isInstalled, 
    isStandalone,
    promptInstall, 
    showManualInstructions,
    canInstall 
  } = usePWAInstall();
  
  const [isInstalling, setIsInstalling] = useState(false);

  // Don't show if already installed and running in standalone mode
  if (isInstalled && isStandalone) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await promptInstall();
      if (!success && canInstall) {
        // If prompt failed but app can still be installed, show manual instructions
        showManualInstructions();
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const getButtonContent = () => {
    if (isInstalled) {
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        text: 'Installed',
        disabled: true,
      };
    }
    
    if (isInstallable) {
      return {
        icon: <Download className="h-4 w-4" />,
        text: 'Install App',
        disabled: false,
      };
    }
    
    if (canInstall) {
      return {
        icon: <ExternalLink className="h-4 w-4" />,
        text: 'Install App',
        disabled: false,
      };
    }
    
    return null;
  };

  const buttonContent = getButtonContent();
  
  if (!buttonContent) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "transition-all duration-200",
        isInstalling && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleInstall}
      disabled={buttonContent.disabled || isInstalling}
    >
      <div className="flex items-center gap-2">
        {isInstalling ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        ) : (
          buttonContent.icon
        )}
        {showText && (
          <span>
            {isInstalling ? 'Installing...' : buttonContent.text}
          </span>
        )}
      </div>
    </Button>
  );
}

// Compact version for headers/toolbars
export function PWAInstallIcon({ className }: { className?: string }) {
  return (
    <PWAInstallButton
      variant="ghost"
      size="icon"
      showText={false}
      className={className}
    />
  );
}

// Banner version for prominent placement
export function PWAInstallBanner() {
  const { canInstall, isInstalled, isStandalone } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if not installable, already installed, or dismissed
  if (!canInstall || isInstalled || isStandalone || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <Monitor className="h-5 w-5 text-primary/60" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Install Life Moments Tracker</h3>
            <p className="text-xs text-muted-foreground">
              Get the full app experience with offline access and home screen shortcut.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <PWAInstallButton size="sm" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-xs"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}