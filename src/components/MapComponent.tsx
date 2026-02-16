import React from 'react';
import { StyleSheet, View, Text, Platform, Pressable, Linking } from 'react-native';
import MapView, { UrlTile, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface MapComponentProps {
    latitude?: number;
    longitude?: number;
    height?: number;
    label?: string;
}

const DEFAULT_LATITUDE = 47.497913; // Budapest
const DEFAULT_LONGITUDE = 19.040236;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = 0.05;

export const MapComponent: React.FC<MapComponentProps> = ({
    latitude = DEFAULT_LATITUDE,
    longitude = DEFAULT_LONGITUDE,
    height = 200,
    label = 'Pickup Location',
}) => {
    const handleOpenMap = () => {
        // Force Google Maps URL scheme for both platforms if possible, 
        // fall back to universal web link which opens Google Maps app/web
        const latLng = `${latitude},${longitude}`;
        const url = `https://www.google.com/maps/search/?api=1&query=${latLng}`;

        Linking.openURL(url);
    };

    return (
        <Pressable onPress={handleOpenMap} style={[styles.container, { height }]}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: Number(latitude) || DEFAULT_LATITUDE,
                    longitude: Number(longitude) || DEFAULT_LONGITUDE,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                }}
                rotateEnabled={false}
                scrollEnabled={false}
                zoomEnabled={false}
                pointerEvents="none"
            >
                <UrlTile
                    urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maximumZ={19}
                    flipY={false}
                />
                <Marker
                    coordinate={{
                        latitude: Number(latitude) || DEFAULT_LATITUDE,
                        longitude: Number(longitude) || DEFAULT_LONGITUDE
                    }}
                    pinColor="#22c55e"
                />
            </MapView>
            {/* Attribution for OSM */}
            <View style={styles.attribution}>
                <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#e5e7eb',
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    attribution: {
        position: 'absolute',
        bottom: 4,
        right: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    attributionText: {
        fontSize: 10,
        color: '#64748b',
    },
});
