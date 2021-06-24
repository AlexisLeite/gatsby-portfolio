---
title: "Detalles programáticos de la aplicación Matemágica"
label: "Detalles programáticos"
index: 1
---

# Detalles programáticos

Esta fue la primera aplicación que desarrollé de cabo a rabo y por tanto la tecnología empleada fue sencilla en el sentido de que solamente desarrollé código en los lenguajes más elementales, sin el uso de frameworks: javascript, html y php. Sin embargo, hay detalles del código que me parecen bien interesantes a pesar de no aprovechar las tecnologías modernas.

Por un lado, todo el código de scripts estaba completamente encapsulado, a pesar de no contar con las ventajas de ES5 o de un traspilador como Babel. Para lograrlo, me alcanzó un código sencillo desarrollado en PHP.

Cuando un cliente realiza una petición a la aplicación, ésta carga un script en el header que apunta hacia */script.js*, el detalle que no conoce es que en realidad esta petición está redireccionada hacia un módulo php llamado scripter, que se encarga de realizar un bootstrap a través de los distintos fragmentos y devolver un código unificado listo para usar. Las ventajas de esto son muy evidentes, las más destacables seguramente sean la facilidad de depuración y la escalabilidad que ofrecen.

![](./images/scripter-boot-conf.png)

Otro aspecto importante es que la aplicación contaba con un script llamado templater, que evidentemente se encarcaba de proveer funcionalidad de plantillas a la misma. Cuando un "profesor" requería una plantilla para desarrollar el contenido, no hacía más que realizar un pedido, el cual era respondido con una función que al recibir los datos que se iban a embeber en la plantilla devolvía el código HTML listo para ser usado. Combinando esta funcionalidad con el scripter, que se encargaba de juntar todo a la hora de servir el script al cliente, se lograba una funcionalidad muy interesante: El cliente recibía todos los scripts con las plantillas necesarias ya pre-cargadas, básicamente no tenía que realizar casi llamadas posteriores al servidor.

Para saber más sobre el templater, puedes hacer clic [aquí.](/apps/matemagica/templater)


## Aspectos que podrían haber sido mejorados

En su momento esta aplicación me sirvió como una herramienta para mejorar el desempeño de nuestro niño en la escuela y eso fue todo lo que esperaba, como mencioné el tiempo libre que tenía era muy poco y luego de desarrollada un área de la aplicación procuré no volver a ella a no ser que fuese estrictamente necesario. 

Sin embargo, desde el punto de vista técnico hay varios aspectos que me hubiese gustado mejorarle para lograr una mayor eficiencia:

1. Los parsers son llamados uno a uno con todo el contenido de un script como parámetro y devuelven el script modificado. Para ello realizan una búsqueda con expresiones regulares y reemplazan lo que generalmente se llama como *azúcar sintáctica* por contenido utilizable en la ejecución del script. Esto es muy ineficiente sobre todo si se procesan scripts largos. **Una forma de mejorarlo** podría haber sido declarar las expresiones regulares de búsqueda de cada parser de forma pública y que fuese el scripter quien decidiera qué parsers habría que llamar en cada situación. De esta forma sería posible iterar una única vez sobre cada documento.

2. En línea con lo anterior, creo que una muy buena forma de mejorar la aplicación hubiese sido utilizando un método de compilación o de cacheo. Actualmente la aplicación ejecuta todos los procesos de parseo y compilación con cada llamada al servidor. Esto es ciertamente muy ineficiente y hubiese liberado muchísima carga en el servidor si hubiese implementado un sistema de este tipo.

3. La aplicación no se desarrolló para que fuese multilíngüe ni responsiva. Hoy en día es bien sabido que toda aplicación que pretenda correr en un entorno web debe ser responsiva y adaptarse a múltiples dispositivos. Esta no fue mi intención al crear esta aplicación ya que solamente sería utilizada por nuestro niño y yo sabía a ciencia cierta que lo haría desde una pc. 

4. Una cosa que me hubiese encantado añadir pero luego no me lo permitieron las circunstancias es que la aplicación llevara un rastreo de las actividades de cada usuario y realizara recomendaciones de acuerdo al rendimiento y las necesidades del mismo.|

