import React, { ReactNode } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LAYOUT } from '../constants/layout';

interface AdonHeaderProps {
    title?: string;
    leftElement?: ReactNode;
    rightElement?: ReactNode;
    onClose?: () => void;
    showClose?: boolean;
}

export const AdonHeader = ({
    title,
    leftElement,
    rightElement,
    onClose,
    showClose = false,
}: AdonHeaderProps) => {
    const insets = useSafeAreaInsets();
    const topPadding = Math.max(insets.top, 16);

    return (
        <View style={[styles.container, { paddingTop: topPadding }]}>
            <View style={styles.content}>
                <View style={styles.left}>
                    {leftElement}
                </View>

                {title ? (
                    <View style={styles.center}>
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                    </View>
                ) : null}

                <View style={styles.right}>
                    {rightElement}
                    {showClose && (
                        <Pressable
                            onPress={onClose}
                            style={styles.closeBtn}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <MaterialIcons name="close" size={24} color="#111" />
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f6f8f6',
        borderBottomWidth: 1,
        borderBottomColor: '#edf2ed',
    },
    content: {
        height: LAYOUT.HEADER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: LAYOUT.PADDING_HORIZONTAL,
    },
    left: {
        flex: 1,
        alignItems: 'flex-start',
    },
    center: {
        flex: 2,
        alignItems: 'center',
    },
    right: {
        flex: 1,
        alignItems: 'flex-end',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },
    closeBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
