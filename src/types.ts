import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Documents: undefined;
  Templates: undefined;
  Editor: { documentId: string };
  Settings: undefined;
};

export type RootStackNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export type DocType = 'pdf' | 'doc' | 'template';

export interface DocSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

export interface DocumentContent {
  title: string;
  subtitle?: string;
  sections: DocSection[];
  goalBars?: number[];
}

export interface Document {
  id: string;
  title: string;
  fileName: string;
  type: DocType;
  extension: string;
  category: string;
  pageCount: number;
  lastEdited: number;
  content: DocumentContent;
}

export interface Template {
  id: string;
  name: string;
  category: string;
}

export interface DocumentPage {
  id: string;
  content: DocumentContent;
  rotation?: number;
}

export interface EditorRouteParams {
  documentId: string;
}
