import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { DocumentSnapshot } from 'firebase/firestore';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { resetToTab, TabKey } from '../navigation/tabRouting';
import { TabTransitionView } from '../components/TabTransitionView';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

type Props = CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, 'CategoryTab'>,
    NativeStackScreenProps<RootStackParamList>
>;

type HubCategory = {
    id: string;
    name: string; // fallback name
    nameKey: string; // i18n key suffix
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    height?: number; // For masonry layout
    colors: readonly [string, string]; // Gradient colors
};

import { theme } from '../theme';

// Define cohesive brand-aligned gradients
// Using Adon's primary green (#19e61b) and accent (#022c22) as base inspiration
// Muted and elegant tones to fit the premium look
const GRADIENTS = {
    primary: [theme.colors.bg, '#e8f5e9'] as const, // Subtle green tint
    accent: ['#f6f8f6', '#dcfce7'] as const, // Light mint
    neutral: ['#ffffff', '#f3f4f6'] as const, // Clean gray/white
    soft: ['#fafafa', '#f0fdf4'] as const, // Very soft green
};

const browseCategories: HubCategory[] = [
    { id: 'electronics', name: 'Electronics', nameKey: 'electronics', icon: 'laptop', height: 120, colors: GRADIENTS.neutral },
    { id: 'home-decor', name: 'Home Decor', nameKey: 'homeDecor', icon: 'sofa-outline', height: 100, colors: GRADIENTS.accent },
    { id: 'beauty', name: 'Beauty', nameKey: 'beauty', icon: 'spray-bottle', height: 110, colors: GRADIENTS.primary },
    { id: 'baby-kids', name: 'Baby & Kids', nameKey: 'babyKids', icon: 'baby-face-outline', height: 100, colors: GRADIENTS.soft },
    { id: 'books', name: 'Books', nameKey: 'books', icon: 'book-open-page-variant-outline', height: 110, colors: GRADIENTS.neutral },
    { id: 'gaming', name: 'Gaming', nameKey: 'gaming', icon: 'controller-classic-outline', height: 120, colors: GRADIENTS.accent },
    { id: 'photography', name: 'Photography', nameKey: 'photography', icon: 'camera-outline', height: 110, colors: GRADIENTS.primary },
    { id: 'women-fashion', name: 'Women Fashion', nameKey: 'womenFashion', icon: 'human-female', height: 130, colors: GRADIENTS.soft },
    { id: 'men-fashion', name: 'Men Fashion', nameKey: 'menFashion', icon: 'human-male', height: 130, colors: GRADIENTS.neutral },
    { id: 'watches', name: 'Watches', nameKey: 'watches', icon: 'watch-variant', height: 100, colors: GRADIENTS.accent },
    { id: 'sneakers', name: 'Sneakers', nameKey: 'sneakers', icon: 'shoe-sneaker', height: 110, colors: GRADIENTS.primary },
    { id: 'bags-wallets', name: 'Bags & Wallets', nameKey: 'bags', icon: 'bag-personal-outline', height: 110, colors: GRADIENTS.soft },
    { id: 'bicycles', name: 'Bicycles', nameKey: 'bicycles', icon: 'bicycle', height: 100, colors: GRADIENTS.neutral },
    { id: 'collectibles', name: 'Collectibles', nameKey: 'collectibles', icon: 'toy-brick-search-outline', height: 110, colors: GRADIENTS.accent },
    { id: 'jewelry', name: 'Jewelry', nameKey: 'jewelry', icon: 'diamond-stone', height: 100, colors: GRADIENTS.primary },
    { id: 'vinyl', name: 'Vinyl', nameKey: 'vinyl', icon: 'album', height: 100, colors: GRADIENTS.soft },
    { id: 'board-games', name: 'Board Games', nameKey: 'boardGames', icon: 'puzzle-outline', height: 110, colors: GRADIENTS.neutral },
    { id: 'camping', name: 'Camping', nameKey: 'camping', icon: 'tent', height: 100, colors: GRADIENTS.accent },
    { id: 'hiking', name: 'Hiking', nameKey: 'hiking', icon: 'hiking', height: 100, colors: GRADIENTS.primary },
    { id: 'tennis', name: 'Tennis', nameKey: 'tennis', icon: 'tennis', height: 100, colors: GRADIENTS.soft },
    { id: 'skiing', name: 'Skiing', nameKey: 'skiing', icon: 'ski', height: 100, colors: GRADIENTS.neutral },
    { id: 'football', name: 'Football', nameKey: 'football', icon: 'soccer', height: 100, colors: GRADIENTS.accent },
    { id: 'running', name: 'Running', nameKey: 'running', icon: 'run', height: 100, colors: GRADIENTS.primary },
    { id: 'cycling', name: 'Cycling', nameKey: 'cycling', icon: 'bike', height: 100, colors: GRADIENTS.soft },
];

