import React, { useMemo } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import ALL_CATEGORIES from '../data/categories.json';

type Props = NativeStackScreenProps<RootStackParamList, 'CategorySelect'>;
type CategoryItem = {
    id: string;
    name: string;
    parentId: string | null;
    isLeaf: boolean;
    icon?: string;
};
const ROOT_PATH = 'All Categories';

export function CategorySelectScreen({ navigation, route }: Props) {
    const parentId = route.params?.parentId || null;
    const currentPath = route.params?.currentPath || ROOT_PATH;
    const isRootLevel = parentId === null;

    const filteredCategories = useMemo(() => {
        return (ALL_CATEGORIES as CategoryItem[]).filter(cat => cat.parentId === parentId);
    }, [parentId]);

    const handleSelect = (category: CategoryItem) => {
        const newPath = `${currentPath} > ${category.name}`;
        if (category.isLeaf) {
            const displayPath = newPath.replace(`${ROOT_PATH} > `, '');
            navigation.navigate('AiListing', { selectedCategory: displayPath } as any);
        } else {
            navigation.push('CategorySelect', {
                parentId: category.id,
                currentPath: newPath
            });
        }
    };

    return (
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                </Pressable>
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>Select Category</Text>
                    <Text style={styles.pathText} numberOfLines={1}>{currentPath}</Text>
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
                renderItem={({ item }) => (
                    <Pressable
                        style={[styles.item, isRootLevel && styles.rootItem]}
                        onPress={() => handleSelect(item)}
                    >
                        {isRootLevel ? (
                            <View style={styles.rootItemInner}>
                                {item.icon ? (
                                    <View style={styles.iconBox}>
                                        <MaterialIcons name={item.icon as any} size={20} color="#64748b" />
                                    </View>
                                ) : null}
                                <Text style={styles.rootItemText}>{item.name}</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.itemLeft}>
                                    {item.icon ? (
                                        <View style={styles.iconBox}>
                                            <MaterialIcons name={item.icon as any} size={20} color="#64748b" />
                                        </View>
                                    ) : null}
                                    <Text style={styles.itemText}>{item.name}</Text>
                                </View>
                                <MaterialIcons
                                    name={item.isLeaf ? "check" : "chevron-right"}
                                    size={20}
                                    color={item.isLeaf ? "#10b981" : "#cbd5e1"}
                                />
                            </>
                        )}
                    </Pressable>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No subcategories found.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    titleContainer: {
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    pathText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 16,
    },
    gridRow: {
        gap: 10,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        padding: 18,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    rootItem: {
        flex: 1,
        minHeight: 112,
        marginBottom: 10,
        paddingVertical: 14,
        paddingHorizontal: 10,
    },
    rootItemInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rootItemText: {
        marginTop: 10,
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '700',
        textAlign: 'center',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemText: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '600',
    },
    empty: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 14,
    }
});
