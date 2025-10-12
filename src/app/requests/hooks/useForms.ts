import { useEffect, useState } from "react";
import axios from "axios";

export function useForms(serverUrl: string) {
  const [forms, setForms] = useState<{ filename: string; url: string }[]>([]);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await axios.get(`${serverUrl}/forms`);
        setForms(
          res.data.forms.map((f: string) => ({
            filename: f,
            url: `${serverUrl}/uploads/${f}`,
          }))
        );
      } catch (err) {
        console.error("Error fetching forms:", err);
      }
    };
    fetchForms();
  }, [serverUrl]);

  return forms;
}
