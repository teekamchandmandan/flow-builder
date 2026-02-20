declare module 'react-syntax-highlighter/dist/esm/light' {
  import type { ComponentType } from 'react';
  interface SyntaxHighlighterProps {
    language?: string;
    style?: Record<string, React.CSSProperties>;
    customStyle?: React.CSSProperties;
    children?: string;
    [key: string]: unknown;
  }
  const Light: ComponentType<SyntaxHighlighterProps> & {
    registerLanguage: (name: string, lang: unknown) => void;
  };
  export default Light;
}

declare module 'react-syntax-highlighter/dist/esm/languages/hljs/json' {
  const language: unknown;
  export default language;
}

declare module 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark' {
  const style: Record<string, React.CSSProperties>;
  export default style;
}

declare module 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-light' {
  const style: Record<string, React.CSSProperties>;
  export default style;
}
