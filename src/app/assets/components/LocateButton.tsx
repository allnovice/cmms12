"use client";

import { FiMapPin } from "react-icons/fi";
import { Asset } from "@/types";
import { useRouter } from "next/navigation";

type Props = { asset: Asset };

export default function LocateButton({ asset }: Props) {
  const router = useRouter();
  const handleLocate = () => {
    if (asset.latitude && asset.longitude) {
      router.push(
        `/maps?assetId=${asset.id}&lat=${asset.latitude}&lng=${asset.longitude}&name=${encodeURIComponent(
          asset.article || ""
        )}`
      );
    } else {
      router.push(`/maps?assetId=${asset.id}`);
    }
  };

  return (
    <button
      onClick={handleLocate}
      title="Show on map"
      className="locate-btn"
    >
      <FiMapPin size={18} />
    </button>
  );
}
