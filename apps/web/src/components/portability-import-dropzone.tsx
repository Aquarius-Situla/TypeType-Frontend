import { FileUp } from "lucide-react";
import { type DragEvent, useRef, useState } from "react";

type Props = {
  busy: boolean;
  extension?: string;
  label: string;
  hint: string;
  onFile: (file: File | undefined) => void;
};

const ARCHIVE_ACCEPT =
  ".zip,.json,.xml,.opml,.db,.sqlite,application/zip,application/json,application/xml,text/xml,application/x-sqlite3";

export function PortabilityImportDropzone({ busy, extension, label, hint, onFile }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function drop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    onFile(event.dataTransfer.files[0]);
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={() => input.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={
          "flex min-h-44 w-full flex-col items-center justify-center border border-dashed px-5 text-center transition-colors " +
          (dragging
            ? "border-fg bg-surface-strong"
            : "border-border-strong bg-surface hover:border-fg-soft")
        }
      >
        <FileUp size={24} className="text-fg" aria-hidden="true" />
        <span className="mt-3 text-sm font-medium text-fg">{label}</span>
        <span className="mt-1 max-w-md text-xs text-fg-soft">{hint}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept={extension ? `.${extension},${ARCHIVE_ACCEPT}` : ARCHIVE_ACCEPT}
        disabled={busy}
        className="hidden"
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </>
  );
}
