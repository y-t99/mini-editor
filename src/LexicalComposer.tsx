import { useLayoutEffect, useMemo } from "react";
import { $createParagraphNode, $getRoot, $getSelection, createEditor, CreateEditorArgs, EditorState, LexicalEditor } from 'lexical';
import { CAN_USE_DOM } from "./shared/canUseDOM";
import { createLexicalComposerContext, LexicalComposerContext, LexicalComposerContextType } from "./LexicalComposerContext";

const HISTORY_MERGE_OPTIONS = {tag: 'history-merge'};

export type InitialEditorStateType =
  | null
  | string
  | EditorState
  | ((editor: LexicalEditor) => void);
  
export type InitialConfigType = Readonly<
  Pick<
    CreateEditorArgs, 
    'namespace' | 
    'nodes' | 
    'editable' |
    'theme' |
    'html'
  > & {
    onError: (error: Error, editor: LexicalEditor) => void;
    editorState?: InitialEditorStateType;
  }
>

type Props = React.PropsWithChildren<{
  initialConfig: InitialConfigType;
}>;

export function LexicalComposer(
  {
    initialConfig,
    children,
  }: 
  Props
) {
  const composerContext: [LexicalEditor, LexicalComposerContextType] = useMemo(
    () => {
      const { 
        theme,
        namespace,
        nodes,
        onError,
        editable,
        editorState: initialEditorState,
        html,
      } = initialConfig;

      const context: LexicalComposerContextType = createLexicalComposerContext(
        null,
        theme,
      );
      
      const editor = createEditor({
        editable,
        html,
        namespace,
        nodes,
        onError: (error) => onError(error, editor),
        theme,
      });

      initializeEditor(editor, initialEditorState);

      return [editor, context];
    }, 
    // We only do this for init
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // no execute on server
  useLayoutEffect(() => {
    const isEditable = initialConfig.editable;
    const [editor] = composerContext;
    editor.setEditable(isEditable !== undefined ? isEditable : true);

    // We only do this for init
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <LexicalComposerContext.Provider value={composerContext}>
      {children}
    </LexicalComposerContext.Provider>
  );
}

function initializeEditor(
  editor: LexicalEditor,
  initialEditorState?: InitialEditorStateType,
): void {
  if (initialEditorState === null) {
    return;
  } else if (initialEditorState === undefined) {
    editor.update(() => {
      const root = $getRoot();
      if (root.isEmpty()) {
        const paragraph = $createParagraphNode();
        root.append(paragraph);
        const activeElement = CAN_USE_DOM ? document.activeElement : null;
        if (
          $getSelection() !== null ||
          (activeElement !== null && activeElement === editor.getRootElement())
        ) {
          paragraph.select();
        }
      }
    }, HISTORY_MERGE_OPTIONS);
  } else if (initialEditorState !== null) {
    switch (typeof initialEditorState) {
      case 'string': {
        const parsedEditorState = editor.parseEditorState(initialEditorState);
        editor.setEditorState(parsedEditorState, HISTORY_MERGE_OPTIONS);
        break;
      }
      case 'object': {
        editor.setEditorState(initialEditorState, HISTORY_MERGE_OPTIONS);
        break;
      }
      case 'function': {
        editor.update(() => {
          const root = $getRoot();
          if (root.isEmpty()) {
            initialEditorState(editor);
          }
        }, HISTORY_MERGE_OPTIONS);
        break;
      }
    }
  }
}

export default LexicalComposer;
