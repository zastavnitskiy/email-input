import "./index.css";

declare global {
  interface Window {
    EmailsInput: any;
  }
}

interface Subscriber {
  (values: string[]): void;
}

interface SimpleHTMLElementAttributes {
  [key: string]: string;
}

type PartialHTMLElement = Partial<HTMLElement>;

class Model {
  private data: string[];
  private subscribers: Subscriber[];

  constructor(values: string[]) {
    this.data = values.map(value => value.trim()).filter(Boolean);
    this.subscribers = [];
  }

  private processRawInput(rawInput: string): string[] {
    const values = rawInput
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    return values;
  }

  addValue(value: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      try {
        const cleanValues = this.processRawInput(value);
        this.data = [...this.values, ...cleanValues];
      } catch (e) {
        reject("Failed to add new values");
      }

      try {
        this.notifySubscribers();
      } catch (e) {
        // this is ok
      }

      resolve(this.values);
    });
  }

  deleteValue(value: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      try {
        this.data = this.data.filter(existingValue => existingValue !== value);
      } catch (e) {
        reject("Failed to delete");
      }

      try {
        this.notifySubscribers();
      } catch (e) {
        // this is ok
      }

      resolve(this.data);
    });
  }

  private notifySubscribers() {
    this.subscribers.forEach(subscriber => {
      subscriber(this.values);
    });
  }

  public get values(): string[] {
    return this.data;
  }

  public subscribe(subscriber: Subscriber) {
    this.subscribers = [...this.subscribers, subscriber];
    subscriber(this.values);
    return () =>
      (this.subscribers = this.subscribers.filter(
        existingSubscriber => existingSubscriber !== subscriber
      ));
  }
}

class ListRenderer {
  private container: HTMLDivElement;
  private values: string[];
  private nodes: Map<string, HTMLDivElement>;

  constructor(node: HTMLDivElement, values: string[]) {
    this.container = node;
    this.values = values;
    this.nodes = new Map();
  }

  private createValueElement(value: string): HTMLDivElement {
    const node = document.createElement("div");
    node.classList.add("interactive-input-value");
    node.innerText = value;

    const deleteBtn = document.createElement("input");
    deleteBtn.value = "×";
    deleteBtn.type = "button";
    deleteBtn.name = "delete-value";
    deleteBtn.classList.add("interactive-input-delete-btn");
    deleteBtn.dataset["value"] = value;
    node.appendChild(deleteBtn);
    return node;
  }

  public update(values: string[]) {
    const valuesSet = new Set(values);

    values.forEach(value => {
      if (!this.nodes.has(value)) {
        const node = this.createValueElement(value);
        this.nodes.set(value, node);
        this.container.appendChild(node);
      }
    });

    this.nodes.forEach((node, value) => {
      if (!valuesSet.has(value)) {
        this.container.removeChild(node);
        this.nodes.delete(value);
      }
    });
  }
}

window.EmailsInput = class EmailsInput {
  // private values: string[]
  private node: HTMLDivElement;
  private interactiveInputContainer: HTMLDivElement;
  private interactiveInput: HTMLDivElement;

  private textInput: HTMLInputElement;

  private model: Model;
  private renderer: ListRenderer;

  public constructor(node: HTMLDivElement, options = {}) {
    this.node = node;

    const children: HTMLInputElement[] = Array.from(
      node.querySelectorAll('input[name="email"]')
    );

    const valuesFromHTML = children.map(child => child.value);
    const valueNodes = children;

    /** Prepare interactive HTML markup */
    this.node.classList.add("interactive-input-host");

    this.interactiveInputContainer = document.createElement("div");
    this.interactiveInputContainer.classList.add("interactive-input-container");
    this.node.appendChild(this.interactiveInputContainer);

    valueNodes.forEach(child => child.setAttribute("hidden", "hidden"));

    this.interactiveInput = document.createElement("div");
    this.interactiveInput.className = "interactive-input";
    this.interactiveInputContainer.appendChild(this.interactiveInput);

    this.textInput = document.createElement("input");
    this.textInput.name = "text-input";
    this.textInput.type = "text";
    this.textInput.className = "text-input";
    this.textInput.placeholder = "add more people...";
    this.interactiveInputContainer.appendChild(this.textInput);

    /** Init data-model and prepare for interactivity */
    this.model = new Model(valuesFromHTML);
    this.renderer = new ListRenderer(this.interactiveInput, this.model.values);
    this.model.subscribe(values => this.renderer.update(values));
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
        this.deleteValue(email);
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

        this.addValue(target.value).then(() => {
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
      this.addValue(target.value);
      target.value = "";
    }
  }

  private handleFocusOutEvent(event: FocusEvent) {
    if (!event.target) {
      return;
    }

    const target = event.target as HTMLInputElement;

    if (target.name === "text-input") {
      this.addValue(target.value);
      target.value = "";
    }
  }

  public addValue(rawInput: string): Promise<string[]> {
    return this.model.addValue(rawInput);
  }

  public deleteValue(valueToDelete: string): Promise<string[]> {
    return this.model.deleteValue(valueToDelete);
  }

  public getCount(): number {
    return this.model.values.length;
  }

  public getValues(): string[] {
    return this.model.values;
  }

  public subscribe(subscriber: Subscriber) {
    return this.model.subscribe(subscriber);
  }
};
