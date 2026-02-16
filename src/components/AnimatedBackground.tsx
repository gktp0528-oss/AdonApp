import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Image, Dimensions } from 'react-native';
import { theme } from '../theme';

interface AnimatedBackgroundProps {
    children?: React.ReactNode;
}

const { width, height } = Dimensions.get('window');
// The image is 640x640px. As @3x, its logical size is 640/3 ≈ 213.33pt.
// To ensure a seamless loop, we should translate by a multiple of this logical size.
const LOGICAL_PATTERN_SIZE = 640 / 3;

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ children }) => {
    // Animation values
    const translateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startAnimation = () => {
            translateAnim.setValue(0);
            Animated.loop(
                Animated.timing(translateAnim, {
                    toValue: 1,
                    duration: 20000, // Slightly slower for better feel
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        };

        startAnimation();
    }, [translateAnim]);

    // Interpolate 0-1 to logically move one full tile size diagonally
    const translateX = translateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -LOGICAL_PATTERN_SIZE],
    });

    const translateY = translateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -LOGICAL_PATTERN_SIZE],
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
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        // Make the container large enough to cover screen plus one movement cycle
        width: width + LOGICAL_PATTERN_SIZE,
        height: height + LOGICAL_PATTERN_SIZE,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
    },

            {/* Overlay to improve text readability */ }
    < View style = { styles.overlay } />

    {/* Content Overlay */ }
    < View style = { styles.content } >
    { children }
            </View >
        </View >
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
