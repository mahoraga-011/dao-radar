"use client";

import { useState } from "react";

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 35%)`;
}

export default function DAOAvatar({
  imageUrl,
  name,
  size = 40,
}: {
  imageUrl?: string;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const letter = (name[0] || "?").toUpperCase();

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-lg object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-lg shrink-0 text-white font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: hashColor(name),
        fontSize: size * 0.4,
      }}
    >
      {letter}
    </div>
  );
}
