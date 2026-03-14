import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "next-i18next";
import toast from "react-hot-toast";

type Props = {
  linkId: number;
  className?: string;
  readOnly?: boolean;
};

export default function NotesEditor({ linkId, className, readOnly }: Props) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!linkId) return;

    setLoading(true);
    fetch(`/api/v1/links/${linkId}/notes`)
      .then((res) => res.json())
      .then((data) => {
        if (data.response?.notes !== undefined) {
          setNotes(data.response.notes);
          setLastSaved(data.response.notes);
        }
      })
      .catch(() => toast.error("Failed to load notes."))
      .finally(() => setLoading(false));
  }, [linkId]);

  const saveNotes = useCallback(
    async (value: string) => {
      if (value === lastSaved) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/v1/links/${linkId}/notes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: value }),
        });
        const data = await res.json();
        if (res.ok) {
          setLastSaved(value);
        } else {
          toast.error(data.response || "Failed to save notes.");
        }
      } catch {
        toast.error("Failed to save notes.");
      } finally {
        setSaving(false);
      }
    },
    [linkId, lastSaved]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveNotes(value), 1200);
  };

  const handleBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    saveNotes(notes);
  };

  if (loading) {
    return (
      <div className={className}>
        <p className="text-sm mb-2 text-neutral">Notes</p>
        <div className="rounded-md p-4 bg-base-200 text-center text-neutral text-sm animate-pulse">
          Loading notes...
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-neutral">Notes</p>
        {saving && (
          <span className="text-xs text-neutral italic">Saving...</span>
        )}
        {!saving && notes !== lastSaved && (
          <span className="text-xs text-warning italic">Unsaved</span>
        )}
      </div>

      {readOnly ? (
        <div className="rounded-md p-2 bg-base-200 hyphens-auto whitespace-pre-wrap min-h-[5rem]">
          {notes ? (
            <p>{notes}</p>
          ) : (
            <p className="text-neutral">No notes yet.</p>
          )}
        </div>
      ) : (
        <textarea
          value={notes}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Add personal notes about this bookmark..."
          className="resize-none w-full rounded-md p-2 h-40 border-neutral-content bg-base-200 focus:border-primary border-solid border outline-none duration-100"
          maxLength={10000}
        />
      )}
    </div>
  );
}
