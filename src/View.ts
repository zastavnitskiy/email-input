import { Item } from "./Model";
export class View {
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
      node.classList.add("interactive-input-value__invalid");
    }
    const deleteBtn = document.createElement("input");
    deleteBtn.value = "×";
    deleteBtn.type = "button";
    deleteBtn.name = "delete-value";
    deleteBtn.classList.add("interactive-input-delete-btn");
    deleteBtn.dataset["value"] = item.value;
    node.appendChild(deleteBtn);
    if (item.valid) {
      const dataInput = document.createElement("input");
      dataInput.value = item.value;
      dataInput.type = "hidden";
      dataInput.name = "email";
      node.appendChild(dataInput);
    }
    return node;
  }
  private appendItemNode(valueNode: HTMLDivElement) {
    this.container.insertBefore(valueNode, this.textInput);
  }
  public update(items: Item[]) {
    const valuesSet = new Set(items.map(({ value }) => value));
    items.forEach(item => {
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
