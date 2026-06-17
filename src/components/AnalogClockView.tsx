export function AnalogClockView() {
  return (
    <section className="panel placeholder-panel">
      <p className="eyebrow">Future Feature / Not Final UI</p>
      <h2>Future Analog Time-Block View</h2>

      <p className="placeholder-intro">
        This screen is a labelled placeholder for the circular 12-hour planning view described in
        the proposal. It is not meant to represent the final design yet.
      </p>

      <div className="placeholder-card">
        <h3>What this view will become</h3>
        <p>
          The analog view will let tasks be placed around a clock-like schedule. For example, a user
          could plan a task from 2:00 PM to 3:30 PM and see that time block as a segment on the
          circular clock.
        </p>
      </div>

      <div className="clock-placeholder">
        <div className="clock-face">
          <span className="clock-label top">12</span>
          <span className="clock-label right">3</span>
          <span className="clock-label bottom">6</span>
          <span className="clock-label left">9</span>
          <div className="clock-hand hour-hand" />
          <div className="clock-hand minute-hand" />
          <div className="clock-center" />
        </div>
      </div>

      <div className="placeholder-card">
        <h3>Current status</h3>
        <p>
          The task system and local saving are working first. This screen will be connected to saved
          tasks after the task-management interface is more complete.
        </p>
      </div>
    </section>
  );
}