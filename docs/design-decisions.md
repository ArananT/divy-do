# Design Decisions

## Decision 1: Subtasks are not dependencies

Subtasks are lower-level pieces of a larger task, but they should not force a strict completion order.

## Decision 2: Child tasks should stay connected to their root task

Each child task should be associated with its root task so all work connected to a larger project can be filtered or viewed together.

## Decision 3: Time-block completion is separate from task completion

Finishing a scheduled work block should not always complete the task. Some blocks represent time spent working, while others represent the actual goal.

## Decision 4: The analog clock view and vertical day view should share the same schedule data

A block created in one view should appear in the other. This avoids having two separate scheduling systems.

## Decision 5: SQLite comes after the first UI skeleton

The first milestone focuses on setup, research, and wireframes. The early app can use fake data while the interface and task model are being tested.
