"use client";

import { useRouter } from "next/navigation";
import { Asset, Office, User } from "@/types";
import LocateButton from "./LocateButton";
import UserSelect from "./UserSelect";
import OfficeSelect from "./OfficeSelect";
import "../AssetsTable.css";

type Props = {
  asset: Asset;
  offices: Office[];
  users: User[];
  highlight: boolean;
  updating: boolean;
  onAssignUser: (assetId: string, uid: string) => void;
  onSetOffice: (assetId: string, officeId: string) => void;
};

export default function AssetRow({
  asset,
  offices,
  users,
  highlight,
  updating,
  onAssignUser,
  onSetOffice,
}: Props) {
  const router = useRouter();

  return (
    <tr className={highlight ? "highlighted" : ""}>
      <td className="text-center">
        <LocateButton asset={asset} />
      </td>

      <td>
        <button
  className="asset-link"
  onClick={() => router.push(`/assets/${asset.id}`)}
>
  {asset.article || "-"}
</button>
      </td>

      <td>{asset.typeOfEquipment || "-"}</td>
      <td>{asset.description || "-"}</td>
      <td>{asset.propertyNumber || "-"}</td>
      <td>{asset.serialNumber || "-"}</td>
      <td>
        {asset.acquisitionDate
          ? new Date(asset.acquisitionDate.seconds * 1000).toLocaleDateString()
          : "-"}
      </td>
      <td>{asset.acquisitionValue || "-"}</td>

      <td>
        <UserSelect
          value={asset.assignedTo || ""}
          users={users}
          onChange={(uid) => onAssignUser(asset.id, uid)}
          disabled={updating}
        />
      </td>

      <td>
        <OfficeSelect
          value={offices.find((o) => o.name === asset.location)?.id || ""}
          offices={offices}
          onChange={(officeId) => onSetOffice(asset.id, officeId)}
          disabled={updating}
        />
      </td>
    </tr>
  );
}
