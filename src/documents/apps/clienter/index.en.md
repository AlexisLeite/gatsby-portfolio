---
title: "Clients management system"
label: "Clienter"
---

# Clienter

This software was developed for a IT workshop to handle theirs clients and work orders. My goal was to develop it in a week or less and do it using React and Sass on the frontend and Node.js with Express and MongoDB on the backend.

It was in fact an ambitious goal, after all I had never used MongoDb and had little experience working with Express. First, I made the relational design, the components which should be represented in the data. Then I made the graphic interface design, I needed to define which views were necessary and build them. In order to make the communication possible, I designed an API which would link the data with the presentation.

The result is beautiful. It works correctly and is easy to be used. It allows to accomplish all the goals and is working until today with no problems. The workshop can now handle:

- **Clients management:** CRUD operations in a simple way.
- **Work orders management** Whenever the user creates a new work order, it must be assigned to an existent client. If you want, you can create a new one on the fly to accomplish this requeriment. It's also possible to modify or delete existent orders.
- **Search engine:** The search engine is simple and powerful. It's based on regular expressions allowing to the user to implement them. 
- **Order updates:** When a order is created, it has an initial budget, symtoms and diagnosis. When the workshop works in the equip, it's possible that it needs to update the orders and its budgets. This is accomplished in a very simple way, adding updates to the orders whenever it's neccesary. It updates the budget and adds information on the repair process.

## Preview

`youtube: https://youtu.be/j5ZCxwxAHwk`
