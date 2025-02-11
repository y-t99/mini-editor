import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $addUpdateTag, $createTextNode, $setSelection, KEY_TAB_COMMAND, COMMAND_PRIORITY_LOW, KEY_ARROW_RIGHT_COMMAND, TextNode } from "lexical";
import { $isAtNodeEnd } from "@lexical/selection";
import { $getNodeByKey, $getSelection, $isRangeSelection, $isTextNode, BaseSelection, NodeKey } from "lexical";
import { useEffect } from "react";
import { useCallback } from "react";
import { $createAutocompleteNode, AutocompleteNode } from "./AutocompleteNode";

const HISTORY_MERGE = {tag: 'history-merge'};

type SearchPromise = {
  dismiss: () => void;
  promise: Promise<null | string>;
};

export const uuid = Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, '')
  .substring(0, 5);

function $search(selection: null | BaseSelection): [boolean, string] {
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return [false, ''];
  }
  const node = selection.getNodes()[0];
  const anchor = selection.anchor;
  // Check siblings?
  if (!$isTextNode(node) || !node.isSimpleText() || !$isAtNodeEnd(anchor as any)) {
    return [false, ''];
  }
  const word = [];
  const text = node.getTextContent();
  let i = node.getTextContentSize();
  let c;
  while (i-- && i >= 0 && (c = text[i]) !== ' ') {
    word.push(c);
  }
  if (word.length === 0) {
    return [false, ''];
  }
  return [true, word.reverse().join('')];
}

function formatSuggestionText(suggestion: string): string {
  return `${suggestion} (TAB)`;
}

type Force = [number, number];
type Listener = (force: Force, e: TouchEvent) => void;
type ElementValues = {
  start: null | Force;
  listeners: Set<Listener>;
  handleTouchstart: (e: TouchEvent) => void;
  handleTouchend: (e: TouchEvent) => void;
};

const elements = new WeakMap<HTMLElement, ElementValues>();

function readTouch(e: TouchEvent): [number, number] | null {
  const touch = e.changedTouches[0];
  if (touch === undefined) {
    return null;
  }
  return [touch.clientX, touch.clientY];
}

function addListener(element: HTMLElement, cb: Listener): () => void {
  let elementValues = elements.get(element);
  if (elementValues === undefined) {
    const listeners = new Set<Listener>();
    const handleTouchstart = (e: TouchEvent) => {
      if (elementValues !== undefined) {
        elementValues.start = readTouch(e);
      }
    };
    const handleTouchend = (e: TouchEvent) => {
      if (elementValues === undefined) {
        return;
      }
      const start = elementValues.start;
      if (start === null) {
        return;
      }
      const end = readTouch(e);
      for (const listener of listeners) {
        if (end !== null) {
          listener([end[0] - start[0], end[1] - start[1]], e);
        }
      }
    };
    element.addEventListener('touchstart', handleTouchstart);
    element.addEventListener('touchend', handleTouchend);

    elementValues = {
      handleTouchend,
      handleTouchstart,
      listeners,
      start: null,
    };
    elements.set(element, elementValues);
  }
  elementValues.listeners.add(cb);
  return () => deleteListener(element, cb);
}

function deleteListener(element: HTMLElement, cb: Listener): void {
  const elementValues = elements.get(element);
  if (elementValues === undefined) {
    return;
  }
  const listeners = elementValues.listeners;
  listeners.delete(cb);
  if (listeners.size === 0) {
    elements.delete(element);
    element.removeEventListener('touchstart', elementValues.handleTouchstart);
    element.removeEventListener('touchend', elementValues.handleTouchend);
  }
}

