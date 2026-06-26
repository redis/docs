---
Title: Data types for Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Introduction to differences in data types between standalone and Active-Active
  Redis databases.
hideListLinks: false
linktitle: Data types
weight: 90
url: '/operate/rs/7.8/databases/active-active/develop/data-types/'
---


Active-Active databases use conflict-free replicated data types (CRDTs). From a developer perspective, most supported data types work the same for Active-Active and standard Redis databases. However, a few methods also come with specific requirements in Active-Active databases.

Even though they look identical to standard Redis data types, there are specific rules that govern the handling of
conflicting concurrent writes for each data type.

As conflict handling rules differ between data types, some commands have slightly different requirements in Active-Active databases versus standard Redis databases.

See the following articles for more information.

