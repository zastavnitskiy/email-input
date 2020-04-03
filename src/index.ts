import "./index.css";

declare global {
  interface Window {
    EmailsInput: any;
  }
}

interface Subscriber {
  (values: Item[]): void;
}

interface Item {
  valid: boolean,
  value: string
}

class Model {
  private data: Item[];
  private subscribers: Subscriber[];

  constructor(items: string[]) {
    this.data = this.createItems(items);
    this.subscribers = [];
  }

  private createItems(values: string[]): Item[] {
    return values.map(value => value.trim()).filter(Boolean).map(value => this.createItem(value))
  }

  private createItem(value: string): Item {
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

  addItem(value: string): Promise<Item[]> {
    return new Promise((resolve, reject) => {
      try {
        const items = this.createItems(this.processRawInput(value));
        this.data = [...this.data, ...items];
      } catch (e) {
        reject("Failed to add new values");
      }

      try {
        this.notifySubscribers();
      } catch (e) {
        // this is ok
      }

      resolve(this.data);
    });
  }

  deleteItem(value: string): Promise<Item[]> {
    return new Promise((resolve, reject) => {
      try {
        this.data = this.data.filter(item => item.value !== value);
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
      subscriber(this.data);
    });
  }

  public get items(): Item[] {
    return this.data;
  }

  public subscribe(subscriber: Subscriber) {
    this.subscribers = [...this.subscribers, subscriber];
    subscriber(this.data);
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

  constructor(node: HTMLDivElement, items: Item[]) {
    this.container = node;
    this.nodes = new Map();

    this.textInput = document.createElement("input");
    this.textInput.name = "text-input";
    this.textInput.type = "text";
    this.textInput.className = "interactive-input-new-value";
    this.textInput.placeholder = "add more people...";
    this.container.appendChild(this.textInput);
  }

  private createItemNode(item: Item): HTMLDivElement {
    const node = document.createElement("div");
    node.classList.add("interactive-input-value");
    node.innerText = item.value;
    if (!item.valid) {
      node.classList.add('interactive-input-value__invalid')
    }

    const deleteBtn = document.createElement("input");
    deleteBtn.value = "×";
    deleteBtn.type = "button";
    deleteBtn.name = "delete-value";
    deleteBtn.classList.add("interactive-input-delete-btn");
    deleteBtn.dataset["value"] = item.value;
    node.appendChild(deleteBtn);

    if (item.valid) {
      const dataInput = document.createElement('input');
      dataInput.value = item.value;
      dataInput.type = 'hidden';
      dataInput.name = "email";
      node.appendChild(dataInput);
    }
    return node;
  }

  private appendItemNode(valueNode: HTMLDivElement) {
    this.container.insertBefore(valueNode, this.textInput);
  }

  public update(items: Item[]) {
    const valuesSet = new Set(items.map(({value}) => value));

    items.forEach((item) => {
      if (!this.nodes.has(item.value)) {
        const node = this.createItemNode(item);
        this.nodes.set(item.value, node);
        this.appendItemNode(node);
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
  private node: HTMLDivElement;
  private interactiveInputContainer: HTMLDivElement;

  private model: Model;
  private view: View;

  public constructor(node: HTMLDivElement, options = {}) {
    this.node = node;

    const children: HTMLInputElement[] = Array.from(
      node.querySelectorAll('input[name="email"]')
    );

    const valuesFromHTML = children.map(child => child.value);
    children.forEach(child => {
      child.setAttribute("hidden", "hidden")
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

  public getCount(): number {
    return this.model.items.length;
  }

  public getItems(): Item[] {
    return this.model.items;
  }

  public subscribe(subscriber: Subscriber) {
    return this.model.subscribe(subscriber);
  }
};
