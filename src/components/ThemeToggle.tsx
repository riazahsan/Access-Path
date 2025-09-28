import React from 'react';
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Contrast, Palette } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  const themeOptions: Array<{
    value: ThemeMode;
    label: string;
    icon: React.ReactNode;
    description: string;
  }> = [
    {
      value: 'light',
      label: 'Light Mode',
      icon: <Sun className="h-4 w-4" />,
      description: 'Default light theme for regular use'
    },
    {
      value: 'dark',
      label: 'Dark Mode',
      icon: <Moon className="h-4 w-4" />,
      description: 'Dark theme for low light environments'
    },
    {
      value: 'high-contrast',
      label: 'High Contrast',
      icon: <Contrast className="h-4 w-4" />,
      description: 'High contrast theme for improved visibility'
    }
  ];

  const getCurrentIcon = () => {
    const current = themeOptions.find(option => option.value === theme);
    return current?.icon || <Palette className="h-4 w-4" />;
  };

  const getCurrentLabel = () => {
    const current = themeOptions.find(option => option.value === theme);
    return current?.label || 'Theme';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 ${className}`}
          aria-label={`Current theme: ${getCurrentLabel()}. Click to change theme`}
        >
          {getCurrentIcon()}
          <span className="hidden sm:inline">{getCurrentLabel()}</span>
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={`flex items-start gap-3 p-3 cursor-pointer ${
              theme === option.value ? 'bg-accent' : ''
            }`}
            aria-current={theme === option.value ? 'true' : 'false'}
          >
            <div className="flex-shrink-0 mt-0.5">
              {option.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">
                {option.label}
                {theme === option.value && (
                  <span className="ml-2 text-xs text-muted-foreground">(Current)</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {option.description}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;