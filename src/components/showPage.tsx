import * as React from "react";
import { translate } from "./../services/translate";
import Apps from "./apps";
import { Link } from "gatsby";

interface PageContext {
  content: string;
  fallbackLang?: boolean;
  label: string;
  order: string;
  relatives?: PageContext[];
  toc: string;
  url: string;
}

interface Relative {
  label: string;
  order: string;
  url: string;
  toc?: string;
}

export interface IShowPageProps {
  pageContext: PageContext;
}

class RelativesStorage {
  relativesRoutes: Relative[] = [];

  constructor(pageContext: PageContext) {
    this.relativesRoutes.push({
      label: pageContext.label,
      order: pageContext.order,
      url: pageContext.url,
      toc: pageContext.toc,
    });

    if (pageContext.relatives)
      for (let relative of pageContext.relatives) {
        this.relativesRoutes.push({
          label: relative.label,
          order: relative.order,
          url: relative.url,
        });
      }

    this.relativesRoutes.sort((a, b) => a.order.localeCompare(b.order));
  }

  render(): JSX.Element {
    return (
      <ul>
        {this.relativesRoutes.map(relative => (
          <li key={relative.order}>
            <Link to={relative.url}>{relative.label}</Link>
            {relative.toc && (
              <div dangerouslySetInnerHTML={{ __html: relative.toc }}></div>
            )}
          </li>
        ))}
      </ul>
    );
  }
}

export default class ShowPage extends React.Component<IShowPageProps> {
  locationChangeSuscription: any;

  componentDidMount() {
    document.addEventListener("click", this.closeToc);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.closeToc);
  }

  closeToc = () => {
    this.setState({ asideClassName: "" });
  };

  state = {
    asideClassName: "",
  };

  render() {
    const TOC = new RelativesStorage(this.props.pageContext);
    const context = this.props.pageContext;
    return (
      <>
        {context.fallbackLang && (
          <div className="notification">{translate("Fallback_language")}</div>
        )}
        {context.url.match(/\/apps$/) ? (
          <Apps />
        ) : (
          <>
            <aside className={`${this.state.asideClassName} table-of-contents`}>
              <h3
                onClick={ev => {
                  ev.stopPropagation();
                  this.setState({
                    asideClassName:
                      this.state.asideClassName === "" ? "show" : "",
                  });
                }}
              >
                {translate("Toc")}
              </h3>
              <div>{TOC.render()}</div>
            </aside>
            <section className="markdown-content">
              <div dangerouslySetInnerHTML={{ __html: context.content }}></div>
            </section>
          </>
        )}
      </>
    );
  }
}
