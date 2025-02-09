import { useCallback, useEffect, useRef, useState } from "react";
import { FloatingMenu, FloatingMenuCoords } from "./FloatingMenu";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { usePointerInteractions } from "./usePointerInteractions";
import { computePosition } from "@floating-ui/dom";
import { $getSelection, $isRangeSelection } from "lexical";
import { createPortal } from "react-dom";

const DOM_ELEMENT = document.body;

export function FloatingMenuPlugin() {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<FloatingMenuCoords>(undefined);
  const [editor] = useLexicalComposerContext();
  
  const { isPointerDown, isPointerReleased } = usePointerInteractions();

  const calculatePosition = useCallback(() => {
    const domSelection = getSelection();
    const domRange =
      domSelection?.rangeCount !== 0 && domSelection?.getRangeAt(0);

    if (!domRange || !ref.current || isPointerDown) return setCoords(undefined);

    computePosition(domRange, ref.current, { placement: "top" })
      .then((pos) => {
        setCoords({ x: pos.x, y: pos.y - 10 });
      })
      .catch(() => {
        setCoords(undefined);
      });
  }, [isPointerDown]);

  const $handleSelectionChange = useCallback(() => {
    if (
      editor.isComposing() ||
      editor.getRootElement() !== document.activeElement
    ) {
      setCoords(undefined);
      return;
    }

    const selection = $getSelection();

    if ($isRangeSelection(selection) && !selection.anchor.is(selection.focus)) {
      calculatePosition();
    } else {
      setCoords(undefined);
    }
  }, [editor, calculatePosition]);
  
  useEffect(() => {
    const unregisterListener = editor.registerUpdateListener(
      ({ editorState }) => {
        editorState.read(() => $handleSelectionChange());
      }
    );
    return unregisterListener;
  }, [editor, $handleSelectionChange]);
  
  const show = coords !== undefined;

  useEffect(() => {
    if (!show && isPointerReleased) {
      editor.getEditorState().read(() => $handleSelectionChange());
    }
    // Adding show to the dependency array causes an issue if
    // a range selection is dismissed by navigating via arrow keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPointerReleased, $handleSelectionChange, editor]);
  
  return createPortal(
    <FloatingMenu ref={ref} editor={editor} coords={coords} />,
    DOM_ELEMENT
  );
}

export default FloatingMenuPlugin