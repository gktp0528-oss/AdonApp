import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, AppTheme } from '../theme';
import { userService } from '../services/userService';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    theme: AppTheme;
    toggleTheme: () => void;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>(systemColorScheme === 'dark' ? 'dark' : 'light');

    // Load saved preference from Firestore if user is logged in
    useEffect(() => {
        const userId = userService.getCurrentUserId();
        if (userId) {
            userService.getUserById(userId).then(user => {
                if (user?.themePreference) {
                    setModeState(user.themePreference as ThemeMode);
                }
            });
        }
    }, []);

    const setMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        const userId = userService.getCurrentUserId();
        if (userId) {
            try {
                await userService.updateUser(userId, { themePreference: newMode });
            } catch (error) {
                console.error('Failed to sync theme preference', error);
            }
        }
    };

    const toggleTheme = () => {
        setMode(mode === 'light' ? 'dark' : 'light');
    };

    const theme = mode === 'light' ? lightTheme : darkTheme;

    return (
        <ThemeContext.Provider value={{ mode, theme, toggleTheme, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
