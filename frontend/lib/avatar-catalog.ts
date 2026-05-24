/** public/profiles 아래 프리셋 파일명 (slug + 확장자) */
export const AVATAR_FILES = [
  "257801c8-eda4-4401-8672-509080db.webp",
  "35a479a8-8b52-4982-a9e4-ecbff88e.webp",
  "37710afc-0caa-4ea3-bd6d-1c900674.webp",
  "3937fe9e-c406-4ea0-8c99-bccc6436.webp",
  "40028ff2-895a-4606-b759-2674b1cd.webp",
  "48363a65-24d6-45a0-9eac-8c172665.webp",
  "58888b41-8ecd-4f4e-a890-24b2023d.webp",
  "6b4d0d5d-3d61-4fbc-9196-ffd502e2.webp",
  "7478566c-4b3c-4a10-a7c0-2f8c05fb.webp",
  "8c6f615f-b949-4ed8-b027-bcf2bee4.webp",
  "b700435b-3ad2-4a31-9b72-3e9ae631.webp",
  "c38a5328-857c-4c12-a404-53d28846.webp",
  "ddad1788-ad54-4aad-81fb-f3c96ed0.webp",
  "e31c3b04-8900-4e76-8f15-f02e26da.webp",
  "fb48c8c7-ad22-4aa9-9038-c0637ba7.webp",
] as const;

export type AvatarFile = (typeof AVATAR_FILES)[number];

export const DEFAULT_AVATAR_FILE: AvatarFile =
  "48363a65-24d6-45a0-9eac-8c172665.webp";

export function getAvatarImageUrl(avatarFile: string): string {
  return `/profiles/${avatarFile}`;
}

export function isAvatarFile(value: string): value is AvatarFile {
  return (AVATAR_FILES as readonly string[]).includes(value);
}
