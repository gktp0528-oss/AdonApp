import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { authService } from '../services/authService';

/**
 * 전용 런치 스크린 (Launch Screen)
 * 연출: 
 * 1. 흰 배경에 'A' 로고박스 등장 (Scale & Fade In)
 * 2. 'A' 뒤에서 'don' 텍스트 슬라이딩 (Slide out to right)
 * 3. 하단 로딩바 표시
 * 4. 완료 후 로그인 화면으로 이동
 */
export const LaunchScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Animation Values
    const logoScale = useRef(new Animated.Value(0.3)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const donTranslateX = useRef(new Animated.Value(-20)).current; // A 뒤에 숨어있음
    const donOpacity = useRef(new Animated.Value(0)).current;
    const footerOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Check auth state while animation plays
        let isLoggedIn = false;
        const unsubscribe = authService.observeAuthState((user) => {
            isLoggedIn = !!user;
            unsubscribe();
        });

        // Animation Sequence
        Animated.sequence([
            // 1. A 로고 등장
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 40,
                    friction: 7,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            // 2. don 텍스트 슬라이드 & 로딩바 등장
            Animated.delay(300),
            Animated.parallel([
                Animated.timing(donTranslateX, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(donOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(footerOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // 3. 자동 화면 전환 (3.5초 후)
        const timer = setTimeout(() => {
            navigation.replace(isLoggedIn ? 'MainTabs' : 'Splash');
        }, 3500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.logoWrapper}>
                {/* A 로고 박스 (Splash와 동일 스타일) */}
                <Animated.View
                    style={[
                        styles.logoBox,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }]
                        }
                    ]}
                >
                    <Text style={styles.logoTextA}>A</Text>
                </Animated.View>

                {/* don 텍스트 (A 뒤에서 등장) */}
                <Animated.View
                    style={[
                        styles.donContainer,
                        {
                            opacity: donOpacity,
                            transform: [{ translateX: donTranslateX }]
                        }
                    ]}
                >
                    <Text style={styles.logoTextDon}>don</Text>
                </Animated.View>
            </View>

            {/* 하단 로딩 및 카피라이트 */}
            <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
                <ActivityIndicator size="small" color="#bef264" style={styles.loader} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff', // 대표님 요청: 흰색 배경
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoBox: {
        width: 80,
        height: 80,
        backgroundColor: '#bef264', // Adon Lime
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2, // don 보다 앞에 위치
        shadowColor: '#bef264',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    logoTextA: {
        fontSize: 50,
        fontWeight: '900',
        color: '#000000',
        marginTop: -2,
    },
    donContainer: {
        marginLeft: 8,
        zIndex: 1,
    },
    logoTextDon: {
        fontSize: 60,
        fontWeight: '900',
        color: '#000000',
        letterSpacing: -1,
    },
    footer: {
        position: 'absolute',
        bottom: 80,
        alignItems: 'center',
    },
    loader: {
        marginBottom: 16,
    },
});
