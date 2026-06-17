export function DayView() {
  return (
    <section className="panel placeholder-panel">
      <p className="eyebrow">Future Feature / Not Final UI</p>
      <h2>Future Vertical Day View</h2>

      <p className="placeholder-intro">
        This screen is a labelled placeholder for the daily schedule view. It is not a debugging
        screen and it is not the final UI.
      </p>

      <div className="placeholder-card">
        <h3>What this view will become</h3>
        <p>
          The vertical day view will show a day from morning to evening in a calendar-style layout.
          Tasks from the task tree will eventually be assigned to time blocks in this schedule.
        </p>
      </div>

      <div className="day-placeholder">
        <div className="day-row">
          <span>9:00 AM</span>
          <div>Future time block area</div>
        </div>
        <div className="day-row">
          <span>10:00 AM</span>
          <div>Tasks will appear here after scheduling is added</div>
        </div>
        <div className="day-row">
          <span>11:00 AM</span>
          <div />
        </div>
        <div className="day-row">
          <span>12:00 PM</span>
          <div />
        </div>
        <div className="day-row">
          <span>1:00 PM</span>
          <div />
        </div>
      </div>

      <div className="placeholder-card">
        <h3>Current status</h3>
        <p>
          This view is intentionally simple right now. The current milestone is focused on making
          task creation, subtasks, completion, and filtering work before connecting tasks to time
          blocks.
        </p>
      </div>
    </section>
  );
}