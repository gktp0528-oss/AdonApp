import React, { useMemo } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
    Keyboard,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StackActions } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import ALL_CATEGORIES from '../data/categories.json';

import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'CategorySelect'>;
type CategoryItem = {
    id: string;
    name: string;
    parentId: string | null;
    isLeaf: boolean;
    icon?: string;
};

export function CategorySelectScreen({ navigation, route }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const parentId = route.params?.parentId || null;
    const currentPath = route.params?.currentPath || t('screen.categorySelect.all');
    const isRootLevel = parentId === null;

    const filteredCategories = useMemo(() => {
        return (ALL_CATEGORIES as CategoryItem[]).filter(cat => cat.parentId === parentId);
    }, [parentId]);

    const handleSelect = (category: CategoryItem) => {
        console.log('Category selected:', category);
        const newPath = `${currentPath} > ${category.name}`;
        if (category.isLeaf) {
            const selectedLabel = category.name;
            console.log('Navigating back to AiListing with:', selectedLabel);

            Keyboard.dismiss();
            const navState = navigation.getState();
            let aiListingIndex = -1;
            for (let i = navState.routes.length - 1; i >= 0; i -= 1) {
                if (navState.routes[i].name === 'AiListing') {
                    aiListingIndex = i;
                    break;
                }
            }

            if (aiListingIndex >= 0) {
                const popCount = navState.index - aiListingIndex;
                if (popCount > 0) {
                    navigation.dispatch(StackActions.pop(popCount));
                }
                navigation.navigate({ name: 'AiListing', params: { selectedCategory: selectedLabel }, merge: true } as never);
                return;
            }

            // Fallback when AiListing route is not found in stack
            navigation.navigate('AiListing', { selectedCategory: selectedLabel });
        } else {
            console.log('Pushing sub-category:', category.id);
            navigation.push('CategorySelect', {
                parentId: category.id,
                currentPath: newPath
            });
        }
    };

    return (
        <SafeAreaView style={styles.root} edges={['bottom']}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 10), height: 60 + insets.top }]}>
                <Pressable
                    style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7, backgroundColor: '#f1f5f9' }]}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                </Pressable>
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>{t('screen.categorySelect.title')}</Text>
                    {currentPath !== t('screen.categorySelect.all') && (
                        <Text style={styles.pathText} numberOfLines={1}>{currentPath}</Text>
                    )}
                </View>
                <View style={styles.backBtn} />
            </View>

            <FlatList
                data={filteredCategories}
                key={isRootLevel ? 'root-grid' : 'nested-list'}
                numColumns={isRootLevel ? 2 : 1}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={isRootLevel ? styles.gridRow : undefined}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <Pressable
                        style={({ pressed }) => [
                            isRootLevel ? styles.rootItem : styles.listItem,
                            pressed && styles.itemPressed
                        ]}
                        onPress={() => handleSelect(item)}
                    >
                        {isRootLevel ? (
                            <View style={styles.rootItemInner}>
                                {item.icon ? (
                                    <View style={[styles.iconBox, styles.rootIconBox]}>
                                        <MaterialIcons name={item.icon as any} size={28} color="#15803d" />
                                    </View>
                                ) : null}
                                <Text style={styles.rootItemText}>{item.name}</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.itemLeft}>
                                    {item.icon ? (
                                        <View style={styles.iconBox}>
                                            <MaterialIcons name={item.icon as any} size={20} color="#15803d" />
                                        </View>
                                    ) : (
                                        <View style={[styles.iconBox, { backgroundColor: '#f8fafc' }]}>
                                            <MaterialIcons name="subdirectory-arrow-right" size={18} color="#94a3b8" />
                                        </View>
                                    )}
                                    <Text style={styles.itemText}>{item.name}</Text>
                                </View>
                                <MaterialIcons
                                    name={item.isLeaf ? "check-circle" : "chevron-right"}
                                    size={20}
                                    color={item.isLeaf ? "#19e61b" : "#cbd5e1"}
                                />
                            </>
                        )}
                    </Pressable>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialIcons name="search-off" size={48} color="#e2e8f0" />
                        <Text style={styles.emptyText}>{t('screen.categorySelect.empty')}</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#f8fafc', // Slate 50
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 10,
    },
    titleContainer: {
        alignItems: 'center',
        flex: 1,
        gap: 2,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a', // Slate 900
    },
    pathText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#16a34a', // Green 600
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    gridRow: {
        gap: 16,
        marginBottom: 16,
    },
    // Root Item Styles (Grid)
    rootItem: {
        flex: 1,
        aspectRatio: 1, // Square cards
        backgroundColor: '#ffffff',
        borderRadius: 24,
        marginBottom: 0,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        // Premium Shadow
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    rootItemInner: {
        alignItems: 'center',
        gap: 12,
    },
    rootIconBox: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: '#f0fdf4', // Green 50
        borderWidth: 1,
        borderColor: '#dcfce7', // Green 100
        marginBottom: 4,
    },
    rootItemText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
        textAlign: 'center',
    },
    // List Item Styles (Nested)
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginBottom: 12,
        // Softer List Shadow
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155', // Slate 700
    },
    itemPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    empty: {
        padding: 60,
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '500',
    }
});
