import ServerStatus from "./ServerStatus";
import LatestAsset from "./LatestAsset";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
<>    
     

      {/* Server status */}
      <ServerStatus />

      {/* Latest asset */}
      <LatestAsset />

      {/* Page content */}
      <main>{children}</main>
  </> 
  );
}
