# Initial Research Notes

These research notes summarize early observations from existing task management, planning, and time-blocking tools. The purpose of this section is not to copy any specific application, but to identify common patterns, useful design ideas, and limitations that helped motivate the direction of Divy-Do.

The main issue this project is trying to address is that many productivity tools tend to fall into one of two extremes. Some applications are very simple and easy to use, but they do not provide enough structure for planning larger projects or assignments. Other tools are very powerful and customizable, but they require the user to build and maintain their own system before the tool becomes useful. Divy-Do is intended to sit somewhere between these two extremes by keeping the interface focused while still allowing tasks to be divided into smaller subtasks and connected to visual planning views.

## Todoist

Todoist is useful because it provides a very quick and simple way to create tasks, organize them into projects, and mark them as complete. The interface is generally clean and easy to understand, which makes it good for quickly writing down work without spending too much time setting up a system. It also supports subtasks, which is relevant to this project because Divy-Do is also focused on breaking larger work into smaller pieces.

However, Todoist still feels mostly like a task list. While subtasks exist, they do not fully become a visual structure for understanding how a large project is divided. Scheduling can also feel somewhat separate from the actual task breakdown. This means that a user may still need to use another tool, such as a calendar or notebook, to decide when each task should actually be completed.

Divy-Do can borrow Todoist's simplicity and low-friction task creation. The project should avoid making the user do too much setup before adding tasks. At the same time, Divy-Do should avoid becoming only a list of tasks, because the main goal is to support larger project planning through hierarchy and time-blocking.

## TickTick

TickTick is useful because it combines task management with calendar-style planning, reminders, and other productivity features. This makes it a good example of an app that tries to connect tasks with time. The ability to see tasks alongside a schedule is especially relevant to Divy-Do because one of the main goals of this project is to make scheduling feel like a continuation of task creation.

The limitation is that TickTick can become visually and functionally busy because it includes many different productivity features. While this can be useful for some users, it can also make the app feel less focused. For this project, adding too many features too early would make the application harder to design and harder to evaluate.

Divy-Do can borrow the idea that task management and scheduling should be connected. However, the first version should avoid trying to include every possible productivity feature. The focus should stay on the task tree, the task details, and the two time-blocking views.

## Notion

Notion is powerful because it allows users to create highly customized pages, databases, lists, calendars, and project management systems. It is useful for users who already know exactly how they want to organize their work. The flexibility of Notion makes it possible to create a task system that fits many different workflows.

The problem is that this flexibility can also become a weakness. Notion often requires the user to design their own system before it becomes useful. A student may spend time setting up pages, databases, templates, and views rather than actually planning and completing work. This can create a productivity environment that is powerful, but not always focused or cohesive.

Divy-Do can borrow Notion's ability to represent larger projects as smaller pieces, but it should avoid requiring heavy customization. The user should not have to design their own productivity system from scratch. The app should provide a clear structure by default: tasks can be divided into subtasks, selected tasks can be inspected, and tasks can be assigned to time blocks.

## Microsoft To Do

Microsoft To Do is useful because it is simple and easy to understand. It does not overwhelm the user with too many tools or options. Tasks can be created quickly, organized into lists, and marked complete in a very direct way. This is a good reminder that a task management app should not become so complicated that the user avoids using it.

The limitation is that Microsoft To Do does not provide much depth for planning larger projects. It works well for individual tasks or simple lists, but it is less effective when the user needs to divide a large assignment, project, or goal into many connected parts. The structure is also not strongly connected to visual scheduling.

Divy-Do can borrow the clarity and low visual clutter of Microsoft To Do. The project should avoid unnecessary complexity in the first version. However, Divy-Do needs to provide more structure than a simple list by supporting nested subtasks, root-task association, and scheduling views.

## Google Calendar

Google Calendar is useful because it provides a familiar vertical day view. The user can quickly understand where events are placed during the day, how long they last, and whether different events overlap. This is one of the clearest examples of time-blocking because the day is shown as a timeline.

The limitation is that calendar events are not naturally connected to a task hierarchy. A scheduled block may represent work on an assignment, but the calendar itself does not show how that work fits into the larger project. This means the user may still need a separate task manager to break down the actual work.

Divy-Do can borrow the vertical timeline structure from Google Calendar because it is familiar and easy to interpret. However, Divy-Do should avoid treating time blocks as isolated events. In this project, a time block should be connected to a task from the task tree so that scheduling and task planning remain part of the same system.

## Sunsama, Akiflow, and Similar Daily Planning Tools

Sunsama, Akiflow, and similar tools are useful because they focus on daily planning. These tools often encourage users to pull tasks into a schedule and decide what work will actually happen during the day. This is relevant because one of the main goals of Divy-Do is to help tasks move naturally from a list into a time-blocked plan.

The limitation is that these tools often focus more on calendar workflow and daily planning than on deep task decomposition. They may be useful for deciding what to work on today, but they do not always provide the kind of flexible task tree structure that this project is trying to create.

Divy-Do can borrow the idea that scheduling should feel like a natural part of planning. However, it should avoid becoming too strict or opinionated about how the user must organize their day. The task hierarchy should remain flexible so that users can create, complete, and schedule subtasks in the order that makes sense to them.

## Early Research Conclusion

The research suggests that existing tools usually handle one part of the problem well, but not the full workflow this project is focused on. Simple to-do list apps are easy to use, but they often lack enough structure for large projects. Calendar tools are strong for scheduling, but they do not naturally show task decomposition. Flexible tools like Notion can support complex planning, but they often require too much setup from the user.

Divy-Do should combine the useful parts of these tools while avoiding their main issues. The app should keep the clarity of a simple task list, add the structure of a task tree, and connect that structure to visual time-blocking views. The main design goal is that task creation, task subdivision, and scheduling should feel like one connected workflow rather than three separate systems.
