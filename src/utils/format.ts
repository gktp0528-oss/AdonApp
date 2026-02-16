import i18n from 'i18next';
import 'intl';
import 'intl/locale-data/jsonp/en';
import 'intl/locale-data/jsonp/ko';
import 'intl/locale-data/jsonp/hu';

// Currency formatter
export const formatCurrency = (amount: number, currencyCode: string = 'POINTS'): string => {
    // Handle points as a special case
    if (currencyCode === 'POINTS' || currencyCode === 'PTS') {
        const formattedAmount = new Intl.NumberFormat('ko-KR').format(amount);
        return `${formattedAmount} Ft`;
    }

    const language = i18n.language || 'ko';
    let locale = language;

    // Specific locale mapping for currency format
    if (currencyCode === 'HUF') {
        locale = 'hu-HU';
    } else if (currencyCode === 'KRW') {
        locale = 'ko-KR';
    } else if (currencyCode === 'USD') {
        locale = 'en-US';
    } else if (currencyCode === 'EUR') {
        locale = 'de-DE'; // Example for Euro
    }

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch (error) {
        console.warn(`Currency formatting failed for ${currencyCode}`, error);
        return `${amount} ${currencyCode}`;
    }
};

// Date formatter
export const formatDate = (date: Date | string | number): string => {
    const language = i18n.language || 'ko';
    let locale = language;

    if (language === 'hu') {
        locale = 'hu-HU';
    } else if (language === 'ko') {
        locale = 'ko-KR';
    } else {
        locale = 'en-US';
    }

    const d = new Date(date);

    try {
        if (language === 'hu') {
            // Hungarian format: YYYY. MM. DD.
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}. ${month}. ${day}.`;
        }

        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(d);
    } catch (error) {
        console.warn('Date formatting failed', error);
        return new Date(date).toLocaleDateString();
    }
};

// Number formatter
export const formatNumber = (number: number): string => {
    const language = i18n.language || 'ko';
    let locale = language;
    if (language === 'hu') {
        locale = 'hu-HU';
    } else if (language === 'ko') {
        locale = 'ko-KR';
    } else {
        locale = 'en-US';
    }

    try {
        return new Intl.NumberFormat(locale).format(number);
    } catch (error) {
        return number.toString();
    }
};

// Relative time formatter
export const formatRelativeTime = (date: Date | Timestamp): string => {
    const d = date instanceof Date ? date : date.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return i18n.t('common.time.justNow');

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return i18n.t('common.time.ago.m', { count: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return i18n.t('common.time.ago.h', { count: diffInHours });

    const diffInDays = Math.floor(diffInHours / 24);
    return i18n.t('common.time.ago.d', { count: diffInDays });
};

// Need this for the type
import { Timestamp } from 'firebase/firestore';
