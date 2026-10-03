import { useState } from "react";
import { portabilityArchiveIssue } from "../lib/portability-archive";
import { m } from "../paraglide/messages.js";
import { PortabilityImportDropzone } from "./portability-import-dropzone";

type Props = {
  busy: boolean;
  extension?: string;
  label: string;
  hint: string;
  onFile: (file: File | undefined) => void;
};

export function PortabilityImportSourcePicker({ busy, extension, label, hint, onFile }: Props) {
  const [sourceError, setSourceError] = useState<string | null>(null);

  async function choose(file: File | undefined) {
    if (!file || busy) return;
    const issue = await portabilityArchiveIssue(file, extension);
    setSourceError(
      issue === "invalid-zip"
        ? m.portability_invalid_zip()
        : issue === "wrong-format"
          ? m.portability_zip_choose_source()
          : null,
    );
    if (!issue) onFile(file);
  }

  return (
    <>
      <PortabilityImportDropzone
        busy={busy}
        extension={extension}
        label={label}
        hint={hint}
        onFile={choose}
      />
      {sourceError && (
        <p role="alert" className="text-sm text-danger">
          {sourceError}
        </p>
      )}
    </>
  );
}