export function CategoryScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const handleTabPress = (tab: TabKey) => resetToTab(navigation, tab, 'category');

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <View style={styles.pageTitleContainer}>
                    <Text style={styles.pageTitle}>{t('screen.search.title')}</Text>
                    <Text style={styles.pageSubtitle}>
                        {t('screen.search.subtitle', { defaultValue: 'Explore vibrant categories' })}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
            <StatusBar style="dark" />
            <TabTransitionView style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {renderHeader()}
                    <MasonryCategorySection
                        sectionTitle={t('screen.search.section.browse', { defaultValue: 'Browse Categories' })}
                        categories={browseCategories}
                        onPressCategory={(item, translatedName) =>
                            navigation.navigate('CategoryList', { categoryId: item.id, categoryName: translatedName })
                        }
                    />
                </ScrollView>
            </TabTransitionView>
        </SafeAreaView>
    );
}

function MasonryCategorySection({
    sectionTitle,
    categories,
    onPressCategory,
}: {
    sectionTitle: string;
    categories: HubCategory[];
    onPressCategory: (item: HubCategory, translatedName: string) => void;
}) {
    const { t } = useTranslation();

    // Split categories into two columns
    const { leftCol, rightCol } = useMemo(() => {
        const left: HubCategory[] = [];
        const right: HubCategory[] = [];

        categories.forEach((item, index) => {
            if (index % 2 === 0) {
                left.push(item);
            } else {
                right.push(item);
            }
        });

        return { leftCol: left, rightCol: right };
    }, [categories]);

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
            <View style={styles.masonryContainer}>
                <View style={styles.column}>
                    {leftCol.map((item) => (
                        <CategoryCard
                            key={item.id}
                            item={item}
                            onPress={onPressCategory}
                            t={t}
                        />
                    ))}
                </View>
                <View style={styles.column}>
                    {rightCol.map((item) => (
                        <CategoryCard
                            key={item.id}
                            item={item}
                            onPress={onPressCategory}
                            t={t}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

function CategoryCard({
    item,
    onPress,
    t
}: {
    item: HubCategory;
    onPress: (item: HubCategory, name: string) => void;
    t: any;
}) {
    const translatedName = t(`screen.search.category.${item.nameKey}`, item.name);

    return (
        <Pressable
            style={[styles.cardContainer, { height: item.height || 100 }]}
            onPress={() => onPress(item, translatedName)}
        >
            <LinearGradient
                colors={item.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
            >
                <View style={styles.cardContent}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons
                            name={item.icon}
                            size={24}
                            color={theme.colors.accent}
                            style={styles.iconShadow}
                        />
                    </View>
                    <Text style={styles.cardTitle}>{translatedName}</Text>
                </View>

                {/* Decorative circle - streamlined */}
                <View style={styles.decorativeCircle} />
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#ffffff' // Clean white background
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 100
    },
    header: {
        marginTop: 10,
        marginBottom: 16,
    },
    pageTitleContainer: {
        // Container for title and subtitle
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
        marginTop: 2,
    },
    section: {
        marginTop: 8
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
    },
    masonryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    column: {
        width: '48%',
    },
    cardContainer: {
        width: '100%',
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    cardGradient: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
        position: 'relative',
    },
    cardContent: {
        zIndex: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 12,
        padding: 8,
        marginRight: 10,
    },
    iconShadow: {
        // Subtle shadow
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#122015',
        flex: 1,
    },
    decorativeCircle: {
        position: 'absolute',
        right: -15,
        bottom: -15,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(25, 230, 27, 0.05)', // Brand primary color with low opacity
        zIndex: 1,
    }
});
