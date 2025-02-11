import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import FloatingMenuPlugin from "./FloatingMenuPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import DraggableBlockPlugin from "./DraggableBlockPlugin";
import { useEffect, useRef, useState } from "react";
import AutocompletePlugin from "./AutocompletePlugin";
import { AutocompleteNode } from "./AutocompleteNode";

export default function App() {
  const floatingAnchorElem = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (floatingAnchorElem.current) {
      setAnchor(floatingAnchorElem.current);
    }
  }, []);
  
  return (
    <div className="bg-zinc-100 p-[100px] h-screen">
      <div className="border-2 border-zinc-950 bg-white min-h-[300px] p-[10px] rounded-lg">
        <div className="py-[5px] overflow-y-auto">
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
                    code: "bg-gray-100 dark:bg-gray-800 rounded-md p-2 text-sm",
                  },
                },
                nodes: [AutocompleteNode]
              }
            }
          >
            <RichTextPlugin
                contentEditable={
                  <div>
                    <div className="relative pl-[25px]" ref={floatingAnchorElem}>
                      <ContentEditable className="focus:outline-none focus:ring-0 focus:border-none p-[2px]"/>
                    </div>
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            {anchor && <DraggableBlockPlugin anchorElem={anchor} /> }
            <FloatingMenuPlugin />
            <AutocompletePlugin />
          </LexicalComposer>
        </div>
      </div>
    </div>
  );
}
