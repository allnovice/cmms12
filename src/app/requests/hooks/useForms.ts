import { useEffect, useState } from "react";
import axios from "axios";

export function useForms(serverUrl: string) {
  const [forms, setForms] = useState<{ filename: string; url: string }[]>([]);

  useEffect(() => {
    if (!serverUrl) return;

    const fetchForms = async () => {
      try {
        const res = await axios.get(`${serverUrl}/forms`, { timeout: 5000 });
        const files = Array.isArray(res.data?.forms) ? res.data.forms : [];
        setForms(
          files.map((f: string) => ({
            filename: f,
            url: `${serverUrl}/uploads/${f}`,
          }))
        );
      } catch (err) {
        console.warn("Server unreachable or error fetching forms:", err);
        setForms([]); // fallback to empty, avoids crash
      }
    };

    fetchForms();
  }, [serverUrl]);

  return forms;
}
