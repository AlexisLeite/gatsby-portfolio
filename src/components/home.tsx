import * as React from "react";
import { translate } from "../services/translate";

export interface IIndexProps {}

export default class Index extends React.Component<IIndexProps> {
  public render() {
    return (
      <section id="main-banner">
        <h1>Bienvenidos</h1>
      </section>
    );
  }
}
