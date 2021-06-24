import React from "react";
import Navigation from "./navigation";
import "./styles/styles.sass";
import Seo from "./seo";
import { MultiLanguagePage } from "../../node-services/types";
import { translate } from "./../services/translate";

export default class Layout extends React.Component<{
  pageContext: MultiLanguagePage;
}> {
  constructor(props: { pageContext: MultiLanguagePage }) {
    super(props);
  }

  componentDidMount() {
    document.addEventListener("scroll", this.updateGoUpClassNameByScroll);
  }

  componentWillUnmount() {
    document.removeEventListener("scroll", this.updateGoUpClassNameByScroll);
  }

  updateGoUpClassNameByScroll = () => {
    if (window.scrollY < 50) {
      document.getElementById("GoUpButton")!.className = "hidden";
    } else {
      document.getElementById("GoUpButton")!.className = "";
    }
  };

  render() {
    if (Object.keys(this.props.pageContext).length === 0) return "";
    const context = this.props.pageContext;
    return (
      <div id="Layout">
        <Seo title={context.title} description={context.description} />
        <Navigation
          paths={context.paths}
          alternateLanguages={context.alternateLanguages}
          lang={context.lang}
        />
        <main>{this.props.children}</main>
        <aside id="GoUpButton">
          <button
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            {translate("Go up")}
          </button>
        </aside>
      </div>
    );
  }
}
