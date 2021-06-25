import * as React from "react";
import { Link } from "gatsby";
import { ucFirst } from "./../services/common";
import LanguageSelector from "./languageSelector";
import { Path, TypedObject } from "../../node-services/types";
import { translate } from "../services/translate";

interface NavigationProps {
  paths: Path[];
  alternateLanguages: { [key: string]: string };
  lang: string;
}

interface pathProperties {
  children?: { [key: string]: pathProperties };
  label?: string;
  url?: string;
  order: string;
  target?: string;
}

class menuTree {
  children: { [key: string]: menuTree } = {};
  group: string | undefined;
  label = "";
  order = "";
  id = "";
  url = "";
  target = "";

  constructor(props: pathProperties) {
    Object.assign(this, props);
    this.id = ucFirst(props.order.split("/").pop() as string);

    if (this.label === "") {
      this.label = translate(ucFirst(props.order.split("/").pop() as string));
    }
  }

  add(props: pathProperties, debug: null | true = null) {
    props = { ...props };
    let currentPath = props.order.split("/");
    let currentDir = currentPath.shift();
    props.order = currentPath.join("/");

    if (currentDir === "index") {
      Object.assign(this, {
        label: props.label,
        url: props.url,
      });
    } else if (currentDir === "") {
      Object.assign(this, props);
    } else if (typeof currentDir === "string") {
      if (!(currentDir in this.children)) {
        this.children[currentDir] = new menuTree({
          order: `${this.order}/${currentDir}`,
        });
      }
      this.children[currentDir].add(props, true);
    }
  }

  print(
    props: { className?: string; id?: string; siblings?: JSX.Element[] } = {}
  ): JSX.Element {
    let siblings = props.siblings;
    delete props["siblings"];

    let Display = null;
    if (this.label !== "" && this.url === "") {
      Display = (
        <span key={this.order} className="menu-item">
          {ucFirst(this.label)}
        </span>
      );
    } else if (this.label !== "" && this.url !== "") {
      Display = (
        <Link key={this.url} to={`${this.url}`}>
          {ucFirst(this.label)}
        </Link>
      );
    }

    let menuItems = [];
    if (Object.keys(this.children).length > 0) {
      for (let childName in this.children) {
        const child = this.children[childName];
        menuItems.push(child.print());
      }
    }

    return (
      <li {...props} key={`${this.url}-li`}>
        {Display}
        {menuItems.length > 0 && (
          <ul key={`${this.url}-ul`}>{menuItems.map(item => item)}</ul>
        )}
        {siblings && siblings.map(sibling => sibling)}
      </li>
    );
  }
}

var MenuItems: null | JSX.Element[] = null;
var prevLang: string | null = null;

var lastScrollPosition = 100;

export default class Navigation extends React.PureComponent<NavigationProps> {
  componentDidMount() {
    document.addEventListener("scroll", this.updateNavClassByScroll);
    document.addEventListener("mousemove", this.updateNavClassByMouseMove);
  }

  componentWillUnmount() {
    document.removeEventListener("scroll", this.updateNavClassByScroll);
    document.body.removeEventListener(
      "mousemove",
      this.updateNavClassByMouseMove
    );
  }

  updateNavClassByMouseMove = (ev: any) => {
    if (parseInt(ev.clientY) < window.innerHeight / 2)
      this.updateNavClassByScroll(true);
  };

  updateNavClassByScroll = (ev: any) => {
    let navBar = document.getElementById("Main-navigation");

    if (
      ev === true ||
      (lastScrollPosition > window.scrollY && navBar!.className === "hidden")
    ) {
      navBar!.className = "";
    }

    if (
      ev === false ||
      (lastScrollPosition < window.scrollY && navBar!.className === "")
    ) {
      navBar!.className = "hidden";
    }

    lastScrollPosition = window.scrollY;
  };

  render() {
    prevLang = this.props.lang;
    let root = new menuTree({ label: "", order: "" });
    for (let path of this.props.paths) {
      root.add(path);
    }

    let noGroup: menuTree[] = [];
    let groups: TypedObject<menuTree[]> = {};
    Object.values(root.children).forEach(child => {
      if (child.group) {
        if (!groups[child.group]) groups[child.group] = [];
        groups[child.group].push(child);
      } else {
        noGroup.push(child);
      }
    });
    let grouped = Object.keys(groups).map(groupName => (
      <ul key={groupName} id={groupName}>
        {groups[groupName].map(child => child.print())}
      </ul>
    ));
    let noGrouped = noGroup.map(child => {
      return child.print({ id: child.id });
    });
    MenuItems = [...noGrouped, ...grouped];

    return (
      <nav
        onFocusCapture={() => {
          this.updateNavClassByScroll(true);
        }}
      >
        <ul id="Main-navigation">
          <ul>
            <li>
              <a
                href="http://www.uyucode.net/app/matemagica"
                target="blank"
                title={translate("Matemagica title")}
              >
                {translate("Matemagica")}
              </a>
            </li>
            <li>
              <a
                href="http://www.uyucode.net/app/chat"
                target="blank"
                title={translate("Chat title")}
              >
                {translate("Chat")}
              </a>
            </li>
            <li>
              <a
                href="http://www.uyucode.net/app/clienter"
                target="blank"
                title={translate("Clienter title")}
              >
                {translate("Clienter")}
              </a>
            </li>
            <li>
              <a
                href="http://www.uyucode.net/app/tic tac toe"
                target="blank"
                title={translate("Tictactoe title")}
              >
                {translate("Tic tac toe")}
              </a>
            </li>
          </ul>
          {MenuItems}
          <li>
            <LanguageSelector
              key="language"
              id="language-selector"
              alternateLanguages={this.props.alternateLanguages}
              lang={this.props.lang}
            />
          </li>
        </ul>
      </nav>
    );
  }
}
