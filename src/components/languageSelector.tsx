import * as React from "react";
import { navigate } from "gatsby";

export interface ILanguageSelectorProps {
  alternateLanguages: { [key: string]: string };
  id: string;
  lang: string;
}

export default class LanguageSelector extends React.Component<ILanguageSelectorProps> {
  public render() {
    return (
      <div id="language-selector" className="custom-select">
        <select
          onChange={ev => {
            navigate(this.props.alternateLanguages[ev.target.value]);
          }}
        >
          <option value={this.props.lang} key={this.props.lang}>
            {this.props.lang.toUpperCase()}
          </option>
          {Object.keys(this.props.alternateLanguages).map(lang => (
            <option value={lang} key={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
    );
  }
}
