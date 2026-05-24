"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AuthButton } from "@/components/auth/AuthButton";
import {
  AVATAR_FILES,
  getAvatarImageUrl,
  type AvatarFile,
} from "@/lib/avatar-catalog";

type AvatarPickerModalProps = {
  open: boolean;
  selectedFile: AvatarFile;
  onClose: () => void;
  onSave: (file: AvatarFile) => void;
};

function CheckIcon() {
  return (
    <svg
      className="h-8 w-8 text-white drop-shadow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AvatarPickerModal({
  open,
  selectedFile,
  onClose,
  onSave,
}: AvatarPickerModalProps) {
  const [pending, setPending] = useState<AvatarFile>(selectedFile);

  useEffect(() => {
    if (open) setPending(selectedFile);
  }, [open, selectedFile]);

  if (!open) return null;

  const handleSave = () => {
    onSave(pending);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-picker-title"
    >
      <div className="flex max-h-[min(90vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--auth-border)] bg-white shadow-xl">
        <div className="border-b border-[var(--auth-border)] px-6 py-5">
          <h2
            id="avatar-picker-title"
            className="text-lg font-bold text-[var(--foreground)]"
          >
            이미지 선택
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ul className="grid grid-cols-3 gap-4">
            {AVATAR_FILES.map((file) => {
              const isSelected = pending === file;
              return (
                <li key={file}>
                  <button
                    type="button"
                    onClick={() => setPending(file)}
                    className={`relative mx-auto block h-[88px] w-[88px] overflow-hidden rounded-full transition ring-2 ring-offset-2 ring-offset-white ${
                      isSelected
                        ? "ring-[var(--auth-primary)]"
                        : "ring-transparent hover:ring-[var(--auth-border-strong)]"
                    }`}
                    aria-label="프로필 이미지 선택"
                    aria-pressed={isSelected}
                  >
                    <Image
                      src={getAvatarImageUrl(file)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="88px"
                    />
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--auth-border)] px-6 py-4">
          <AuthButton
            type="button"
            variant="secondary"
            className="!w-auto min-w-[88px] px-6"
            onClick={onClose}
          >
            취소
          </AuthButton>
          <AuthButton
            type="button"
            className="!w-auto min-w-[88px] px-6"
            onClick={handleSave}
          >
            저장
          </AuthButton>
        </div>
      </div>
    </div>
  );
}