## Azúcar sintáctica

Ya que los scripts son pre-procesados en PHP, me tomé la libertad de definir ciertos aspectos que se comportan como azúcar sintáctico a la hora de declarar los mismos. Existen ciertas líneas que no son propias de javascript pero que pueden ser utilizadas dentro de la aplcación para definir comportamiento personalizado como *require* o *$@Template*. Además, es posible también añadir más comandos personalizados mediante la adición de lo que llamé parsers.

### Añadir parsers

Basta con crear un fichero dentro del directorio parsers y declarar allí una clase con el mismo nombre que el fichero pero cuyo nombre comience con mayúsculas para que el scripter lo utilice. Dicha clase debe contar con un método público llamado parse con la firma **parse($text:String):String**. 

### require "scriptName";

Cuando un script es solicitado, es preprocesado por scripter.php que lee el contenido del mismo y busca referencias a otros archivos. Es muy similar a lo que babel hace en ES5 con require: si el script aún no ha sido incluido lo incluye de forma que sus declaraciones estén disponibles cuando el script actual se ejecute.

### $@Template "nombrePlantilla, nombreOtraPlantilla";

Cuando esta sentencia es declarada se sustituye por una llamada a templater de forma que la plantilla esté disponible dentro de this.templates cuando el script la requiera.

## Interacción entre las entidades

### Mate 

Es la unidad coordinadora encargada de generar el listado de los profesores disponibles y permitir que el usuario genere ejercicios. Para ello ofrece un menú en donde cada elemento es un botón que al ser presionado ofrece un cuadro de diálogo para modificar los parámetros que serán pasados al profesor. Una vez que el diálogo ha sido aceptado se crea una nueva instancia de la clase Profesor, pasándole como argumentos el elemento del DOM donde deberá desarrollar su tarea y la configuración obtenida.

El profesor generará la vista y en ella estarán los cuadros de texto donde se introducirán las respuestas. Mate recibirá referencias a estos cuadros y controlará los cambios esperando la interacción del usuario. Cuando un cuadro reciba una respuesta lo marcará de acuerdo a si es correcta o no, de forma que el nombre de la clase se actualice y muestre un color verde o rojo básicamente.

Cada ejercicio generado será guardado en el localStorage del equipo para prevenir cierres o actualizaciones de la página involuntarias, de forma que si el usuario cierra el navegador pueda seguir con los ejercicios más tarde. Una vez que un ejercicio recibe todas las respuestas correctas es eliminado el storage.

### Profesor

Es una clase que representa la abstracción de todas las entidades que ofrecen ejercicios dentro de la aplicación. Ésta establece las bases para que todos los ejercicios puedan ser desarrollados con coherencia respecto a Mate de forma de establecer un patrón de relacionamiento interno que permita manejar el flujo de información de forma correcta.

Esta clase debe ser extendida cada vez que se desee agregar un nuevo tipo de ejercicios a la aplicación. Ofrece varias utilidades comunes a todas las tareas y su implementación debería ser muy sencilla. A continuación se exhibe el API que la misma ofrece y detalles sobre su utilización, utilizando como ejemplo la clase Cuentas que se encarga actualmente de ese tipo de ejercicios- Primero veamos el código sin comentarios para ver la sencillez del mismo y luego con comentarios explicando cada parte del mismo:

#### Utilización sin comentarios

