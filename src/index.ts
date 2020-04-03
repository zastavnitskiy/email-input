import "./index.css";
import { Item, Model, Subscriber } from "./Model";
import { View } from "./View";

declare global {
  interface Window {
    EmailsInput: any;
  }
}

window.EmailsInput = class EmailsInput {
  private node: HTMLDivElement;
  private interactiveInputContainer: HTMLDivElement;

  private model: Model;
  private view: View;

  public constructor(node: HTMLDivElement, options = {}) {
    this.node = node;

    const children: HTMLInputElement[] = Array.from(
      node.querySelectorAll('input[name="email"]')
    );

    /** Read values from html and disable existing inputs */
    const valuesFromHTML = children.map(child => child.value);
    children.forEach(child => {
      child.setAttribute("hidden", "hidden");
      child.setAttribute("disabled", "disabled");
    });

    /** Prepare interactive HTML markup */
    this.node.classList.add("interactive-input-host");

    this.interactiveInputContainer = document.createElement("div");
    this.interactiveInputContainer.classList.add("interactive-input-container");
    this.node.appendChild(this.interactiveInputContainer);

    /** Init data-model and prepare for interactivity */
    this.model = new Model(valuesFromHTML);
    this.view = new View(this.interactiveInputContainer, this.model.items);

    this.model.subscribe(items => this.view.update(items));
    this.node.addEventListener("focusout", this.handleFocusOutEvent.bind(this));
    this.node.addEventListener("keydown", this.handleKeydownEvent.bind(this));
    this.node.addEventListener("click", this.handleClick.bind(this));
    this.node.addEventListener("input", this.handleInputEvent.bind(this));
  }

  private handleClick(event: MouseEvent) {
    if (!event.target) {
      return;
    }

    const target = event.target as HTMLButtonElement;

    if (target.name === "delete-value") {
      event.preventDefault();
      const email = target.dataset["value"];

      if (email) {
        this.deleteItem(email);
      }
    }
  }

  private handleKeydownEvent(event: KeyboardEvent) {
    if (!event.target) {
      return;
    }

    const target = event.target as HTMLInputElement;
    const keyCode = event.keyCode;

    if (target.name === "text-input") {
      if (keyCode === 13) {
        event.preventDefault();

        this.addItem(target.value).then(() => {
          target.value = "";
        });
      }
    }
  }

  private handleInputEvent(event: Event) {
    if (!event.target) {
      return;
    }

    const target = event.target as HTMLInputElement;
    const value = target.value;
    if (target.name === "text-input" && value.trim().endsWith(",")) {
      this.addItem(target.value);
      target.value = "";
    }
  }

  private handleFocusOutEvent(event: FocusEvent) {
    if (!event.target) {
      return;
    }

    const target = event.target as HTMLInputElement;

    if (target.name === "text-input") {
      this.addItem(target.value);
      target.value = "";
    }
  }

  public addItem(rawInput: string): Promise<Item[]> {
    return this.model.addItem(rawInput);
  }

  public deleteItem(valueToDelete: string): Promise<Item[]> {
    return this.model.deleteItem(valueToDelete);
  }

  public getAll(): string[] {
    return this.model.items.map(({ value }) => value);
  }

  public replaceAll(values: string[]) {
    Promise.all(
      this.getAll().map(value => this.model.deleteItem(value))
    ).then(() => Promise.all(values.map(value => this.model.addItem(value))));
  }

  public subscribe(subscriber: Subscriber) {
    return this.model.subscribe(subscriber);
  }
};
