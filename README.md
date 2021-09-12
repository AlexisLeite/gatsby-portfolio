# gatsby-portfolio

The whole project is made in typescript.

The node-services folder includes some very interesting codes made by me such as gatsby-node.ts and multiLanguageStore.ts. In those files the whole process of translating the different documentations is made, using the markdown files as its source, and the different language routes as output. Additionally, there is a file "translate.ts" which offers the possibility of translate phrases in any language, using a dictionary source file to accomplish the process.

The /src/components/navigation.tsx is very interesting as well. The whole navigation menu is made using the different language routes as source, outputing a dropdown menu which exposes all the available routes which can be of any depth.

The /src/components/showPage.tsx exposes the method of creation of the table of contents on every page. It shows all the titles in the current page but the main title of the related pages as well.