export function AutocompletePlugin() {
  const [editor] = useLexicalComposerContext();

  const textAutocompleteFn = useCallback((text: string): SearchPromise => {
    return {
      dismiss: () => {},
      promise: Promise.resolve('suggestion'),
    };
  }, []);

  useEffect(() => {
    let autocompleteNodeKey: null | NodeKey = null;
    let lastMatch: null | string = null;
    let lastSuggestion: null | string = null;
    let searchPromise: null | SearchPromise = null;
    let prevNodeFormat: number = 0;

    function $clearSuggestion() {
      const autocompleteNode =
      autocompleteNodeKey !== null
        ? $getNodeByKey(autocompleteNodeKey)
        : null;

      if (autocompleteNode !== null && autocompleteNode.isAttached()) {
        autocompleteNode.remove();
        autocompleteNodeKey = null;
      }
      if (searchPromise !== null) {
        searchPromise.dismiss();
        searchPromise = null;
      }
      lastMatch = null;
      lastSuggestion = null;
      prevNodeFormat = 0;
    }

    function updateAsyncSuggestion(
      refSearchPromise: SearchPromise,
      newSuggestion: null | string,
    ) {
      if (searchPromise !== refSearchPromise || newSuggestion === null) {
        // Outdated or no suggestion
        return;
      }
      editor.update(() => {
        const selection = $getSelection();
        const [hasMatch, match] = $search(selection);
        if (!hasMatch || match !== lastMatch || !$isRangeSelection(selection)) {
          // Outdated
          return;
        }
        const selectionCopy = selection.clone();
        const prevNode = selection.getNodes()[0] as TextNode;
        prevNodeFormat = prevNode.getFormat();
        const node = $createAutocompleteNode(
          formatSuggestionText(newSuggestion),
          uuid,
        )
          .setFormat(prevNodeFormat)
          // .setStyle(`font-size: ${theme.fontSize}`);
        autocompleteNodeKey = node.getKey();
        selection.insertNodes([node]);
        $setSelection(selectionCopy);
        lastSuggestion = newSuggestion;
      }, HISTORY_MERGE);
    }
    
    function $handleAutocompleteNodeTransform(node: AutocompleteNode) {
      const key = node.getKey();
      if (node.__uuid === uuid && key !== autocompleteNodeKey) {
        // Max one Autocomplete node per session
        $clearSuggestion();
      }
    }

    function handleUpdate() {
      editor.update(() => {
        const selection = $getSelection();
        const [hasMatch, match] = $search(selection);
        if (!hasMatch) {
          $clearSuggestion();
          return;
        }
        if (match === lastMatch) {
          return;
        }
        $clearSuggestion();
        searchPromise = textAutocompleteFn(match);
        searchPromise.promise
          .then((newSuggestion) => {
            if (searchPromise !== null) {
              updateAsyncSuggestion(searchPromise, newSuggestion);
            }
          })
          .catch((e) => {
            if (e !== 'Dismissed') {
              console.error(e);
            }
          });
        lastMatch = match;
      }, HISTORY_MERGE);
    }
    
    function $handleAutocompleteIntent(): boolean {
      if (lastSuggestion === null || autocompleteNodeKey === null) {
        return false;
      }
      const autocompleteNode = $getNodeByKey(autocompleteNodeKey);
      if (autocompleteNode === null) {
        return false;
      }
      const textNode = $createTextNode(lastSuggestion)
        .setFormat(prevNodeFormat)
        // .setStyle(`font-size: ${theme.fontSize}`);
      autocompleteNode.replace(textNode);
      textNode.selectNext();
      $clearSuggestion();
      return true;
    }
    
    function $handleKeypressCommand(e: Event) {
      if ($handleAutocompleteIntent()) {
        e.preventDefault();
        return true;
      }
      return false;
    }
    function handleSwipeRight(_force: number, e: TouchEvent) {
      editor.update(() => {
        if ($handleAutocompleteIntent()) {
          e.preventDefault();
        } else {
          $addUpdateTag(HISTORY_MERGE.tag);
        }
      });
    }
    function unmountSuggestion() {
      editor.update(() => {
        $clearSuggestion();
      }, HISTORY_MERGE);
    }
    function addSwipeRightListener(
      element: HTMLElement,
      cb: (_force: number, e: TouchEvent) => void,
    ) {
      return addListener(element, (force, e) => {
        const [x, y] = force;
        if (x > 0 && x > Math.abs(y)) {
          cb(x, e);
        }
      });
    }

    const rootElem = editor.getRootElement();

    editor.registerNodeTransform(
      AutocompleteNode,
      $handleAutocompleteNodeTransform,
    );
    editor.registerUpdateListener(handleUpdate);
    editor.registerCommand(
      KEY_TAB_COMMAND,
      $handleKeypressCommand,
      COMMAND_PRIORITY_LOW,
    );
    editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      $handleKeypressCommand,
      COMMAND_PRIORITY_LOW,
    );
    if (rootElem !== null) {
      addSwipeRightListener(rootElem, handleSwipeRight);
    }
    unmountSuggestion();
  }, [editor, textAutocompleteFn]);

  return null;
}

export default AutocompletePlugin;
