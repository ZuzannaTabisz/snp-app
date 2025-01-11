"use client";

import { useEffect } from "react";

export default function ScrollUp() {
  useEffect(() => window.document.scrollingElement?.scrollTo(0, 0), []);

  return (
    <button data-testid="scroll-up">Scroll Up</button>
  );
}
