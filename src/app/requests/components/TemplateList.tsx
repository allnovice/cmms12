interface TemplateListProps {
  forms: any[];                  // or a proper Form type if you have one
  onSelect: (form: any) => void;
}
export default function TemplateList({ forms, onSelect }: TemplateListProps) {
  return (
    <div className="template-list">
      {forms.map((f) => (
        <div key={f.filename}>
          <span>{f.filename}</span>
          <button onClick={() => onSelect(f)}>Select</button>
        </div>
      ))}
    </div>
  );
}
