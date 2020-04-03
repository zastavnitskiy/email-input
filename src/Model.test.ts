import { Model } from "./Model";

/**
 * Some very basic examples of unit tests
 */
describe("Model tests", () => {
  it("should initialiaze", () => {
    const m = new Model([]);
    expect(m.items.length).toEqual(0);
  });

  it("should intialize with values", () => {
    const m = new Model(["foo", "bar"]);
    expect(m.items.length).toEqual(2);
  });

  it("should be able to add and delete values more values", () => {
    const m = new Model([]);
    m.addItem("foo");
    m.addItem("bar");
    expect(m.items.length).toEqual(2);
    expect(m.items[0].value).toEqual("foo");
    expect(m.items[1].value).toEqual("bar");

    m.deleteItem("foo");
    expect(m.items[0].value).toEqual("bar");
    expect(m.items.length).toEqual(1);
  });

  it("should notify subscriber about changes", () => {
    const m = new Model([]);

    const subscriber = jest.fn();

    m.subscribe(subscriber);

    m.addItem("foo");
    m.addItem("bar");
    m.deleteItem("foo");

    expect(subscriber.mock.calls.length).toEqual(4);

    /**
     * While snapshots tests are not always optimal,
     * in some scenarios they privde a quick and visual way to validate
     * complex data structures.
     */
    expect(subscriber.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Array [],
      ]
    `);

    expect(subscriber.mock.calls[1]).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "valid": false,
            "value": "foo",
          },
        ],
      ]
    `);

    expect(subscriber.mock.calls[2]).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "valid": false,
            "value": "foo",
          },
          Object {
            "valid": false,
            "value": "bar",
          },
        ],
      ]
    `);
  });
});
