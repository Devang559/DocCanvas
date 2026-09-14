import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../utils/theme';
import { useDocuments } from '../context/DocumentContext';
import { useDocumentActions } from '../hooks/useDocumentActions';
import AppHeader from '../components/AppHeader';
import Chip from '../components/Chip';
import TemplateCard from '../components/TemplateCard';
import BottomNavBar from '../components/BottomNavBar';
import type { Template } from '../types';

const CATEGORY_CHIPS = [
  'Resumes',
  'Cover letters',
  'Business',
  'Invoices',
  'Education',
  'Notes',
  'Forms',
  'Certificates',
];

const GAP = 12;
const screenW = Dimensions.get('window').width;
const cardW = (screenW - 32 - GAP) / 2;

const TemplatesScreen = () => {
  const { templates } = useDocuments();
  const { applyTemplate } = useDocumentActions();
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!activeCat) {
      return templates;
    }
    return templates.filter(t => t.category === activeCat);
  }, [templates, activeCat]);

  const handleUse = useCallback(
    (template: Template) => {
      applyTemplate(template);
    },
    [applyTemplate],
  );

  const visibleChips = ['All', ...CATEGORY_CHIPS];

  return (
    <View style={styles.screen}>
      <AppHeader title="DocCanvas" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.h1}>Templates</Text>
        </View>

        <View style={styles.chips}>
          {visibleChips.map(cat => (
            <Chip
              key={cat}
              label={cat}
              selected={activeCat === null && cat === 'All'}
              variant="category"
              onPress={() => setActiveCat(null)}
              ariaLabel={cat}
            />
          ))}
          {CATEGORY_CHIPS.map(cat => (
            <Chip
              key={cat}
              label={cat}
              selected={activeCat === cat}
              variant="category"
              onPress={() => setActiveCat(cat)}
              ariaLabel={cat}
            />
          ))}
        </View>

        <View style={styles.grid}>
          {filtered.length === 0 ? (
            <Text style={styles.empty}>No templates in this category.</Text>
          ) : (
            filtered.map(template => (
              <View key={template.id} style={{ width: cardW }}>
                <TemplateCard
                  template={template}
                  onUse={() => handleUse(template)}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    marginBottom: 8,
  },
  h1: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  empty: {
    color: colors.mutedForeground,
    fontSize: 13,
    textAlign: 'center',
    width: '100%',
    paddingVertical: 24,
  },
});

export default TemplatesScreen;
