import LexicalComposer from "./LexicalComposer";

export default function App() {
  return (
    <LexicalComposer initialConfig={{ namespace: 'mini-editor', editable: true, onError: () => { console.log('init editor error') } }}>

    </LexicalComposer>
  );
}
