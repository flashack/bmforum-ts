"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FavoriteButton({ tid, initial, logged }: { tid: number; initial: boolean; logged: boolean }) {
  const [fav, setFav] = useState(initial);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!logged) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tid }),
      });
      const data = (await res.json()) as { ok: boolean; favorited?: boolean };
      if (data.ok) setFav(!!data.favorited);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={toggle} disabled={busy} className="cursor-pointer hover:underline disabled:opacity-60">
      {fav ? "★ 已收藏" : "☆ 收藏本帖"}
    </button>
  );
}
