import React from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../constants/legalContent';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Legal'>;

// Parses **bold** and [text](url) inline patterns
function parseInline(text: string): React.ReactNode {
    const pattern = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<Text key={key++}>{text.slice(lastIndex, match.index)}</Text>);
        }
        if (match[0].startsWith('**')) {
            parts.push(<Text key={key++} style={inlineStyles.bold}>{match[1]}</Text>);
        } else {
            const url = match[3];
            parts.push(
                <Text key={key++} style={inlineStyles.link} onPress={() => Linking.openURL(url)}>
                    {match[2]}
                </Text>
            );
        }
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        parts.push(<Text key={key++}>{text.slice(lastIndex)}</Text>);
    }
    return parts.length === 0 ? text : parts;
}

function renderMarkdown(content: string): React.ReactNode[] {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, i) => {
        const trimmed = line.trim();

        if (!trimmed) {
            elements.push(<View key={`sp-${i}`} style={{ height: 6 }} />);
            return;
        }

        // Horizontal rule
        if (trimmed === '---') {
            elements.push(<View key={i} style={styles.divider} />);
            return;
        }

        // h1
        if (trimmed.startsWith('# ')) {
            elements.push(<Text key={i} style={styles.h1}>{trimmed.slice(2)}</Text>);
            return;
        }

        // h2
        if (trimmed.startsWith('## ')) {
            elements.push(<Text key={i} style={styles.h2}>{trimmed.slice(3)}</Text>);
            return;
        }

        // h3
        if (trimmed.startsWith('### ')) {
            elements.push(<Text key={i} style={styles.h3}>{trimmed.slice(4)}</Text>);
            return;
        }

        // h4
        if (trimmed.startsWith('#### ')) {
            elements.push(<Text key={i} style={styles.h4}>{trimmed.slice(5)}</Text>);
            return;
        }

        // Numbered list item (1. / 2. etc.)
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) {
            elements.push(
                <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bulletNumber}>{numberedMatch[1]}.</Text>
                    <Text style={styles.bulletText}>{parseInline(numberedMatch[2])}</Text>
                </View>
            );
            return;
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            elements.push(
                <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{parseInline(trimmed.slice(2))}</Text>
                </View>
            );
            return;
        }

        // Table separator — skip
        if (trimmed.startsWith('|') && trimmed.includes('---')) {
            return;
        }

        // Table row
        if (trimmed.startsWith('|')) {
            const cols = trimmed.split('|').filter(c => c.trim()).map(c => c.trim());
            elements.push(
                <View key={i} style={styles.tableRow}>
                    {cols.map((col, j) => (
                        <Text key={j} style={styles.tableCell}>{parseInline(col)}</Text>
                    ))}
                </View>
            );
            return;
        }

        // Regular paragraph
        elements.push(
            <Text key={i} style={styles.paragraph}>{parseInline(trimmed)}</Text>
        );
    });

    return elements;
}

export function LegalScreen({ route, navigation }: Props) {
    const { type } = route.params;
    const content = type === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY;
    const title = type === 'terms' ? 'Terms of Service' : 'Privacy Policy';

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {renderMarkdown(content)}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const inlineStyles = StyleSheet.create({
    bold: { fontWeight: '700', color: theme.colors.text },
    link: { color: theme.colors.primary, textDecorationLine: 'underline' },
});

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 16,
    },
    h1: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: 4,
    },
    h2: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text,
        marginTop: 12,
        marginBottom: 4,
    },
    h3: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
        marginTop: 8,
        marginBottom: 2,
    },
    h4: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.muted,
        marginTop: 6,
        marginBottom: 2,
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 22,
        color: theme.colors.text,
        marginBottom: 2,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 2,
        paddingLeft: 8,
    },
    bulletDot: {
        fontSize: 14,
        color: theme.colors.primary,
        marginRight: 8,
        lineHeight: 22,
    },
    bulletNumber: {
        fontSize: 14,
        color: theme.colors.primary,
        marginRight: 8,
        lineHeight: 22,
        fontWeight: '600',
        minWidth: 20,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
        color: theme.colors.text,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingVertical: 6,
    },
    tableCell: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text,
        lineHeight: 20,
    },
});
