const { setTranslationsSource } = require("./src/services/translate");
const React = require("react");
const Layout = require("./src/components/layout").default;

exports.wrapPageElement = ({ element, props }) => {
  setTranslationsSource(props.pageContext.translations);
  return <Layout {...props}>{element}</Layout>;
};
