import * as React from "react";
import { TranslationSource } from "../../node-services/types";

export interface IAboutProps {
  pageContext: {
    translations: TranslationSource;
  };
}

export default class About extends React.Component<IAboutProps> {
  public render() {
    console.log(this.props.pageContext);
    return <div>{this.props.pageContext.translations["sobre mi"]}</div>;
  }
}
