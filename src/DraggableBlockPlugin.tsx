import { DraggableBlockPlugin_EXPERIMENTAL as DraggableBlockPluginExperimental } from "@lexical/react/LexicalDraggableBlockPlugin";
import { GripVertical } from "lucide-react";
import { JSX, useRef } from "react";

const DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

export default function DraggableBlockPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  return (
    <DraggableBlockPluginExperimental
      anchorElem={anchorElem}
      menuRef={menuRef as React.RefObject<HTMLElement>}
      targetLineRef={targetLineRef as React.RefObject<HTMLElement>}
      menuComponent={
        <div
          ref={menuRef}
          className="rounded-sm px-[2px] py-[4px] cursor-grab opacity-0 absolute left-0 top-0 will-change-transform"
        >
          <GripVertical className="w-[16px] h-[16px] opacity-30" />
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className="pointer-events-none bg-zinc-950 h-[4px] absolute -left-20 top-0 opacity-0 will-change-transform"/>
      }
      isOnMenu={isOnMenu}
    />
  );
}
