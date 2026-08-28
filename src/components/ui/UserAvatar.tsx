"use client";

import { useState } from "react";

interface UserAvatarProps {
  src?: string;
  name: string;
  npub?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function UserAvatar({
  src,
  name,
  npub,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Kích thước linh hoạt cho từng vị trí
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-xl",
    xl: "w-24 h-24 sm:w-28 sm:h-28 text-3xl",
  };

  // Avatar dự phòng tạo ngẫu nhiên theo npub/tên (không bao giờ lỗi)
  const fallbackSvg = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
    npub || name
  )}`;

  if (!src || hasError) {
    return (
      <div
        className={`${sizeMap[size]} rounded-full bg-purple-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      >
        <img
          src={fallbackSvg}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Nếu Dicebear cũng nghẽn mạng thì hiện chữ cái đầu
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setHasError(true)}
      className={`${sizeMap[size]} rounded-full object-cover border-4 border-white shadow-md bg-slate-100 shrink-0 ${className}`}
    />
  );
}