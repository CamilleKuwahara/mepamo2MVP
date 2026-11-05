"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  id: string;
  anchor: HTMLElement;
  title: string;
  lessonNumber: number;
  lessonCount: number;
  completedActivities: number;
  activityCount: number;
  onStart: () => void;
  onClose: () => void;
};

/** Available/unstarted or in-progress lessons only. Import feedback.css. */
export function LessonPopover({
  id, anchor, title, lessonNumber, lessonCount,
  completedActivities, activityCount, onStart, onClose,
}: Props) {
  const card = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const [position, setPosition] = useState<{
    left: number; top: number; arrow: number; side: "above" | "below";
  } | null>(null);

  useLayoutEffect(() => {
    function place() {
      if (!card.current || !anchor.isConnected) return;
      const node = anchor.getBoundingClientRect();
      const popup = card.current.getBoundingClientRect();
      const gutter = 12;
      const gap = 14;
      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      const left = Math.max(gutter, Math.min(node.left + node.width / 2 - popup.width / 2, width - popup.width - gutter));
      const below = node.bottom + gap;
      const side = below + popup.height <= height - gutter ? "below" : "above";
      const desiredTop = side === "below" ? below : node.top - gap - popup.height;
      const top = Math.max(gutter, Math.min(desiredTop, height - popup.height - gutter));
      const arrow = Math.max(20, Math.min(node.left + node.width / 2 - left, popup.width - 20));
      setPosition(previous => previous && previous.left === left && previous.top === top && previous.arrow === arrow && previous.side === side ? previous : { left, top, arrow, side });
    }
    place();
    const observer = new ResizeObserver(place);
    if (card.current) observer.observe(card.current);
    observer.observe(anchor);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
    };
  }, [anchor]);

  useEffect(() => {
    cta.current?.focus({ preventScroll: true });
    function pointer(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !card.current?.contains(target) && !anchor.contains(target)) close.current();
    }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
        anchor.focus({ preventScroll: true });
      }
    }
    function focus(event: FocusEvent) {
      const target = event.target;
      if (target instanceof Node && !card.current?.contains(target) && !anchor.contains(target)) close.current();
    }
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard);
    document.addEventListener("focusin", focus);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("focusin", focus);
    };
  }, [anchor]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div ref={card} id={id} role="dialog" aria-modal={false}
      aria-labelledby={`${id}-title`} aria-describedby={`${id}-progress`}
      className="mepamo-popover" data-side={position?.side ?? "below"}
      style={{ left: position?.left ?? 0, top: position?.top ?? 0,
        visibility: position ? "visible" : "hidden",
        maxHeight: "calc(100dvh - 24px)" }}>
      <span aria-hidden="true" className="mepamo-popover__arrow" style={{ left: position?.arrow ?? 155 }} />
      <div style={{ maxHeight: "calc(100dvh - 64px)", overflowY: "auto" }}>
      <h3 id={`${id}-title`}>{title}</h3>
      <p>Lesson {lessonNumber} of {lessonCount}</p>
      <p id={`${id}-progress`}>{completedActivities} of {activityCount} activities completed</p>
      <button ref={cta} type="button" onClick={onStart}>
        {completedActivities > 0 ? "Resume lesson" : "Start lesson"}
        <span aria-hidden="true"> ›</span>
      </button>
      </div>
    </div>, document.body,
  );
}
