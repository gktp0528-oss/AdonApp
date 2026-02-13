import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface Props {
    rating: number;
    maxRating?: number;
    size?: number;
    color?: string;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
}

export const StarRating: React.FC<Props> = ({
    rating,
    maxRating = 5,
    size = 24,
    color = '#fbbf24', // Amber 400
    onRatingChange,
    readonly = false
}) => {
    const stars = [];

    for (let i = 1; i <= maxRating; i++) {
        const isSelected = i <= Math.floor(rating);
        const isHalf = i > rating && i - 1 < rating;

        stars.push(
            <TouchableOpacity
                key={i}
                disabled={readonly}
                onPress={() => onRatingChange && onRatingChange(i)}
                style={styles.starWrapper}
            >
                <MaterialIcons
                    name={isSelected ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                    size={size}
                    color={isSelected || isHalf ? color : '#e2e8f0'} // Slate 200 for empty
                />
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            {stars}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starWrapper: {
        padding: 2,
    }
});
