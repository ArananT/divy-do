# Design Decisions

This document records the main early design decisions for Divy-Do. These decisions are based on the project proposal, the initial research into existing task management tools, and the current goal of preparing the project for the first milestone review.

The first milestone is focused on setup, environment configuration, early research, and wireframing. Because of that, the current prototype intentionally uses fake in-memory data rather than a full database. This allows the basic interface and data shape to be tested before the application commits to a more permanent database structure.

## Decision 1: Subtasks are lower-level pieces, not dependencies

One of the most important design decisions is that subtasks should not be treated as dependencies. In many project management systems, subtasks or child items can become part of a strict workflow where one item must be completed before another. This is not the goal of Divy-Do.

In this project, subtasks are meant to represent smaller pieces of a larger task. For example, if the root task is "Finish honours project," then child tasks might include "set up project," "create task model," "build time-blocking view," and "write final report." These tasks are connected because they belong to the same larger goal, but they do not necessarily need to be completed in one forced order.

This makes the app more flexible for real student work. When working on a project, the user may not always complete subtasks in a perfect sequence. They may start one section, switch to another, return later, or complete a smaller task out of order. The interface should support that kind of flexible work rather than forcing the user into a rigid project management structure.

## Decision 2: Every child task should stay connected to its root task

A second important decision is that child tasks should keep a connection to their root task. The parent-child relationship is useful for building the visible tree, but the root relationship is useful for filtering and understanding the larger project a task belongs to.

For example, a task tree might look like this:

```text
Honours Project
  Build Prototype
    Create Sidebar
    Create Task Tree
```

In this case, "Create Sidebar" has "Build Prototype" as its direct parent, but the root task is still "Honours Project." Storing or tracking this root connection makes it easier to view all work connected to the larger project, even when a task is several levels deep.

This design choice is important because Divy-Do is not meant to be just a visual nesting tool. The hierarchy should also help the user understand what larger goal each small task contributes to. Root-task inheritance supports that by keeping all lower-level tasks associated with the larger project.

## Decision 3: Task completion needs to track how the task was completed

Task completion is not as simple as changing a task from open to complete. A task may be completed directly by the user, completed because a scheduled time block finished, or completed because a parent task was marked complete.

These situations should not all be treated exactly the same internally. If a user manually completes a task, that is different from a task being completed automatically because its parent was completed. This distinction matters because automatic or parent-based completion could affect many child tasks at once.

Tracking the completion source makes the system easier to reason about and safer to use. For example, if a parent task is accidentally marked complete and all child tasks are also completed, the app could eventually identify that those child tasks were completed through the parent rather than manually. This could make it easier to undo or review large completion actions later.

## Decision 4: Finishing a time block should not always complete the task

A major part of the app is time-blocking, but completing a scheduled time block should not always mean the task itself is complete.

Some tasks are time-based by nature. For example, a task like "study for one hour" can reasonably be completed when the one-hour block ends. In that case, the scheduled time block represents the actual task goal.

Other tasks are not time-based in the same way. For example, if the task is "implement database integration," a one-hour time block may only represent time spent working on that task. The task may still be unfinished after the block ends. In this case, completing the time block should not automatically complete the task.

Because of this, Divy-Do should allow each time block to store whether finishing that block should also complete the task. This keeps the app flexible and avoids making incorrect assumptions about the user's work.

## Decision 5: The analog clock view and vertical day view should use the same schedule data

The project includes two planning views: an analog clock view and a vertical day view. These views should not have separate schedules. A time block created in one view should appear in the other view because both views are simply different ways of presenting the same underlying schedule.

This is important because keeping separate schedule data would create confusion and make the app harder to maintain. If a user moves a block in the vertical day view, the analog clock view should reflect that same change. If a block is added from the analog clock view, it should also appear in the day view.

The two views have different strengths. The vertical day view is familiar and precise. The analog clock view gives a quick visual sense of how a 12-hour period is structured. Since they serve different purposes but represent the same schedule, they should be connected through one shared scheduling model.

## Decision 6: The first prototype should use fake data before SQLite

The current prototype uses fake in-memory task data. This is intentional. The first milestone is focused on project setup, early research, and wireframing, while the database layer belongs to the next milestone.

Starting with fake data makes it easier to test the interface structure before committing to the final database schema. The app can already show a task tree, selected task details, a clock view, and a day view without needing persistence. This helps confirm that the general direction of the interface makes sense.

SQLite will be added once the task model and hierarchy logic are clearer. This should reduce the chance of creating a database structure that needs to be heavily changed immediately afterward.

## Decision 7: The first version should remain local-first

Divy-Do is intended to be a local-first desktop application. The user should be able to open the app and use it without an account, cloud sync, or internet connection. This fits the goal of making a focused planning tool rather than a large online productivity platform.

A local-first approach also keeps the project scope realistic. Adding accounts, authentication, cloud storage, or collaboration would significantly increase the complexity of the project and distract from the main goal, which is hierarchical task planning and visual time-blocking.

For this reason, SQLite is a good choice for the first complete version. It allows the app to store tasks and schedules locally while keeping the application self-contained.

## Decision 8: The e-ink companion display should remain a stretch goal

The e-ink display is an interesting extension, but it should not be part of the core requirements for the first working version. The main desktop app needs to be completed first.

If the core features are finished early, the e-ink display can be explored as a low-distraction companion view. It could show the current time block, the next few tasks, or a simplified version of the daily schedule. However, the project should not depend on this feature because hardware integration would introduce extra technical risk.

Keeping the e-ink display as a stretch goal makes the project more realistic. The main deliverable remains the desktop application, while the e-ink display can be treated as an optional extension if time allows.

## Summary

The main design direction is to keep Divy-Do focused and flexible. The app should help users break down large tasks into smaller pieces, understand how those pieces connect to a larger goal, and schedule work visually without forcing a strict workflow.

The most important design choices are that subtasks are not dependencies, tasks stay connected to their root project, completion source is tracked, and both time-blocking views share the same schedule data. These decisions support the overall goal of creating a planning tool that is more structured than a simple to-do list but less overwhelming than a fully customizable productivity platform.