import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface CodeDiffViewerProps {
  oldCode: string;
  newCode: string;
}

export function CodeDiffViewer({ oldCode, newCode }: CodeDiffViewerProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  const darkStyles = {
    variables: {
      dark: {
        diffViewerBackground: "hsl(215 28% 9%)",
        diffViewerColor: "hsl(210 40% 96%)",
        addedBackground: "hsl(142 60% 15%)",
        addedColor: "hsl(142 70% 80%)",
        removedBackground: "hsl(0 55% 15%)",
        removedColor: "hsl(0 70% 80%)",
        wordAddedBackground: "hsl(142 60% 22%)",
        wordRemovedBackground: "hsl(0 55% 22%)",
        addedGutterBackground: "hsl(142 50% 12%)",
        removedGutterBackground: "hsl(0 45% 12%)",
        gutterBackground: "hsl(215 28% 12%)",
        gutterBackgroundDark: "hsl(215 28% 10%)",
        highlightBackground: "hsl(220 60% 20%)",
        highlightGutterBackground: "hsl(220 60% 17%)",
        codeFoldBackground: "hsl(215 28% 14%)",
        emptyLineBackground: "hsl(215 28% 10%)",
        gutterColor: "hsl(215 16% 50%)",
        addedGutterColor: "hsl(142 60% 60%)",
        removedGutterColor: "hsl(0 60% 60%)",
        codeFoldContentColor: "hsl(215 16% 55%)",
        diffViewerTitleBackground: "hsl(215 28% 13%)",
        diffViewerTitleColor: "hsl(210 40% 85%)",
        diffViewerTitleBorderColor: "hsl(215 28% 20%)",
      },
    },
  };

  const lightStyles = {
    variables: {
      light: {
        diffViewerBackground: "#ffffff",
        diffViewerColor: "hsl(215 28% 17%)",
        addedBackground: "hsl(142 60% 94%)",
        addedColor: "hsl(142 70% 20%)",
        removedBackground: "hsl(0 55% 95%)",
        removedColor: "hsl(0 70% 25%)",
        wordAddedBackground: "hsl(142 60% 85%)",
        wordRemovedBackground: "hsl(0 55% 87%)",
        addedGutterBackground: "hsl(142 50% 90%)",
        removedGutterBackground: "hsl(0 45% 91%)",
        gutterBackground: "hsl(215 20% 97%)",
        gutterBackgroundDark: "hsl(215 20% 94%)",
        gutterColor: "hsl(215 16% 55%)",
        addedGutterColor: "hsl(142 60% 30%)",
        removedGutterColor: "hsl(0 60% 35%)",
        codeFoldContentColor: "hsl(215 16% 50%)",
        diffViewerTitleBackground: "hsl(215 20% 97%)",
        diffViewerTitleColor: "hsl(215 28% 17%)",
        diffViewerTitleBorderColor: "hsl(215 20% 90%)",
      },
    },
  };

  return (
    <div
      className="overflow-auto rounded-lg border border-border text-xs"
      style={{ fontFamily: "var(--font-mono)", maxHeight: "400px" }}
    >
      <ReactDiffViewer
        oldValue={oldCode}
        newValue={newCode}
        splitView={false}
        compareMethod={DiffMethod.WORDS}
        useDarkTheme={isDark}
        styles={isDark ? darkStyles : lightStyles}
        leftTitle="Original"
        rightTitle="Fixed"
        hideLineNumbers={false}
      />
    </div>
  );
}
