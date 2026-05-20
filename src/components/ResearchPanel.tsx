const researchItems = [
  {
    app: "Todoist",
    usefulPattern: "Fast task capture and nested subtasks.",
    limitation: "Scheduling and project planning can feel separated.",
  },
  {
    app: "Notion",
    usefulPattern: "Flexible databases and custom organization.",
    limitation: "Can become too open-ended and visually inconsistent.",
  },
  {
    app: "Google Calendar",
    usefulPattern: "Clear vertical day scheduling.",
    limitation: "Tasks are not naturally decomposed into project trees.",
  },
];

export function ResearchPanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Research Notes Preview</h2>
          <p>Use docs/research-notes.md for the full May 20 research log.</p>
        </div>
      </div>

      <div className="research-grid">
        {researchItems.map((item) => (
          <article key={item.app} className="research-card">
            <h3>{item.app}</h3>
            <p><strong>Useful pattern:</strong> {item.usefulPattern}</p>
            <p><strong>Limitation:</strong> {item.limitation}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
