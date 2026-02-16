import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    FlatList,
    Pressable,
    ActivityIndicator,
    Keyboard,
    Platform,
    Modal,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { aiBackend } from '../firebaseConfig';

interface LocationPickerProps {
    onLocationChange: (location: { latitude: number; longitude: number; address: string }) => void;
    initialLocation?: { latitude: number; longitude: number; address: string };
}

interface Prediction {
    place_id: string;
    description: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
}

const GOOGLE_API_KEY = "AIzaSyAewtFDFu-tZAldHQe3w0rqqJi8t3m6i5I";

export const LocationPicker: React.FC<LocationPickerProps> = ({
    onLocationChange,
    initialLocation,
}) => {
    const { t, i18n } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(initialLocation?.address || '');
    const [searchInput, setSearchInput] = useState('');
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (searchInput.length < 3) {
            setPredictions([]);
            return;
        }

        const timeoutId = setTimeout(() => {
            fetchPredictions(searchInput);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    const fetchPredictions = async (query: string) => {
        if (!query.trim()) return;
        setIsLoading(true);
        try {
            const lang = i18n.language === 'ko' ? 'ko' : i18n.language === 'hu' ? 'hu' : 'en';
            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&language=${lang}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK') {
                setPredictions(data.predictions);
            } else {
                setPredictions([]);
            }
        } catch (error) {
            console.error('❌ Fetch predictions failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPlace = async (placeId: string, description: string) => {
        setIsLoading(true);
        try {
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${GOOGLE_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK') {
                const { lat, lng } = data.result.geometry.location;
                setSelectedAddress(description);
                setIsModalVisible(false);
                setSearchInput('');
                setPredictions([]);

                onLocationChange({
                    latitude: lat,
                    longitude: lng,
                    address: description,
                });
            }
        } catch (error) {
            console.error('Fetch place details failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderPrediction = ({ item }: { item: Prediction }) => (
        <TouchableOpacity
            style={styles.resultItem}
            onPress={() => handleSelectPlace(item.place_id, item.description)}
        >
            <View style={styles.resultIcon}>
                <MaterialIcons name="location-on" size={20} color="#94a3b8" />
            </View>
            <View style={styles.resultTextContainer}>
                <Text style={styles.mainText} numberOfLines={1}>
                    {item.structured_formatting.main_text}
                </Text>
                <Text style={styles.secondaryText} numberOfLines={1}>
                    {item.structured_formatting.secondary_text}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{t('screen.locationPicker.label')}</Text>

            {/* Trigger Button */}
            <TouchableOpacity
                style={styles.triggerContainer}
                onPress={() => {
                    setSearchInput('');
                    setPredictions([]);
                    setIsModalVisible(true);
                }}
            >
                <MaterialIcons name="location-searching" size={22} color="#16a34a" style={styles.searchIcon} />
                <Text
                    style={[styles.triggerText, !selectedAddress && styles.placeholderText]}
                    numberOfLines={1}
                >
                    {selectedAddress || t('screen.locationPicker.placeholder')}
                </Text>
                <MaterialIcons name="keyboard-arrow-right" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <Text style={styles.hint}>{t('screen.locationPicker.hint')}</Text>

            {/* Address Search Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContent}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => setIsModalVisible(false)}
                            style={styles.closeBtn}
                        >
                            <MaterialIcons name="close" size={24} color="#0f172a" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{t('screen.locationPicker.label')}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Modal Search Bar */}
                    <View style={styles.modalSearchContainer}>
                        <View style={styles.modalInputContainer}>
                            <MaterialIcons name="search" size={22} color="#16a34a" style={styles.searchIcon} />
                            <TextInput
                                style={styles.modalInput}
                                placeholder={t('screen.locationPicker.placeholder')}
                                placeholderTextColor="#94a3b8"
                                value={searchInput}
                                onChangeText={setSearchInput}
                                autoFocus={true}
                                clearButtonMode="while-editing"
                            />
                        </View>
                    </View>

                    {/* Results Area */}
                    <View style={{ flex: 1 }}>
                        {isLoading ? (
                            <View style={styles.centerLoader}>
                                <ActivityIndicator size="large" color="#22c55e" />
                                <Text style={styles.loadingText}>{t('screen.locationPicker.searching')}</Text>
                            </View>
                        ) : predictions.length > 0 ? (
                            <FlatList
                                data={predictions}
                                renderItem={renderPrediction}
                                keyExtractor={(item) => item.place_id}
                                contentContainerStyle={styles.listContent}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                                keyboardShouldPersistTaps="handled"
                            />
                        ) : searchInput.length >= 3 ? (
                            <View style={styles.noResults}>
                                <MaterialIcons name="location-off" size={48} color="#e2e8f0" />
                                <Text style={styles.noResultsText}>{t('screen.locationPicker.noResults')}</Text>
                            </View>
                        ) : (
                            <View style={styles.emptySearch}>
                                <MaterialIcons name="map" size={48} color="#f1f5f9" />
                                <Text style={styles.emptySearchText}>
                                    {t('screen.locationPicker.hint')}
                                </Text>
                            </View>
                        )}
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '900',
        color: '#64748b',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    triggerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 56,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    triggerText: {
        flex: 1,
        fontSize: 15,
        color: '#0f172a',
        fontWeight: '600',
    },
    placeholderText: {
        color: '#94a3b8',
        fontWeight: '500',
    },
    searchIcon: {
        marginRight: 10,
    },
    hint: {
        marginTop: 8,
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
        paddingHorizontal: 4,
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#f6f8f6',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#fff',
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    modalSearchContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    modalInput: {
        flex: 1,
        fontSize: 15,
        color: '#0f172a',
        fontWeight: '500',
    },
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '500',
    },
    listContent: {
        backgroundColor: '#fff',
        paddingVertical: 8,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    resultIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    resultTextContainer: {
        flex: 1,
    },
    mainText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    secondaryText: {
        fontSize: 12,
        color: '#64748b',
    },
    separator: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 16,
    },
    noResults: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        paddingTop: 100,
    },
    noResultsText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
    emptySearch: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        paddingTop: 100,
    },
    emptySearchText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
    },
});
