---
title: "Detalles programáticos de Clienter"
label: "Detalles programáticos"
index: 1
---

# Detalles programáticos

Durante el desarrollo de esta aplicación me encontré en la obligación de desarrollar algunos algoritmos que me parecen muy interesantes:

## Búsquedas

Las búsquedas se rigen por un algoritmo de agregación automático que responde a la declaración dada por un array de campos. Lo destacable de esto es que la búsqueda es capaz de obtener resultados para una búsqueda incluso cuando los campos coincidentes se encuentren en una colección relacionada. Por ejemplo: La colección *clients* tiene un campo *virtual* llamado *orders*. La declaración de búsqueda es la siguiente:

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

Nótese que en realidad la función **mongooseSearch** es de mi autoría. El resultado de ejecutar esta función es que se va a crear una ruta en /orders y el verbo GET que ejecutará la siguiente agregación en la base de datos, cuando se llame a la ruta /orders?perPage=5&page=2&sort=name&q=notebook%20rota

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

Como la aplicación iba a trabajar con 3 colecciones a las que se les harían las mismas operaciones, es decir las operaciones **CRUD**, desarrollé una clase genérica que se funciona como intermediario entre las vistas y la fuente de datos. La utilización resultó ser muy sencilla: cuando una viste requiere trabajar con una colección importa desde el archivo data.js ubicado dentro del directorio services la instancia correspondiente. Cada una de ellas se comporta como un *Singleton* dentro de la aplicación y está preconfigurada con las opciones comunes a esa colección: resultados por página, órden de los mismos.

Cada una de estas instancias ofrece todas las funcionalidades necesarias para realizar las operaciones CRUD, aquí se ofrece el api de DataSource:

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
