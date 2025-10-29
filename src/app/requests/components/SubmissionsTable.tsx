interface SubmissionsTableProps {
  submissions: any[];          // array of submission objects
  loading: boolean;
  onSelect: (submission: any) => void;
}

export default function SubmissionsTable({ submissions, loading, onSelect }: SubmissionsTableProps) {
  if (loading) return <p>Loading...</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Filename</th>
          <th>By</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {submissions.map((s) => (
          <tr key={s.id} onClick={() => onSelect(s)} style={{ cursor: "pointer" }}>
            <td>{s.filename.split("_")[0]}</td>
            <td>{s.filledBy || "?"}</td>
            <td>{s.status || "pending"}</td>
            <td>{s.timestamp?.toDate ? s.timestamp.toDate().toLocaleString() : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
