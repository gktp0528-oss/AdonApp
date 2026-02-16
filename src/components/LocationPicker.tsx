import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Dimensions,
} from 'react-native';
import MapView, { UrlTile, Marker, Region } from 'react-native-maps';
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

// Platform-specific API keys for better compatibility and security
const GOOGLE_API_KEY = Platform.select({
    ios: "AIzaSyCHhiuxAUVgLyjn71LNR3e8Eu5u03Dc6Zc", // From GoogleService-Info.plist
    android: "AIzaSyAewtFDFu-tZAldHQe3w0rqqJi8t3m6i5I", // From google-services.json
    default: "AIzaSyA1cqQPP2y2-4dMfYN-HRoHZG44N4EXv7I", // Fallback from firebaseConfig.ts
});

// Default map center (Budapest, Hungary)
const DEFAULT_LATITUDE = 47.497913;
const DEFAULT_LONGITUDE = 19.040236;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = 0.05;

export const LocationPicker: React.FC<LocationPickerProps> = ({
    onLocationChange,
    initialLocation,
}) => {
    const { t, i18n } = useTranslation();
    const mapRef = useRef<MapView>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(initialLocation?.address || '');
    const [searchInput, setSearchInput] = useState('');
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(
        initialLocation ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude } : null
    );
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: initialLocation?.latitude || DEFAULT_LATITUDE,
        longitude: initialLocation?.longitude || DEFAULT_LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
    });

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
        console.log('🔍 Address search query (New API):', query);
        try {
            const lang = i18n.language === 'ko' ? 'ko' : i18n.language === 'hu' ? 'hu' : 'en';
            // Places API (New) endpoint
            const url = `https://places.googleapis.com/v1/places:autocomplete`;

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY || '',
            };

            if (Platform.OS === 'ios') {
                headers['X-Ios-Bundle-Identifier'] = 'com.adonapp.adon';
            } else if (Platform.OS === 'android') {
                headers['X-Android-Package'] = 'com.adonapp.adon';
            }

            const body = {
                input: query,
                languageCode: lang,
                includedRegionCodes: ['HU'], // Restrict to Hungary
            };

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            const data = await response.json();

            console.log('📍 Autocomplete (New) Response:', !!data.suggestions);

            if (data.suggestions) {
                // Map New API response to our existing Prediction interface
                const mappedPredictions = data.suggestions.map((s: any) => ({
                    place_id: s.placePrediction.placeId,
                    description: s.placePrediction.text.text,
                    structured_formatting: {
                        main_text: s.placePrediction.structuredFormat.mainText.text,
                        secondary_text: s.placePrediction.structuredFormat.secondaryText?.text || '',
                    },
                }));
                setPredictions(mappedPredictions);
                setApiError(null);
            } else if (data.error) {
                const errorMsg = data.error.message || data.error.status;
                console.warn('⚠️ Autocomplete API Error:', errorMsg);
                setPredictions([]);
                setApiError(errorMsg);
            } else {
                setPredictions([]);
            }
        } catch (error: any) {
            console.error('❌ Fetch predictions failed:', error);
            setApiError(error.message || 'Network error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPlace = async (placeId: string, description: string) => {
        setIsLoading(true);
        setApiError(null);
        try {
            // Places API (New) Place Details endpoint
            const url = `https://places.googleapis.com/v1/places/${placeId}`;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY || '',
                'X-Goog-FieldMask': 'location,formattedAddress',
            };

            if (Platform.OS === 'ios') {
                headers['X-Ios-Bundle-Identifier'] = 'com.adonapp.adon';
            } else if (Platform.OS === 'android') {
                headers['X-Android-Package'] = 'com.adonapp.adon';
            }

            const response = await fetch(url, { headers });
            const data = await response.json();

            if (data.location) {
                const { latitude, longitude } = data.location;

                // Update map location and marker
                setSelectedLocation({ latitude, longitude });
                const newRegion = {
                    latitude,
                    longitude,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                };
                setMapRegion(newRegion);

                // Animate map to new location
                if (mapRef.current) {
                    mapRef.current.animateToRegion(newRegion, 500);
                }

                setSelectedAddress(description);
                setSearchInput('');
                setPredictions([]);
            } else if (data.error) {
                setApiError(data.error.message || data.error.status);
            }
        } catch (error: any) {
            console.error('Fetch place details failed:', error);
            setApiError(error.message || 'Network error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkerDragEnd = async (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setSelectedLocation({ latitude, longitude });

        // Reverse geocode to get address
        try {
            const url = `https://places.googleapis.com/v1/places:searchNearby`;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY || '',
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress',
            };

            if (Platform.OS === 'ios') {
                headers['X-Ios-Bundle-Identifier'] = 'com.adonapp.adon';
            } else if (Platform.OS === 'android') {
                headers['X-Android-Package'] = 'com.adonapp.adon';
            }

            const body = {
                locationRestriction: {
                    circle: {
                        center: { latitude, longitude },
                        radius: 50.0
                    }
                },
                maxResultCount: 1,
            };

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            const data = await response.json();

            if (data.places && data.places.length > 0) {
                const address = data.places[0].formattedAddress || data.places[0].displayName?.text || 'Unknown location';
                setSelectedAddress(address);
            }
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
        }
    };

    const handleConfirmLocation = () => {
        if (selectedLocation && selectedAddress) {
            onLocationChange({
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                address: selectedAddress,
            });
            setIsModalVisible(false);
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

                    {/* Map View */}
                    <View style={styles.mapContainer}>
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            initialRegion={mapRegion}
                            rotateEnabled={false}
                            showsUserLocation={false}
                            showsMyLocationButton={false}
                        >
                            <UrlTile
                                urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                maximumZ={19}
                                flipY={false}
                            />
                            {selectedLocation && (
                                <Marker
                                    coordinate={selectedLocation}
                                    draggable
                                    onDragEnd={handleMarkerDragEnd}
                                    pinColor="#22c55e"
                                />
                            )}
                        </MapView>
                        {/* OSM Attribution */}
                        <View style={styles.mapAttribution}>
                            <Text style={styles.mapAttributionText}>© OpenStreetMap</Text>
                        </View>
                    </View>

                    {/* Results Area */}
                    <View style={{ flex: 1 }}>
                        {apiError && (
                            <View style={styles.errorBanner}>
                                <MaterialIcons name="error-outline" size={20} color="#ef4444" />
                                <Text style={styles.errorText} numberOfLines={2}>{apiError}</Text>
                            </View>
                        )}

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

                    {/* Confirm Button - Only show when location is selected */}
                    {selectedLocation && (
                        <View style={styles.confirmButtonContainer}>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleConfirmLocation}
                            >
                                <MaterialIcons name="check" size={24} color="#fff" />
                                <Text style={styles.confirmButtonText}>{t('screen.locationPicker.confirm') || 'Confirm Location'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
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
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 12,
        margin: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
        gap: 8,
    },
    errorText: {
        flex: 1,
        color: '#b91c1c',
        fontSize: 13,
        fontWeight: '500',
    },
    mapContainer: {
        height: 250,
        width: '100%',
        position: 'relative',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapAttribution: {
        position: 'absolute',
        bottom: 4,
        right: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    mapAttributionText: {
        fontSize: 10,
        color: '#64748b',
    },
    confirmButtonContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#22c55e',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
