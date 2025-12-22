import ServerStatus from "./ServerStatus";
import StatsOverview from "./StatsOverview";
import LatestAsset from "./LatestAsset";
import LatestUser from "./LatestUser";
import "./DashboardLayout.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hasChildrenContent = Boolean(children);

  return (
    <div className="dashboard-layout">
      <section className="dashboard-block" aria-label="Server status">
        <ServerStatus />
      </section>

      <section className="dashboard-block" aria-label="Key counts">
        <StatsOverview />
      </section>

      <div className="dashboard-grid" aria-label="Latest activity">
        <section className="dashboard-block" aria-label="Latest assets">
          <LatestAsset />
        </section>

        <section className="dashboard-block" aria-label="Latest user">
          <LatestUser />
        </section>
      </div>

      {hasChildrenContent && (
        <section className="dashboard-block dashboard-block--content" aria-label="Additional content">
          {children}
        </section>
      )}
    </div>
  );
}
