"use client";

import Image from "next/image";
import {
  getAvatarImageUrl,
  isAvatarFile,
  type AvatarFile,
} from "@/lib/avatar-catalog";
import { getAvatarColor, getAvatarInitial } from "@/lib/profile-avatar";

type ProfileAvatarProps = {
  nickname: string;
  avatar_file?: string | null;
  size: "sm" | "menu" | "md" | "lg";
  className?: string;
};

const SIZE_CLASS = {
  sm: "h-9 w-9 text-sm",
  menu: "h-12 w-12 text-lg",
  md: "h-24 w-24 text-3xl",
  lg: "h-40 w-40 text-5xl",
} as const;

const IMAGE_SIZES: Record<ProfileAvatarProps["size"], string> = {
  sm: "36px",
  menu: "48px",
  md: "96px",
  lg: "160px",
};

export function ProfileAvatar({
  nickname,
  avatar_file,
  size,
  className = "",
}: ProfileAvatarProps) {
  const sizeClass = SIZE_CLASS[size];
  const file =
    avatar_file && isAvatarFile(avatar_file) ? avatar_file : null;

  if (file) {
    return (
      <span
        className={`relative block shrink-0 overflow-hidden rounded-full ${sizeClass} ${className}`}
      >
        <Image
          src={getAvatarImageUrl(file)}
          alt={`${nickname} 프로필`}
          fill
          className="object-cover"
          sizes={IMAGE_SIZES[size]}
        />
      </span>
    );
  }

  const bg = getAvatarColor(nickname);
  const initial = getAvatarInitial(nickname);

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${sizeClass} ${className}`}
      style={{ backgroundColor: bg }}
    >
      {initial}
    </span>
  );
}

export function resolveAvatarFile(
  file: string | undefined | null,
): AvatarFile | undefined {
  if (file && isAvatarFile(file)) return file;
  return undefined;
}
