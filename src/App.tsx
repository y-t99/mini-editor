import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import FloatingMenuPlugin from "./FloatingMenuPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";

export default function App() {
  return (
    <div className="p-[100px]">
      <div className="bg-zinc-100 h-[100px] p-[5px] rounded-lg">
        <div className="px-[5px] overflow-y-auto">
          <LexicalComposer initialConfig={
              { 
                namespace: 'mini-editor', 
                editable: true, 
                onError: () => { console.log('init editor error') }, 
                theme: {
                  text: {
                    bold: "font-semibold",
                    underline: "underline decoration-wavy",
                    italic: "italic",
                    strikethrough: "line-through",
                    underlineStrikethrough: "underlined-line-through",
                  },
                } 
              }
            }
          >
            <RichTextPlugin
                contentEditable={<ContentEditable className="focus:outline-none focus:ring-0 focus:border-none p-[2px]"/>}
                ErrorBoundary={LexicalErrorBoundary}
              />
            <FloatingMenuPlugin />
          </LexicalComposer>
        </div>
      </div>
    </div>
  );
}
