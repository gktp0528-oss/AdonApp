import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { TabTransitionView } from '../components/TabTransitionView';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

type Props = CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, 'CategoryTab'>,
    NativeStackScreenProps<RootStackParamList>
>;

import ALL_CATEGORIES from '../data/categories.json';

type CategoryItem = {
    id: string;
    name: string;
    parentId: string | null;
    isLeaf: boolean;
    icon?: string;
};

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

// Map real categories to HubCategory structure
const rootCategories = (ALL_CATEGORIES as CategoryItem[])
    .filter(cat => cat.parentId === null)
    .map((cat, index) => {
        // Assign random gradient for visual variety
        const gradientKeys = Object.keys(GRADIENTS) as (keyof typeof GRADIENTS)[];
        const gradient = GRADIENTS[gradientKeys[index % gradientKeys.length]];

        // Random height for masonry effect (100-130)
        const heights = [100, 110, 120, 130];
        const height = heights[index % heights.length];

        return {
            id: cat.id,
            name: cat.name,
            nameKey: cat.id, // Use ID as key for i18n
            icon: (cat.icon || 'shape-outline') as keyof typeof MaterialCommunityIcons.glyphMap,
            height,
            colors: gradient
        };
    });

export function CategoryScreen({ navigation }: Props) {
    const { t } = useTranslation();

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
                        categories={rootCategories}
                        onPressCategory={(item, translatedName) =>
                            // Navigate to SearchResult with category filter enabled
                            navigation.navigate('SearchResult', {
                                categoryId: item.id,
                                categoryName: translatedName
                            })
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
