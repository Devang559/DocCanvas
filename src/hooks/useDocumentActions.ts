import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useDocuments } from '../context/DocumentContext';
import { useNavigation } from '@react-navigation/native';
import type {
  RootStackNavigationProp,
  DocumentContent,
  Template,
} from '../types';

export const BLANK_CONTENT: DocumentContent = {
  title: '',
  subtitle: '',
  sections: [],
};

export function useDocumentActions() {
  const { createDocument, createFromTemplate } = useDocuments();
  const navigation = useNavigation<RootStackNavigationProp>();

  const openEditor = useCallback(
    (docId: string) => {
      navigation.navigate('Editor', { documentId: docId });
    },
    [navigation],
  );

  const createNew = useCallback(() => {
    const doc = createDocument({
      title: 'Untitled document',
      fileName: 'Untitled document.docx',
      type: 'doc',
      extension: 'DOC',
      category: 'Documents',
      pageCount: 1,
      content: BLANK_CONTENT,
    });
    openEditor(doc.id);
  }, [createDocument, openEditor]);

  const importPdf = useCallback(() => {
    const doc = createDocument({
      title: 'Imported Document',
      fileName: 'Imported Document.pdf',
      type: 'pdf',
      extension: 'PDF',
      category: 'PDFs',
      pageCount: 1,
      content: {
        title: 'Imported Document',
        subtitle: 'Q2 Growth Strategy',
        sections: [{ id: 'sec-1', heading: 'Overview', paragraphs: [''] }],
        goalBars: [30, 60, 90, 70, 50],
      },
    });
    openEditor(doc.id);
  }, [createDocument, openEditor]);

  const applyTemplate = useCallback(
    (template: Template) => {
      const doc = createFromTemplate(template);
      openEditor(doc.id);
    },
    [createFromTemplate, openEditor],
  );

  const viewAll = useCallback(() => {
    navigation.navigate('Documents');
  }, [navigation]);

  const confirmImport = useCallback(() => {
    Alert.alert(
      'Import PDF',
      'Select a file to import (simulated). This document will be added to your documents.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import sample', style: 'default', onPress: importPdf },
      ],
    );
  }, [importPdf]);

  return {
    createNew,
    importPdf,
    applyTemplate,
    viewAll,
    openEditor,
    confirmImport,
  };
}
