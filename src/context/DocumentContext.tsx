import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Document, Template, DocType, DocumentContent } from './types';

const STORAGE_KEY = '@doccanvas:documents';

const TEMPLATES: Template[] = [
  { id: 't-1', name: 'Modern Resume', category: 'Resumes' },
  { id: 't-2', name: 'Minimal Resume', category: 'Resumes' },
  { id: 't-3', name: 'Creative Resume', category: 'Resumes' },
  { id: 't-4', name: 'Professional Cover Letter', category: 'Cover letters' },
  { id: 't-5', name: 'Simple Invoice', category: 'Invoices' },
  { id: 't-6', name: 'Project Proposal', category: 'Business' },
  { id: 't-7', name: 'Meeting Notes', category: 'Notes' },
  { id: 't-8', name: 'Study Planner', category: 'Education' },
  { id: 't-9', name: 'Business Letter', category: 'Business' },
  { id: 't-10', name: 'Blank Page', category: 'Blank' },
];

const now = Date.now();
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

const SEED_DOCS: Document[] = [
  {
    id: 'doc-1',
    title: 'Marketing Plan',
    fileName: 'Marketing Plan.pdf',
    type: 'pdf',
    extension: 'PDF',
    category: 'PDFs',
    pageCount: 8,
    lastEdited: now - 12 * MINUTE,
    content: {
      title: 'Marketing Plan',
      subtitle: 'Q2 Growth Strategy',
      sections: [
        {
          id: 's-1',
          heading: 'Overview',
          paragraphs: [
            'This document outlines the marketing strategy for the second quarter, focusing on customer acquisition and retention through a multi-channel approach.',
            'The plan leverages digital campaigns, partnerships, and content marketing to drive measurable growth across all segments.',
            'Key metrics will be tracked weekly with adjustments made to optimise spend and engagement.',
          ],
        },
        {
          id: 's-2',
          heading: 'Audience',
          paragraphs: [
            'Our primary audience consists of mid-market businesses aged 30-55 seeking cost-effective growth solutions.',
            'Secondary segments include startups and enterprise accounts evaluating platform migration.',
          ],
        },
      ],
      goalBars: [40, 70, 100, 80, 60],
    },
  },
  {
    id: 'doc-2',
    title: 'Alex Morgan Resume',
    fileName: 'Alex Morgan Resume',
    type: 'doc',
    extension: 'DOC',
    category: 'Resumes',
    pageCount: 1,
    lastEdited: now - DAY,
    content: {
      title: 'Alex Morgan Resume',
      sections: [
        {
          id: 's-1',
          heading: 'Experience',
          paragraphs: [
            'Senior Product Designer at Acme Corp — led a team of 5 designers to deliver the flagship SaaS product.',
          ],
        },
      ],
    },
  },
  {
    id: 'doc-3',
    title: 'Project Notes',
    fileName: 'Project Notes',
    type: 'doc',
    extension: 'DOC',
    category: 'Documents',
    pageCount: 3,
    lastEdited: new Date('2024-03-18T00:00:00Z').getTime(),
    content: {
      title: 'Project Notes',
      sections: [
        {
          id: 's-1',
          heading: 'Sprint 4',
          paragraphs: ['Completed authentication flow and session management.'],
        },
      ],
    },
  },
  {
    id: 'doc-4',
    title: 'Client Invoice Template',
    fileName: 'Client Invoice Template',
    type: 'template',
    extension: 'TPL',
    category: 'Templates',
    pageCount: 1,
    lastEdited: new Date('2024-03-15T00:00:00Z').getTime(),
    content: {
      title: 'Client Invoice',
      sections: [
        {
          id: 's-1',
          heading: 'Invoice Details',
          paragraphs: ['Billing period: March 2024'],
        },
      ],
    },
  },
];

interface DocumentContextValue {
  documents: Document[];
  templates: Template[];
  loading: boolean;
  createDocument: (input: {
    title: string;
    fileName: string;
    type: DocType;
    extension: string;
    category: string;
    pageCount: number;
    content: DocumentContent;
  }) => Document;
  createFromTemplate: (template: Template) => Document;
  getDocument: (id: string) => Document | undefined;
  updateDocument: (doc: Document) => void;
  deleteDocument: (id: string) => void;
  updateDocumentContent: (id: string, content: DocumentContent) => void;
  getRecentDocuments: (count: number) => Document[];
  clearAllDocuments: () => Promise<void>;
}

const DocumentContext = createContext<DocumentContextValue | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(async (docs: Document[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    } catch (e) {
      console.warn('Failed to persist documents', e);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Document[];
        setDocuments(parsed.length ? parsed : SEED_DOCS);
      } else {
        setDocuments(SEED_DOCS);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DOCS));
      }
    } catch {
      setDocuments(SEED_DOCS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createDocument = useCallback(
    (input: {
      title: string;
      fileName: string;
      type: DocType;
      extension: string;
      category: string;
      pageCount: number;
      content: DocumentContent;
    }) => {
      const doc: Document = {
        ...input,
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        lastEdited: Date.now(),
      };
      setDocuments((prev) => [doc, ...prev]);
      return doc;
    },
    [],
  );

  const createFromTemplate = useCallback(
    (template: Template) => {
      const title = template.name;
      const extension =
        template.category === 'Invoices'
          ? 'TPL'
          : template.category === 'Resumes'
          ? 'DOC'
          : 'DOC';
      const type: DocType =
        template.category === 'Invoices' || template.category === 'Cover letters'
          ? 'template'
          : 'doc';
      const content: DocumentContent = {
        title,
        sections: [
          {
            id: 'sec-1',
            heading: template.name,
            paragraphs: ['Start building your document from this template.'],
          },
        ],
      };
      const doc = createDocument({
        title,
        fileName: `${title}.docx`,
        type,
        extension,
        category: template.category === 'Invoices' ? 'Templates' : template.category,
        pageCount: 1,
        content,
      });
      return doc;
    },
    [createDocument],
  );

  const getDocument = useCallback(
    (id: string) => documents.find((d) => d.id === id),
    [documents],
  );

  const updateDocument = useCallback((doc: Document) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...doc, lastEdited: Date.now() } : d)),
    );
  }, []);

  const updateDocumentContent = useCallback((id: string, content: DocumentContent) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, content, lastEdited: Date.now() } : d,
      ),
    );
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const getRecentDocuments = useCallback(
    (count: number) =>
      [...documents]
        .sort((a, b) => b.lastEdited - a.lastEdited)
        .slice(0, count),
    [documents],
  );

  const clearAllDocuments = useCallback(async () => {
    setDocuments([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (!loading) {
      persist(documents);
    }
  }, [documents, loading, persist]);

  return (
    <DocumentContext.Provider
      value={{
        documents,
        templates: TEMPLATES,
        loading,
        createDocument,
        createFromTemplate,
        getDocument,
        updateDocument,
        deleteDocument,
        updateDocumentContent,
        getRecentDocuments,
        clearAllDocuments,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = (): DocumentContextValue => {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return ctx;
};
