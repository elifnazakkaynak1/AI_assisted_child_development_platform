# Software Requirements Specification (SRS)

**Team name:** G3 
**Version:** ☑ First version (Week 6) ☐ Final (Week 10)  
**Last updated:** 2026-10-30

---

## 1. Introduction

**Purpose of the system** : The goal of this system is to provide a web-based decision
support platform that allows parents, specialists, and children
to manage shared schedules, tasks, and records of observations
according to their roles.

The system also provides role-based AI-generated summaries
and suggestions based on these records to support human
decision-making without making decisions itself.

**Users of the system:**

| User type | Description |
|---|---|
| Parent | Manages the child's data, views all records, links or unlinks specialists, adds and views weekly schedule events, assigns and tracks tasks, accesses documents and observation records, views weekly statistics, and receives role-based AI summaries. |
| Specialist | Accesses records of linked children, adds and views weekly schedule events, assigns and tracks tasks, creates and edits dated observations, uploads and accesses documents, and receives role-based AI summaries. |
| Child | Views their own weekly schedule and assigned tasks and marks tasks as completed. The child cannot access specialist observations or documents. |
 
---

## 2. Functional Requirements

### M1 – Login and roles

| ID | Requirement | Priority |
|---|---|---|
| FR-M1-01 | The system shall allow registered users to log in using their email address and password. | Must |
| FR-M1-02 | The system shall determine each user's role (parent, specialist, or child) based on their account. | Must |
| FR-M1-03 | The system shall restrict users to the screens authorized for their roles. | Must |

### M2 – Linking specialists

| ID | Requirement | Priority |
|---|---|---|
| FR-M2-01 | The system shall allow parents to link registered specialists to their children by specifying the specialists' email addresses and types. | Must |
| FR-M2-02 | The system shall allow parents to view the list of specialists linked to their children. | Must |
| FR-M2-03 | The system shall require parental confirmation before unlinking a specialist from a child. | Must |
| FR-M2-04 | The system shall allow parents to unlink a specialist from their child after confirmation. | Must |
| FR-M2-05 | The system shall display an error message when a parent attempts to link a specialist using an unregistered email address. | Must |
| FR-M2-06 | The system shall reject every API request concerning a child from a specialist who is not linked to that child and return an error response. | Must |
| FR-M2-07 | The system shall allow specialists to view the list of children they are linked to. | Must |

### M3 – Weekly schedule

| ID | Requirement | Priority |
|---|---|---|
| FR-M3-01 | The system shall allow parents to add events to their children's weekly schedules. | Must |
| FR-M3-02 | The system shall allow linked specialists to add events to a child's weekly schedule. | Must |
| FR-M3-03 | The system shall display a child's scheduled events in a weekly view to the parent and linked specialists. | Must |
| FR-M3-04 | The system shall allow children to view only their own weekly schedules. | Must |

### M4 – Tasks

| ID | Requirement | Priority |
|---|---|---|
| FR-M4-01 | The system shall allow parents and linked specialists to assign tasks to a child. | Must |
| FR-M4-02 | The system shall allow task assigners to specify a title, description, development area, and due date for each task. | Must |
| FR-M4-03 | The system shall allow children to view their assigned tasks. | Must |
| FR-M4-04 | The system shall allow children to mark their assigned tasks as completed. | Must |
| FR-M4-05 | The system shall display the completion status of each task to the user who assigned it. | Must |

### M5 – Specialist entries

| ID | Requirement | Priority |
|---|---|---|
| FR-M5-01 | The system shall allow linked specialists to add dated observation entries for a child. | Must |
| FR-M5-02 | The system shall allow parents and linked specialists to view observation entries for a child. | Must |
| FR-M5-03 | The system shall allow linked specialists to edit observation entries for children they are linked to. | Must |
| FR-M5-04 | The system shall mark modified observation entries as "edited". | Must |
| FR-M5-05 | The system shall prevent children from accessing specialist observation entries. | Must |

### M6 – Documents

| ID | Requirement | Priority |
|---|---|---|
| FR-M6-01 | The system shall allow parents and linked specialists to upload PDF or image files for a child. | Must |
| FR-M6-02 | The system shall display a list of documents associated with a child, including each document's name, file type, uploader, and upload date. | Must |
| FR-M6-03 | The system shall allow parents and linked specialists to view documents associated with a child. | Must |
| FR-M6-04 | The system shall allow parents and linked specialists to download documents associated with a child. | Must |
| FR-M6-05 | The system shall prevent children from accessing documents. | Must |

### M7 – (module name)

| ID | Requirement | Priority |
|---|---|---|
| FR-M7-01 | | |

### M8 – (module name)

| ID | Requirement | Priority |
|---|---|---|
| FR-M8-01 | | |

---

## 3. Non-Functional Requirements

> Keep only the ones that matter for your system (3–5 is enough). Make each one measurable.

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | e.g., Pages load in under 2 seconds. |
| NFR-02 | Security | e.g., Passwords are stored hashed. |
| NFR-03 | Usability | |
| NFR-04 | | |

---

## 4. Critical Flows and Acceptance Criteria

> Choose the 3 most important user flows. Each one will have an end-to-end test (Week 10).
> Write acceptance criteria as Given / When / Then.

| Flow | Related requirements | Acceptance criteria |
|---|---|---|
| Flow 1: | FR-… | **Given** … **When** … **Then** … |
| Flow 2: | FR-… | **Given** … **When** … **Then** … |
| Flow 3: | FR-… | **Given** … **When** … **Then** … |

---

## 5. Use Case Diagram (optional)

> A simple diagram showing users and main use cases. You can use Mermaid (renders on GitHub) or add an image from `docs/img/`.

---

## 6. Change Log

| Date | Change | By |
|---|---|---|
| | First version | |
