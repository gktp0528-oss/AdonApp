import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Platform, ActivityIndicator } from 'react-native';
import MapView, { UrlTile, Region, PROVIDER_DEFAULT } from 'react-native-maps';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
            <Text style={styles.label}>거래 희망 장소</Text>

            <View style={styles.mapContainer}>
                <MapView
                    provider={PROVIDER_DEFAULT}
                    style={styles.map}
                    initialRegion={region}
                    onRegionChangeComplete={onRegionChangeComplete}
                    onMapReady={() => setIsMapReady(true)}
                    mapType={Platform.OS === 'android' ? 'none' : 'standard'}
                    rotateEnabled={false}
                    showsUserLocation={true} // Optional: requires permissions in real app
                >
                    <UrlTile
                        urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maximumZ={19}
                        flipY={false}
                    />
                </MapView>

                {/* Fixed Center Marker */}
                <View style={styles.markerFixed}>
                    <MaterialIcons name="location-on" size={36} color="#22c55e" />
                </View>

                {!isMapReady && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="small" color="#22c55e" />
                    </View>
                )}
            </View>

            <Text style={styles.hint}>지도를 움직여 핀의 위치를 조정해주세요.</Text>

            <View style={styles.inputContainer}>
                <MaterialIcons name="edit-location" size={20} color="#64748b" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="장소 이름 (예: 강남역 10번 출구)"
                    placeholderTextColor="#94a3b8"
                    value={address}
                    onChangeText={setAddress}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    mapContainer: {
        height: 200,
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#e5e7eb',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    markerFixed: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -18,
        marginTop: -36,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hint: {
        marginTop: 6,
        marginBottom: 10,
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 12,
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 15,
        color: '#0f172a',
    },
});
