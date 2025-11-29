import ServerStatus from "./ServerStatus";
import LatestAsset from "./LatestAsset";
import LatestUser from "./LatestUser";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Server status */}
      <ServerStatus />

      {/* Latest asset */}
      <LatestAsset />

      {/* Latest registered user */}
      <LatestUser />

      {/* Page content */}
      <main>{children}</main>
    </>
  );
}
