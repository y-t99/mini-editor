import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";

export default function App() {
  return (
    <div className="p-[10px]">
      <div className="bg-zinc-100 h-[100px] p-[5px] rounded-lg">
        <div className="px-[5px] overflow-y-auto">
          <LexicalComposer initialConfig={{ namespace: 'mini-editor', editable: true, onError: () => { console.log('init editor error') } }}>
            <PlainTextPlugin
                contentEditable={<ContentEditable className="focus:outline-none focus:ring-0 focus:border-none p-[2px]"/>}
                ErrorBoundary={LexicalErrorBoundary}
              />
          </LexicalComposer>
        </div>
      </div>
    </div>
  );
}
