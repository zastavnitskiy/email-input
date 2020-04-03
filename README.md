# Reusable email input
This library implements reusable multi-email input. It contains no external dependencies and supports modern browsers and IE11.

Preview: https://email-input.netlify.app

## Usage example
### Basic 
Most basic example looks like this — email input is instancied inside of a custom div element:

```html

  <form class="interactive-input-preview">
    <div id="custom-input">
    </div>
  </form>

  <script>
    window.addEventListener("DOMContentLoaded", function () {
      new EmailsInput(document.querySelector("#custom-input"));
    });
  </script>

```
### Example with pre-filled data, custom markup and API usage.
The component is designed to work in server-side rendered markup. 

This example shows several features — custom header and pre-filled values.

```html

      <div id="emails-input">
        <h2>Share <strong>Board name</strong> with others</h2>
        
        <!-- these values will be picked up when component will be initialized -->
        <input type="text" name="email" value="john@miro.com" />
        <input type="text" name="email" value="invalid.email" />
        <input type="text" name="email" value="mike@miro.com" />
        <input type="text" name="email" value="alexander@miro.com" />
      </div>

    <script>
      window.addEventListener("DOMContentLoaded", function () {
        var emailsInput = new EmailsInput(document.querySelector("#emails-input"), {});

        document.getElementById("add-email").addEventListener("click", e => {
          e.preventDefault();
          emailsInput.addItem(randomEmail());
        });

        document
          .getElementById("get-emails-count")
          .addEventListener("click", e => {
            e.preventDefault();

            window.alert(emailsInput.getCount());
          });

        emailsInput.subscribe(list => {
          console.log("Emails in the list", list);
        });
      });</script>

```

Same way as values go in, they go out — newly entered emails are 
appended to the form. This way, when the form is submitted, no additional scripting is required.

## API methods

Once created, an instance of the EmailInput supports several api method.

#### `addItem(newEmail: string): Promise`
Add new email to the list.

#### `deleteItem(existingEmail:string): Promise`
Delete existing email from the list.

Note that these two methods return promises — those promises will be rejected if adding or removing will fail for internal reason.

#### `getAll()`
Get all emails.

#### `replaceAll(newEmails: string[])`
Replace emails with new values. This is also a convinient way to reset the input.

#### `subscribe(subscriber: function)`
Subscribe to the changes in the input.

## Architecture overview and some reflection

Because the task disallowed using any dependencies, I used a poor-man MVC architecture to have some structure.
`Model.ts` is responsible for storing the data, `View.ts` is responsible for rendering, and controller in `index.ts`
is conneting all the pieces together. 

Event-delegation and magic class-names are used to listen to events on specific elements — this is okay, but not the most
future proof solution. I would avoid using it commercial project — would come up with something that doesn't rely in magic class names and attributes.

### Next steps & known issues

1. This component can be generic for any value — validation is the only thing that makes it specific to emails.
We can easily extract validation function into an option.

2. This project was bootstrapped with Create React App - it's a quick and bullet-proof way to start with 
ES6 or Typescript project. However, if we would like to prepare this library for publishing into
npm or deploy to a CDN, we will need to properly pack as a UMD module. This would require using a customer build tool configuration.

3. CSS class names are long and descriptive, but there is no guarantee that we won't have a class name collision with 
some user-land class names. For production usage, we would need to have either obscure classnames, or generate them in runtime.

4. In it's current state, input doesn't allow duplicate values — but doesn't provide any feedback if user attemps to enter a duplicate.
This is bad UX — we can improve it by either allowing duplicates, of giving user feedback about failed attemps.