```js
class Cuentas extends Profesor {
  static info = {
    nombre: "Cuentas",
    breve: "Realiza las siguientes cuentas",
  }
  
  static required = {
    cantidad: { title: 'Cantidad de operaciones', type: 'number' , default: 12, max: 40, min: 4},
    cifrasSuma: { title: 'Cifras de suma', type: 'number', default: 5, max: 6, min: 1 },
    cifrasResta: { title: 'Cifras de resta', type: 'number', default: 4, max: 6, min: 1 },
    cifrasDivision: { title: 'Cifras de división', type: 'number', default: 1, max: 6, min: 1 },
    cifrasMultiplicacion: { title: 'Cifras de multiplicación', type: 'number', default: 3, max: 6, min: 1 },
    restaNegativo: {title: '¿Resta negativo?', type: 'check', default: false }
  }
  
  init() {
    $@Templates "cuentas";
    
    this.addPreloader(this.makeData);
  }
  
  makeData(resolve) {  
    let operadores = ['-', '+', '*', '/'], cantidad = this.conf.cantidad;

    let revive = [];
    for(let i=0; i < cantidad; i++) {
      let operador = operadores[cantidad % operadores.length]; 

      let a = Math.random() * (10**this.conf.cifrasSuma), b = 10;
      switch(operador) {
        case '+':
          b = b ** this.conf.cifrasSuma;
          break;
        case '-':
          b = b ** this.conf.cifrasResta;
          break;
        case '*':
          b = b ** this.conf.cifrasMultiplicacion;
          break;
        case '/':
          b = b ** this.conf.cifrasDivision;
          break;        
      }
      b = parseInt(Math.random() * b);
      revive.push({a,b,operador});
    }
    
    this.set(revive);
    resolve();
  }
  
  buildView() {
    let template = this.tempates.cuentas(), operadores = ['+','x','-','/'];

    for(let cuenta of this.data) {
      let {a, b, operacion} = cuenta;
      
      let plantillaCuenta = template.cuenta({A:a, B:b, operacion: operadores[operacion]});
      
      this.append(plantillaCuenta);
      
      this.push({
        text: cuenta.find('input'),
        answer: this.resolve(a,b,operacion)
      })
    }
  }

  resolve(a, b, operacion) {
    return eval(`${a} ${operacion} ${b}`);
  }
}

```

#### Utilización con comentarios

