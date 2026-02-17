import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View, Animated, Pressable, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export interface InAppNotificationRef {
    show: (title: string, body: string, data?: any) => void;
}

interface Props {
    onPress?: (data: any) => void;
}

export const InAppNotification = forwardRef<InAppNotificationRef, Props>(({ onPress }, ref) => {
    const slideAnim = useRef(new Animated.Value(-150)).current;
    const [visible, setVisible] = React.useState(false);
    const [notification, setNotification] = React.useState({ title: '', body: '', data: null as any });
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useImperativeHandle(ref, () => ({
        show: (title: string, body: string, data?: any) => {
            if (timerRef.current) clearTimeout(timerRef.current);

            setNotification({ title, body, data });
            setVisible(true);

            // Slide Down
            Animated.spring(slideAnim, {
                toValue: 20, // Bottom offset from top safe area
                useNativeDriver: true,
                friction: 8,
                tension: 40,
            }).start();

            // Auto Hide after 4s
            timerRef.current = setTimeout(() => {
                hide();
            }, 4000);
        }
    }));

    const hide = () => {
        Animated.timing(slideAnim, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setVisible(false));
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] }
            ]}
        >
            <Pressable
                style={styles.content}
                onPress={() => {
                    if (onPress) onPress(notification.data);
                    hide();
                }}
            >
                <View style={styles.iconContainer}>
                    <View style={styles.logoBox}>
                        <Text style={styles.logoBoxText}>A</Text>
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
                    <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
                </View>

                <View style={styles.closeBtn}>
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
                </View>
            </Pressable>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 40 : 10, // Adjusted for safe area roughly
        left: 16,
        right: 16,
        zIndex: 9999,
        // Shadow for premium look
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    iconContainer: {
        marginRight: 12,
    },
    logoBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoBoxText: {
        fontSize: 22,
        fontWeight: '900',
        color: '#000',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: 2,
    },
    body: {
        fontSize: 13,
        color: '#4b5563',
        lineHeight: 18,
    },
    closeBtn: {
        marginLeft: 8,
        padding: 4,
    }
});
