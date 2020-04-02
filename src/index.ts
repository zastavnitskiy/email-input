import './index.css';

declare global {
  interface Window { EmailsInput: any }
}

interface Subscriber {
  (values: string[]): void
}

window.EmailsInput = class EmailsInput {

  private values: string[]
  private node: HTMLDivElement;
  private interactiveInput: HTMLDivElement;
  private textInput: HTMLDivElement;
  private subscribers: Subscriber[]

  public constructor(node: HTMLDivElement, options = {}){
    this.node = node;
    this.subscribers = [];
    const children: HTMLInputElement[] = Array.from(node.querySelectorAll('input[name="email"]'));
    children.forEach(child => child.setAttribute('type', 'hidden'));

    this.values = Array.from(children).map(child => child.value).filter(Boolean)

    this.interactiveInput = document.createElement('div');
    this.node.appendChild(this.interactiveInput);

    this.textInput = document.createElement('div');
    this.textInput.innerHTML = `<input name="text-input" type="text" value="hello" />`;
    this.node.appendChild(this.textInput);

    this.render();
    this.notifySubscribers()

    this.node.addEventListener('focusout', this.handleFocusOutEvent.bind(this))
    this.node.addEventListener('keydown', this.handleKeydownEvent.bind(this))
    this.node.addEventListener('click', this.handleClick.bind(this))
    this.node.addEventListener('input', this.handleInputEvent.bind(this))
  }

  private processRawInput(rawInput: string): string[] {
    const values = rawInput.split(',').map(s => s.trim()).filter(Boolean)

    return values;
  }

  private handleClick(event: MouseEvent) {
    if (!event.target) {
      return;
    }

    const target = event.target as HTMLButtonElement;

    if (target.name === 'delete-value') {
      event.preventDefault();
      const email = target.dataset['value'];
      
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

    if (target.name === 'text-input') {
      if (keyCode === 13) {
          event.preventDefault();
    
          this.addValue(target.value)
          target.value = '';
      }
    } 
  }

  private handleInputEvent(event: Event) {
    if (!event.target) {
      return;
    }
    
    const target = event.target as HTMLInputElement;
    const value = target.value;
    if (target.name === "text-input" && value.trim().endsWith(',')) {
      this.addValue(target.value);
      target.value = '';
    }

  }

  private handleFocusOutEvent(event: FocusEvent) {

    console.log('blur event')
    if (!event.target) {
      return;
    }
    
    const target = event.target as HTMLInputElement;

    if (target.name === 'text-input') {
      this.addValue(target.value)
      target.value = '';
    }
  }

  private render() {
    let markup = '';
    this.values.forEach(value => {
      markup += `<div>${value} <button name="delete-value" data-value="${value}">×</button></div>`
    });

    this.interactiveInput.innerHTML = markup;
  }

  private notifySubscribers() {
    this.subscribers.forEach(subscriber => {
      subscriber(this.values);
    })
  }

  public addValue(valueToAdd: string): void {
    const values = this.processRawInput(valueToAdd);
    values.forEach(value => this.values.push(value))
    this.render();
    this.notifySubscribers();
  }

  public deleteValue(valueToDelete: string): void {
    this.values = this.values.filter(value => value !== valueToDelete);
    this.render();
    this.notifySubscribers();
  }
  
  public getCount(): number {
    return this.values.length
  }

  public subscribe(subscriber: Subscriber) {
    this.subscribers = [...this.subscribers, subscriber];
    subscriber(this.values);
    return () => this.subscribers = this.subscribers.filter(existingSubscriber => existingSubscriber !== subscriber);
  }
 
  
};



