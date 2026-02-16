import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Platform, ActivityIndicator } from 'react-native';
import MapView, { UrlTile, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

interface LocationPickerProps {
    onLocationChange: (location: { latitude: number; longitude: number; address: string }) => void;
    initialLocation?: { latitude: number; longitude: number; address: string };
}

const DEFAULT_LATITUDE = 47.497913; // Budapest
const DEFAULT_LONGITUDE = 19.040236;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = 0.01;

export const LocationPicker: React.FC<LocationPickerProps> = ({
    onLocationChange,
    initialLocation,
}) => {
    const { t } = useTranslation();
    const [region, setRegion] = useState<Region>({
        latitude: initialLocation?.latitude || DEFAULT_LATITUDE,
        longitude: initialLocation?.longitude || DEFAULT_LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
    });

    const [address, setAddress] = useState(initialLocation?.address || '');
    const [isMapReady, setIsMapReady] = useState(false);

    // Debounce location updates to avoid too many updates while dragging
    useEffect(() => {
        const timer = setTimeout(() => {
            onLocationChange({
                latitude: region.latitude,
                longitude: region.longitude,
                address,
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [region, address]);

    const onRegionChangeComplete = (newRegion: Region) => {
        setRegion(newRegion);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{t('screen.locationPicker.label')}</Text>

            <View style={styles.mapContainer}>
                <MapView
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    style={styles.map}
                    initialRegion={region}
                    onRegionChangeComplete={onRegionChangeComplete}
                    onMapReady={() => setIsMapReady(true)}
                    rotateEnabled={false}
                    showsUserLocation={true}
                >
                    <UrlTile
                        urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maximumZ={19}
                        flipY={false}
                    />
                </MapView>

                {/* Fixed Center Marker */}
                <View style={styles.markerFixed}>
                    <MaterialIcons name="location-on" size={38} color="#22c55e" />
                </View>

                {/* Floating Input Card */}
                <View style={styles.floatingCard}>
                    <Text style={styles.hint}>{t('screen.locationPicker.hint')}</Text>
                    <View style={styles.inputContainer}>
                        <MaterialIcons name="edit-location" size={20} color="#16a34a" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('screen.locationPicker.placeholder')}
                            placeholderTextColor="#94a3b8"
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>
                </View>

                {!isMapReady && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="small" color="#22c55e" />
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 10,
    },
    mapContainer: {
        height: 300,
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#e5e7eb',
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    markerFixed: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -19,
        marginTop: -38, // Adjusted for slightly larger icon
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingCard: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 12,
        // Premium Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    hint: {
        marginBottom: 8,
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 14,
        color: '#0f172a',
        fontWeight: '500',
    },
});
