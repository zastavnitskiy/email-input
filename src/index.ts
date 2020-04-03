import "./index.css";

declare global {
  interface Window {
    EmailsInput: any;
  }
}

interface Subscriber {
  (values: Value[]): void;
}

interface Value {
  valid: boolean,
  value: string
}

class Model {
  private data: Value[];
  private subscribers: Subscriber[];

  constructor(values: string[]) {
    this.data = this.createValues(values);
    this.subscribers = [];
  }

  private createValues(values: string[]): Value[] {
    return values.map(value => value.trim()).filter(Boolean).map(text => this.createValue(text))
  }

  private createValue(value: string): Value {
    return {
      valid: this.validate(value),
      value
    }
  }

  private validate(text: string): boolean {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(text.toLowerCase());
  }

  private processRawInput(rawInput: string): string[] {
    const values = rawInput
      .split(",")

    return values;
  }

  addValue(value: string): Promise<Value[]> {
    return new Promise((resolve, reject) => {
      try {
        const cleanValues = this.createValues(this.processRawInput(value));
        this.data = [...this.data, ...cleanValues];
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

  deleteValue(value: string): Promise<Value[]> {
    return new Promise((resolve, reject) => {
      try {
        this.data = this.data.filter(existingValue => existingValue.value !== value);
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

  public get values(): Value[] {
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

class View {
  private container: HTMLDivElement;
  private nodes: Map<string, HTMLDivElement>;
  private textInput: HTMLInputElement;

  constructor(node: HTMLDivElement, values: Value[]) {
    this.container = node;
    this.nodes = new Map();

    this.textInput = document.createElement("input");
    this.textInput.name = "text-input";
    this.textInput.type = "text";
    this.textInput.className = "interactive-input-new-value";
    this.textInput.placeholder = "add more people...";
    this.container.appendChild(this.textInput);
  }

  private createValueElement(value: Value): HTMLDivElement {
    const node = document.createElement("div");
    node.classList.add("interactive-input-value");
    node.innerText = value.value;
    if (!value.valid) {
      node.classList.add('interactive-input-value__invalid')
    }

    const deleteBtn = document.createElement("input");
    deleteBtn.value = "×";
    deleteBtn.type = "button";
    deleteBtn.name = "delete-value";
    deleteBtn.classList.add("interactive-input-delete-btn");
    deleteBtn.dataset["value"] = value.value;
    node.appendChild(deleteBtn);
    return node;
  }

  private appendValueNode(valueNode: HTMLDivElement) {
    this.container.insertBefore(valueNode, this.textInput);
  }

  public update(values: Value[]) {
    const valuesSet = new Set(values.map(({value}) => value));

    values.forEach((value) => {
      if (!this.nodes.has(value.value)) {
        const node = this.createValueElement(value);
        this.nodes.set(value.value, node);
        this.appendValueNode(node);
        
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
  // private interactiveInput: HTMLDivElement;

  private model: Model;
  private view: View;

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

    // this.interactiveInput = document.createElement("div");
    // this.interactiveInput.className = "interactive-input";
    // this.interactiveInputContainer.appendChild(this.interactiveInput);

    /** Init data-model and prepare for interactivity */
    this.model = new Model(valuesFromHTML);
    this.view = new View(this.interactiveInputContainer, this.model.values);
    this.model.subscribe(values => this.view.update(values));
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

  public addValue(rawInput: string): Promise<Value[]> {
    return this.model.addValue(rawInput);
  }

  public deleteValue(valueToDelete: string): Promise<Value[]> {
    return this.model.deleteValue(valueToDelete);
  }

  public getCount(): number {
    return this.model.values.length;
  }

  public getValues(): Value[] {
    return this.model.values;
  }

  public subscribe(subscriber: Subscriber) {
    return this.model.subscribe(subscriber);
  }
};
