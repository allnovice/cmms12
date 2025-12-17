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
  visibleColumns: { [key: string]: boolean };
  onAssignUser: (assetId: string, uid: string) => void;
  onSetOffice: (assetId: string, officeId: string) => void;
  isAdmin?: boolean;
};

export default function AssetRow({
  asset,
  offices,
  users,
  highlight,
  updating,
  visibleColumns,
  onAssignUser,
  onSetOffice,
  isAdmin,
}: Props) {
  const router = useRouter();

  return (
    <tr className={highlight ? "highlighted" : ""}>
      <td className="text-center">
        <LocateButton asset={asset} />
      </td>

      {visibleColumns["article"] && (
        <td>
          <button
            className="asset-link"
            onClick={() => router.push(`/assets/${asset.id}`)}
          >
            {asset.article || "-"}
          </button>
        </td>
      )}

      {visibleColumns["typeOfEquipment"] && <td>{asset.typeOfEquipment || "-"}</td>}
      {visibleColumns["description"] && <td>{asset.description || "-"}</td>}
      {visibleColumns["propertyNumber"] && <td>{asset.propertyNumber || "-"}</td>}
      {visibleColumns["serialNumber"] && <td>{asset.serialNumber || "-"}</td>}
      {visibleColumns["acquisitionDate"] && (
        <td>
          {asset.acquisitionDate
            ? new Date(asset.acquisitionDate.seconds * 1000).toLocaleDateString()
            : "-"}
        </td>
      )}
      {visibleColumns["acquisitionValue"] && <td>{asset.acquisitionValue || "-"}</td>}
      {visibleColumns["assignedTo"] && (
        <td>
          <UserSelect
            value={asset.assignedTo || ""}
            users={users}
            onChange={uid => onAssignUser(asset.id, uid)}
            disabled={updating || !isAdmin}
          />
        </td>
      )}
      {visibleColumns["office"] && (
        <td>
          <OfficeSelect
            value={offices.find(o => o.name === asset.location)?.id || ""}
            offices={offices}
            onChange={officeId => onSetOffice(asset.id, officeId)}
            disabled={updating || !isAdmin}
          />
        </td>
      )}
    </tr>
  );
}
