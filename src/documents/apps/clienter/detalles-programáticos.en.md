---
title: "Clienter programmatic details"
label: "Programmatic details"
index: 1
---

# Clienter programmatic details

While I was developing this software, I needed to develop some algorithms which I consider that are interesting, I hope you find the interesting too:

## Search engine

The search engine is based on the aggregation process of MongoDB. The query is generated automatically by my algorithm based on the declaration of the fields which must be processed. The interesting thing about this is that the aggregation can lookup on related collections to retrieve documents which can contain important information not only within them, but on other related documents too. For example, when you search for orders in the clienter, the search route is declared as it follows:

```js
let fields = [
  "client.name",
  "client.phone",
  "client.address",
  "client.city",
  "diagnosis",
  "equip",
  "symtoms",
  "updates.*.title",
  "updates.*.description",
].join(",");
mongooseSearch(api, "/orders", schemas.models.Order, fields);
```

The **mongooseSearch** method was created by me, and it is the one in charge of generating the aggregation. When the previous code is executed, a route in GET /orders is created which accepts the *q, sort, perPage and page* query properties. If then the route **/orders?perPage=5&page=2&sort=name&q=notebook%20rota** is requested, the following aggregation is automatically generated:

```js
[
  {
    "$lookup": {
      "from": "clients",
      "localField": "client",
      "foreignField": "_id",
      "as": "client"
    }
  },
  {
    "$unwind": {
      "path": "$client"
    }
  },
  {
    "$lookup": {
      "from": "updates",
      "let": {
        "id": "$_id"
      },
      "pipeline": [
        {
          "$match": {
            "$expr": {
              "$eq": [
                "$$id",
                "$order"
              ]
            }
          }
        },
        {
          "$match": {
            "$or": [
              {
                "title": {
                  "$regex": "notebook rota",
                  "$options": "i"
                }
              },
              {
                "description": {
                  "$regex": "notebook rota",
                  "$options": "i"
                }
              }
            ]
          }
        }
      ],
      "as": "updates"
    }
  },
  {
    "$match": {
      "$or": [
        {
          "updates": {
            "$size": 1
          }
        },
        {
          "$or": [
            {
              "client.name": {
                "$regex": "notebook rota",
                "$options": "i"
              }
            },
            {
              "client.phone": {
                "$regex": "notebook rota",
                "$options": "i"
              }
            },
            {
              "client.address": {
                "$regex": "notebook rota",
                "$options": "i"
              }
            },
            {
              "client.city": {
                "$regex": "notebook rota",
                "$options": "i"
              }
            },
            {
              "diagnosis": {
                "$regex": "notebook rota",
                "$options": "i"
              }
            },
            {
              "equip": {
                "$regex": "notebook rota",
                "$options": "i"
              }
            },
            {
              "symtoms": {
                "$regex": "notebook rota",
                "$options": "i"
              }
            }
          ]
        }
      ]
    }
  },
  {
    "$facet": {
      "statistics": [
        {
          "$count": "total"
        }
      ],
      "results": [
        {
          "$project": {
            "__indexThatShouldNeverExist__": 0
          }
        },
        {
          "$sort": {
            "name": 1,
            "createdAt": -1,
            "id": 1
          }
        },
        {
          "$skip": 10
        },
        {
          "$limit": 5
        }
      ]
    }
  },
  {
    "$unwind": {
      "path": "$statistics"
    }
  }
]
```

## Data source

The application works with 3 collections and on each one of them the same operations would be made: the CRUD ones. To do so, I developed a generic class which works as a intermediate between the views and the data source. It's implementation is very simple: whenever a view requires to retrieve or modify some data from the source, it imports the corresponding instance of DataSource. Each instance is a Singleton corresponding to each collection of information and brings the necessary methods to perform the corresponding operations: from creating, modifying and seaching information or showing the results paginated and auto generating a collection table, which handles the creation, modification and deletion of documents.

```js
class DataSource {
  /**
   * @param options
   * @type string
   * 
   * Son las opciones que se pueden configurar:
   *  - perPage: number
   *  - sort: string // an array of columns comma separated with a preceding slash to indicate descendant
   * */
  configure(options = {}) {}

  /** 
   * @param data un objeto con las propiedades que se desean insertar en el nuevo elemento de la colección. 
   * @type object
   * 
   * Intenta crear un nuevo documento dentro de la colección con la información provista.
  */
  create(data) {}

  /**
   * @param id
   * @type document_id
   * 
   * Intenta eliminar el documento con la id coincidente.
   * */
  delete(id) {}

  /**
   * @param query La cadena de búsqueda, puede contener formato de expresión regular.
   * @type string
   * 
   * Intenta realizar una búsqueda con la cadena y las opciones establecidas.
   * */
  get(query) {}

  /**
   * @param id
   * @type document_id
   * 
   * Intenta devolver un único documento, coincidente con el id
   * */
  getById(id) {}

  /**
   * Dentro de la búsqueda actual, intenta obtener la primera página
   * */
  getFirst() {}

  /**
   * Dentro de la búsqueda actual, intenta obtener la última página
   * */
  getLast() {}

  /**
   * Dentro de la búsqueda actual, intenta obtener la próxima página
   * */
  getNext() {}

  /**
   * Dentro de la búsqueda actual, intenta obtener la página anterior
   * */
  getPrev() {}

  /**
   * Devuelve un elemento JSX.Element que puede ser insertado directamente en la vista y controlará la paginación de la búsqueda.
   * */
  Navigation = () => {};

  /**
   * Este evento es disparado cada vez que un error ocurre con alguna de las operaciones, el callback recibe como parámetro un mensaje de error que puede utilizar para informar al usuario en la vista.
   * */
  onError(callback) {}

  /**
   * Este evento se dispara cada vez que una operación se realiza correctamente, el callback recibe como parámetro los resultados obtenidos: si es una operación de eliminación, modificación o creación, indica cuántos documentos fueron alterados. Si es una operación de obtención, provee los datos obtenidos.
   * */
  onUpdate(callback) {}

  /**
   * Este método es muy útil para cuando una operación de modificación, eliminación o creación es realizada con éxito. Repite la última búsqueda y todas las vistas que estuvieran mostrando los resultados se actualizan. Incluso los elementos de navegación y paginación.
   * */
  repeatLastQuery() {}

  /**
   * @param id El id del documento que se desea modificar
   * @type object_id
   * 
   * @param data Los datos que se actualizarán en el documento
   * @type object
   * 
   * Intenta modificar el documento con la id coincidente.
  */
  update(id, data) {}
}
``` 
