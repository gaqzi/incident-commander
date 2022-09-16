Incident Commander
==================
_Helps you manage your incident by showing what's going on and helping you
summarize for updates_

[Demo](https://gaqzi.github.io/incident-commander/)

# Goals

When I end up being an [incident commander] I need to:

1. Keep stakeholders updated (business impact etc.)
2. Keep everyone that is debugging up-to-date
3. Keep track of all the various streams of research and when I last got an
   update

This is done by:

- Updating our internal status page with business updates
- Updating the channel with current status
    - Our current actions
        - Escalating to vendor
        - Researching if a system change occurred in subsystem X
    - Results of previous explorations
        - Explored a change in X but after reverting [link to thread] it did
          nothing

Today I do this by a combination of text editor (what's going on), Slack
reminders, and being meticulous about my process. I wonder if doing a small
UI with clear operations and template outputs I could:

- Get a timeline
- Generate an accurate status update (business + tech) where I don't miss data
- Provide consistency across commanders
- Simplify onboarding of new commanders

[incident commander]: https://www.atlassian.com/incident-management/incident-response/incident-commander

## MVP

![Mockup](docs/images/incident-commander-mockup.light.excalidraw.png#gh-light-mode-only)
![Mockup](docs/images/incident-commander-mockup.dark.excalidraw.png#gh-dark-mode-only)

1. Specify what the incident is about
    - Since 00:00 UTC we are seeing [problem] in [impacted area] with [impact]
2. Add actions that we are taking
    - Specify who is taking an action and how long between updates
    - Allow actions to have a link to something
3. Keep a list of current active
    - Finish action and don't provide in summary (escalation successful, for
      example doesn't need to be mentioned, it will lead to a new action)
    - Issue a reminder when checkin time has come to give an update
4. Keep a list of past actions
    - Shown and what resolution they had. Will be part of the big tech
      update but at the bottom of it.
5. Buttons to export (goes into the clipboard)
    - Business update: Doesn't have any formatting
    - Business + Text Update: Uses Slack formatting

Post MVP:

- Escalation policy and impact calculation: Specify how to escalate and
  when depending on the impact. Ideally with a list of people to add into
  OpsGenie.
