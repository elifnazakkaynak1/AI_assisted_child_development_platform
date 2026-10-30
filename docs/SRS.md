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

### M7 – Weekly statistics

| ID | Requirement | Priority |
|---|---|---|
| FR-M7-01 | The system shall allow parents to select a week for viewing task completion statistics. | Must |
| FR-M7-02 | The system shall calculate and display the overall task completion rate for the selected week. | Must |
| FR-M7-03 | The system shall calculate and display the task completion rate for each development area for the selected week. | Must |

### M8 – Role-based AI summary

| ID | Requirement | Priority |
|---|---|---|
| FR-M8-01 | The system shall generate AI summaries of a child's weekly records for parents and linked specialists. | Must |
| FR-M8-02 | The system shall use separate AI prompts for parents and specialists based on their roles. | Must |
| FR-M8-03 | The system shall label each AI-generated summary as "AI-generated". | Must |
| FR-M8-04 | The system shall link each AI-generated summary to its source records. | Must |
| FR-M8-05 | The system shall send only records that the requesting user is authorized to access to the AI component. | Must |
| FR-M8-06 | The system shall not automatically make decisions based on AI-generated summaries. | Must |
| FR-M8-07 | The system shall prevent AI-generated summaries from presenting diagnoses or treatment recommendations. | Must |
| FR-M8-08 | The system shall allow parents to mark AI-generated summaries as helpful or incorrect. | Must |

---

## 3. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | The system shall load the weekly schedule page within 2 seconds when running locally with the provided seed data. |
| NFR-02 | Security | The system shall require a valid JWT for access to protected API endpoints and reject requests with missing or invalid tokens. |
| NFR-03 | Privacy | The system shall use only synthetic data generated by a seed script and shall not use real personal data. |
| NFR-04 | Testability | The system shall support a mock AI mode that allows automated tests and CI to run without external AI API calls. |

---

## 4. Critical Flows and Acceptance Criteria

| Flow | Related requirements | Acceptance criteria |
|---|---|---|
| Flow 1: Specialist Linking and Access Control | FR-M1-01, FR-M2-01, FR-M2-02, FR-M2-03, FR-M2-04, FR-M2-06 | **Given** a logged-in parent and a registered specialist who is not linked to the child, **When** the parent links the specialist using their email address and type and later confirms unlinking, **Then** the specialist shall appear in the linked specialists list after linking, be removed after unlinking, and receive an error when attempting to access the child's data through the API. |
| Flow 2: Schedule and Task Completion | FR-M3-01, FR-M3-03, FR-M3-04, FR-M4-01, FR-M4-02, FR-M4-03, FR-M4-04, FR-M4-05 | **Given** a parent and a child with valid accounts, **When** the parent adds an event to the child's weekly schedule and assigns a task, and the child marks the task as completed, **Then** the child shall see the scheduled event and assigned task, and the parent shall see the task's completed status. |
| Flow 3: Specialist Observation and AI Summary | FR-M5-01, FR-M5-02, FR-M8-01, FR-M8-02, FR-M8-03, FR-M8-04, FR-M8-05 | **Given** a specialist linked to a child and a parent authorized to view the child's records, **When** the specialist adds a dated observation and the parent requests a weekly AI summary, **Then** the system shall display a role-based summary labelled "AI-generated", linked to its source records, using only records the parent is authorized to access. |

---

## 6. Change Log

| Date | Change | By |
|---|---|---|
| | First version | |
