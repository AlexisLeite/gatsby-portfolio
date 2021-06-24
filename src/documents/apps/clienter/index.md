---
title: "Gestión de clientes"
label: "Clienter"
---
# Clienter

El software fue desarrollado a pedido de un taller informático para el control de equipos y clientes, así como de órdenes de trabajo emitidas. El objetivo fue desde el principio desarrollar en poco tiempo (una semana o menos) una aplicación web cuya interfaz gráfica estuviese construida con React y Sass, su API con Express y su base de datos con MongoDB.

Siendo este un objetivo muy ambicioso, sobre todo para mi que en ese momento núnca había trabajado con MongoDB y apenas si conocía el API de Express, me puse en marcha: primero realicé un diseño de relaciones entre los componentes que integrarían la aplicación: clientes, ordenes y actualizaciones de órdenes. Luego realicé el diseño de la interfaz de usuario, definí qué vistas serían necesarias para llevar a cabo la aplicación y las diseñé una a una. Al final diseñé el API que daría enlazaría la capa de datos con la de presentación, definí las rutas y las implementé.

El resultado fue una aplicación fluida, que expresa correctamente el modo de trabajo y permite realizar al usuario las tareas necesarias: 

- **Gestión de clientes:** Crear, actualizar datos o eliminar clientes de forma muy sencilla.
- **Gestión de órdenes de compras:** Al crear una nueva órden de trabajo se debe asignar a un cliente existente, si se desea se puede crear uno nuevo en una etapa intermedia para ese fin. Modificar y eliminar las órdenes también es posible y muy sencillo.
- **Búsquedas:** El sistema de búsquedas es muy sencillo y potente, se basa en el uso de expresiones regulares para buscar en los diferentes campos de la base de datos. Por ello es sencillo realizar búsquedas simples y avanzadas, si se conocen las reglas de dicha herramienta.
- **Actualizaciones de órdenes:** Una vez creada una órden de trabajo, es muy probable que se desee agregar actualizaciones acerca del proceso de reparación del equipo. Esto es una funcionalidad integrada y permite ir actualizando el presupuesto del trabajo progresivamente.

## Vista previa

`youtube: https://youtu.be/j5ZCxwxAHwk`
