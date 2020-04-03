export interface Subscriber {
  (values: Item[]): void;
}
export interface Item {
  valid: boolean;
  value: string;
}
export class Model {
  private data: Item[];
  private subscribers: Subscriber[];
  
  constructor(items: string[]) {
    this.data = this.createItems(items);
    this.subscribers = [];
  }
  
  private createItems(values: string[]): Item[] {
    return values
      .map(value => value.trim())
      .filter(Boolean)
      .map(value => this.createItem(value));
  }
  
  private createItem(value: string): Item {
    return {
      valid: this.validate(value),
      value
    };
  }
  
  private validate(text: string): boolean {
    // eslint-disable-next-line 
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(text.toLowerCase());
  }
  
  private processRawInput(rawInput: string): string[] {
    const values = rawInput.split(",");
    return values;
  }

  public addItem(value: string): Promise<Item[]> {
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

  public deleteItem(value: string): Promise<Item[]> {
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
