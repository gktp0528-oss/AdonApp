import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

type Props = {
    children: React.ReactNode;
    style?: ViewStyle;
};

export function TabTransitionView({ children, style }: Props) {
    const isFocused = useIsFocused();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(8)).current; // Subtle slide up

    useEffect(() => {
        if (isFocused) {
            // Reset values for replay
            fadeAnim.setValue(0);
            slideAnim.setValue(8);

            // Fast and smooth animation
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isFocused]);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
                style,
            ]}
        >
            {children}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
