import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Image, Dimensions } from 'react-native';
import { theme } from '../theme';

interface AnimatedBackgroundProps {
    children?: React.ReactNode;
}

const { width, height } = Dimensions.get('window');
// Assuming the seamless pattern is roughly 1024x1024 or at least large enough to tile.
const PATTERN_SIZE = 1024;

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ children }) => {
    // Animation values
    const translateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startAnimation = () => {
            // Complete loop from 0 to 1
            translateAnim.setValue(0);
            Animated.loop(
                Animated.timing(translateAnim, {
                    toValue: 1,
                    duration: 15000, // 15 seconds for a full cycle - slow and smooth
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        };

        startAnimation();
    }, [translateAnim]);

    // Interpolate 0-1 to pixel values
    // Moving diagonally: -512px (half typical texture size) or enough to seamlessly loop
    // If the pattern is seamless, we just need to move by one 'tile' size.
    // Let's assume a tile size of 512 for a smoother visible repeat, or 1024.
    // We'll try 512px first. If the pattern is 1024, 512 might show a "jump" if not perfectly symmetric,
    // but usually seamless patterns loop at their full width. 
    // Let's guess 1024 to be safe for high-res generated images.


    const translateX = translateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -PATTERN_SIZE],
    });

    const translateY = translateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -PATTERN_SIZE],
    });

    return (
        <View style={styles.container}>
            {/* Animated Background Image Layer */}
            <Animated.View
                style={[
                    styles.imageContainer,
                    {
                        transform: [
                            { translateX },
                            { translateY },
                        ],
                    },
                ]}
            >
                <Image
                    source={require('../../assets/auth-bg-pattern.png')}
                    style={styles.backgroundImage}
                    resizeMode="repeat"
                />
            </Animated.View>

            {/* Overlay to improve text readability */}
            <View style={styles.overlay} />

            {/* Content Overlay */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
        overflow: 'hidden', // Clip the overflowing background
    },
    imageContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        // Make the container huge so it covers the screen even when translated
        // Width = Screen Width + Pattern Size (buffer for scrolling)
        // Actually, simply making it huge is easier.
        width: PATTERN_SIZE * 4,
        height: PATTERN_SIZE * 4,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.bg,
        opacity: 0.85, // Strong fade to make text legible
    },
    content: {
        flex: 1,
    },
});