```js
class Cuentas extends Profesor {
  /**
   * @static info
   * 
   * Esta propiedad debe ser modificada para establecer la información pública de la entidad que se está desarrollando. Mate tomará las propiedades *nombre* y *breve* de info para mostrar al usuario.
   * 
   * */
  static info = {
    nombre: "Cuentas",
    breve: "Realiza las siguientes cuentas",
  }

  /**
   * @static required
   * 
   * La propiedad estática required es utilizada por mate para establecer el cuadro de diálogo de configuración.
   * 
   * Cada clave de este objeto será un parámetro de configuración disponible para el usuario. Así mismo cada clave será también un objeto indicando el tipo, los márgenes y el título a utilizar para cada propiedad configurable.
   * 
   * */
  static required = {
    cantidad: { title: 'Cantidad de operaciones', type: 'number' , default: 12, max: 40, min: 4},
    cifrasSuma: { title: 'Cifras de suma', type: 'number', default: 5, max: 6, min: 1 },
    cifrasResta: { title: 'Cifras de resta', type: 'number', default: 4, max: 6, min: 1 },
    cifrasDivision: { title: 'Cifras de división', type: 'number', default: 1, max: 6, min: 1 },
    cifrasMultiplicacion: { title: 'Cifras de multiplicación', type: 'number', default: 3, max: 6, min: 1 },
    restaNegativo: {title: '¿Resta negativo?', type: 'check', default: false }
  }

  /**
   * @method init(): void
   * 
   * Aquí se establecerán las bases de la clase, indicando a la aplicación qué plantillas son necesarias para el desarrollo de la vista y qué preloaders son necesarios para el desarrollo de la información.
   * 
   * */
  init() {
    // Se indica que la plantilla de nombre "cuentas" debe estar disponible para el desarrollo de la vista
    $@Templates "cuentas";

    // Agrega el método makeData de la clase como preloader, más detalles sobre preloaders más abajo.
    this.addPreloader(this.makeData);
  }
  
  // Esta función es específica de la clase Cuentas, en ella se crean las cuentas específicas para la configuración establecida por el usuario. Para detalles de implementación ver el repositorio en github.

  // A continuación se exponen los recursos disponibles para cualquier preloader con un ejemplo ilustrativo
  makeData(resolve) {  
    let operadores = ['-', '+', '*', '/'];

    // La propiedad this.conf existe ya que Mate y la clase padre Profesor la generaron a partir del parámetro required establecido en la clase y su contenido es el resultado del cuadro de diálogo mostrado al usuario.
    let cantidad = this.conf.cantidad;

    let revive = [];
    for(let i=0; i < cantidad; i++) {
      let operador = operadores[cantidad % operadores.length]; 

      let a = Math.random() * (10**this.conf.cifrasSuma), b = 10;
      switch(operador) {
        case '+':
          b = b ** this.conf.cifrasSuma;
          break;
        case '-':
          b = b ** this.conf.cifrasResta;
          break;
        case '*':
          b = b ** this.conf.cifrasMultiplicacion;
          break;
        case '/':
          b = b ** this.conf.cifrasDivision;
          break;        
      }
      b = parseInt(Math.random() * b);
      revive.push({a,b,operador});
    }

    // El método set indica a Mate que este objeto debe ser usado para restaurar el ejercicio en caso de que el navegador se cierre por ejemplo.
    this.set(revive);

    // Una vez que se haya terminado de generar la información necesaria para desarrollar el ejercicio, se debe llamar a resolve para que la aplicación continúe el proceso de renderizado.
    resolve();
  }

  /**
   * @method buildView
   * 
   * La implementación de este método debe dar como resultado una vista funcional.
   * 
   * */
  buildView() {
    // La plantilla cuentas fue declarada en el método init. Existe ya que esto en verdad es un atajo en el lenguaje que indica a la aplicación que dicha plantilla debe ser cargada y colocada dentro de la propiedad this.templates

    // Dicha propiedad contendrá todas las plantillas que sean declaradas. El detalle de utilización puede encontrarse en la sección de templater
    let template = this.tempates.cuentas();

    let operadores = ['+','x','-','/'];

    // this.data existe y contiene la información pasada en this.set() en los preloaders. No se establece la información directamente desde los preloaders ya que en realidad se puede alcanzar el método buildView desde una acción de usuario específica (crear nuevo ejercicio) o desde una restauración, cuando el navegador se cerró por accidente por ejemplo.
    for(let cuenta of this.data) {
      let {a, b, operacion} = cuenta;

      // Aquí se está creando una instancia de la propiedad de repetición cuenta de la plantilla cuentas y se le pasan los argumentos a, b y operacion. Ver declaración de la plantilla más abajo.
      let plantillaCuenta = template.cuenta({A:a, B:b, operacion: operadores[operacion]});

      // El método this.append agrega el resultado obtenido de la operación anterior al cuerpo del ejercicio
      this.append(plantillaCuenta);

      // El método this.push agrega una referencia a un cuadro de texto con su correspondiente respuesta. La respuesta puede ser bien un valor o una función, en cuyo caso se tomará el valor de retorno de la función como respuesta correcta.
      // El mismo recibe como parámetro un objeto con las propiedades text que hace referencia a el elemento input del DOM y answer cuyo valor ya fue aclarado en el comentario previo.
      this.push({
        text: cuenta.find('input'),
        answer: this.resolve(a,b,operacion)
      })
    }
  }

  resolve(a, b, operacion) {
    // Esta implementación es un poco simplista pero funciona para el caso. De acuerdo a la lógica de la clase actual, a y b siempre serán números enteros y operación siempre será un valor entre '+', '-', '/', '*'
    return eval(`${a} ${operacion} ${b}`);
  }
}

```

De esta forma es posible crear clases que ofrezcan ejercicios de toda índole, donde las resoluciones se puedan hacer mediante cuadros de texto. Mate tomará las respuestas dadas en cada uno de ellos y los comparará con la respuesta esperada por el profesor, dándola por correcta si coincide. Una vez que todas las respuestas sean correctas, el ejercicio se dará por terminado.

Cabe mencionar que en verdad el profesor mostrado en el ejemplo es uno de los más sencillos pero la implementación puede ser de cualquier complejidad. Entre los ejercicios ofrecidos existen por ejemplo el de aprender al hora, que utiliza un canvas para dibujar un reloj de acuerdo a los datos desarrollados en los preloaders o el de geometría, que utiliza un web worker para calcular los polígonos que se pedirá al usuario que dibuje. Esto es así gracias a la utilización de promesas como base de los preloaders.