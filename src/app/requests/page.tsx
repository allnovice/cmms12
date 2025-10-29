"use client";

import { useFormHandler } from "./hooks/useFormHandler";
import { useForms } from "./hooks/useForms";
import { useSubmissions } from "./hooks/useSubmissions";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import TemplateList from "./components/TemplateList";
import DynamicForm from "./components/DynamicForm";
import SubmissionsTable from "./components/SubmissionsTable";

export default function RequestsPage() {
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
  const { user } = useAuth();
  const forms = useForms(SERVER_URL);
  const { submissions, loading: loadingSubs } = useSubmissions();

  const [visibleRow, setVisibleRow] = useState(1);
  const maxRow = 7;

  const addRow = () => setVisibleRow((r) => Math.min(r + 1, maxRow));

  const formHandler = useFormHandler(SERVER_URL);

  return (
    <div className="requests-page">
      <h2>Templates</h2>

      <TemplateList
        forms={forms}
        onSelect={(f) => formHandler.handleSelect(f, false)}
      />

      {formHandler.selectedForm && (
        <DynamicForm
          user={user}
          visibleRow={visibleRow}
          maxRow={maxRow}
          addRow={addRow}
          {...formHandler}
          SERVER_URL={SERVER_URL}
        />
      )}

      <h2>Submissions</h2>
      <SubmissionsTable
        submissions={submissions}
        loading={loadingSubs}
        onSelect={(s) =>
          formHandler.handleSelect(
            { ...s, id: s.id, url: null, filledData: s.filledData },
            s.status !== "pending"
          )
        }
      />
    </div>
  );
}
